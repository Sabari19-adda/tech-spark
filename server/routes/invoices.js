import express from 'express';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import { sendInvoiceEmail } from '../utils/email.js';

const router = express.Router();

// Get all invoices with filtering
router.get('/', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      status,
      vendorCode,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (vendorCode) {
      filter.vendorCode = { $regex: vendorCode, $options: 'i' };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const invoices = await Invoice.find(filter)
      .populate('products.productId', 'description vendorCode category')
      .populate('createdBy', 'name username')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(filter);

    res.json({
      invoices,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// Get single invoice
router.get('/:id', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('products.productId', 'description vendorCode category')
      .populate('createdBy', 'name username');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
});

// Create new invoice
router.post('/', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Validate products exist
    if (invoiceData.products && invoiceData.products.length > 0) {
      const productIds = invoiceData.products.map(p => p.productId);
      const existingProducts = await Product.find({ _id: { $in: productIds } });
      
      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({ message: 'One or more products not found' });
      }
    }

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    await invoice.populate('products.productId', 'description vendorCode category');
    await invoice.populate('createdBy', 'name username');

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
});

// Update invoice
router.put('/:id', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Cannot modify paid invoices' });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('products.productId', 'description vendorCode category')
     .populate('createdBy', 'name username');

    res.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
});

// Generate PDF for invoice
router.post('/:id/pdf', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('products.productId', 'description vendorCode category')
      .populate('createdBy', 'name username');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// Send invoice email
router.post('/:id/send-email', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('products.productId', 'description vendorCode category')
      .populate('createdBy', 'name username');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await sendInvoiceEmail(invoice);

    invoice.emailSent = true;
    invoice.emailSentAt = new Date();
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
    }
    await invoice.save();

    res.json({
      message: 'Invoice email sent successfully',
      invoice
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Error sending invoice email', error: error.message });
  }
});

// Mark invoice as paid
router.post('/:id/mark-paid', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice is already marked as paid' });
    }

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    await invoice.save();

    await invoice.populate('products.productId', 'description vendorCode category');
    await invoice.populate('createdBy', 'name username');

    res.json({
      message: 'Invoice marked as paid successfully',
      invoice
    });
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ message: 'Error marking invoice as paid', error: error.message });
  }
});

// Get invoice statistics
router.get('/stats/summary', authenticate, authorize('checker', 'admin'), async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalIncoming: {
            $sum: {
              $cond: [{ $eq: ['$type', 'incoming'] }, '$amount', 0]
            }
          },
          totalOutgoing: {
            $sum: {
              $cond: [{ $eq: ['$type', 'outgoing'] }, '$amount', 0]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [{ $ne: ['$status', 'paid'] }, 1, 0]
            }
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalIncoming: 0,
      totalOutgoing: 0,
      pendingCount: 0,
      paidCount: 0
    });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ message: 'Error fetching invoice stats', error: error.message });
  }
});

export default router;