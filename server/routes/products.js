import express from 'express';
import Product from '../models/Product.js';
import Alert from '../models/Alert.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateBarcode } from '../utils/barcode.js';
import { checkAndCreateAlerts } from '../utils/alerts.js';

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { vendorCode: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get single product
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Create new product (maker and admin only)
router.post('/', authenticate, authorize('maker', 'admin'), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    // Check for alerts after creating product
    await checkAndCreateAlerts(product);

    await product.populate('createdBy', 'name username');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Update product
router.put('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check permissions
    if (req.user.role === 'maker' && product.status !== 'pending') {
      return res.status(403).json({ message: 'Cannot modify approved/rejected products' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name username')
     .populate('approvedBy', 'name username');

    // Check for alerts after updating product
    await checkAndCreateAlerts(updatedProduct);

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Approve product (checker and admin only)
router.post('/:id/approve', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Product is not pending approval' });
    }

    product.status = 'approved';
    product.approvedBy = req.user._id;
    await product.save();

    await product.populate('createdBy', 'name username');
    await product.populate('approvedBy', 'name username');

    res.json({
      message: 'Product approved successfully',
      product
    });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ message: 'Error approving product', error: error.message });
  }
});

// Reject product (checker and admin only)
router.post('/:id/reject', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Product is not pending approval' });
    }

    product.status = 'rejected';
    product.approvedBy = req.user._id;
    await product.save();

    await product.populate('createdBy', 'name username');
    await product.populate('approvedBy', 'name username');

    res.json({
      message: 'Product rejected successfully',
      product
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({ message: 'Error rejecting product', error: error.message });
  }
});

// Transfer stock from warehouse to shelf
router.post('/:id/transfer', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'approved') {
      return res.status(400).json({ message: 'Product must be approved for stock transfer' });
    }

    if (product.warehouseStock < amount) {
      return res.status(400).json({ message: 'Insufficient warehouse stock' });
    }

    // Update stock
    product.warehouseStock -= amount;
    product.shelfStock += amount;

    // Add stock movement record
    product.stockMovements.push({
      type: 'transfer',
      quantity: amount,
      from: 'warehouse',
      to: 'shelf',
      performedBy: req.user._id,
      reason: 'Stock transfer to shelf'
    });

    await product.save();

    // Check for alerts after stock transfer
    await checkAndCreateAlerts(product);

    res.json({
      message: 'Stock transferred successfully',
      product
    });
  } catch (error) {
    console.error('Error transferring stock:', error);
    res.status(500).json({ message: 'Error transferring stock', error: error.message });
  }
});

// Generate barcode for product
router.post('/:id/barcode', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'approved') {
      return res.status(400).json({ message: 'Product must be approved to generate barcode' });
    }

    if (product.barcode) {
      return res.status(400).json({ message: 'Product already has a barcode' });
    }

    const barcode = generateBarcode(product._id);
    product.barcode = barcode;
    await product.save();

    res.json({
      message: 'Barcode generated successfully',
      barcode,
      product
    });
  } catch (error) {
    console.error('Error generating barcode:', error);
    res.status(500).json({ message: 'Error generating barcode', error: error.message });
  }
});

// Get product categories
router.get('/meta/categories', authenticate, async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

export default router;