import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import crypto from 'crypto';
import Product from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Upload CSV file with products
router.post('/csv', authenticate, authorize('maker', 'admin'), upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const filePath = req.file.path;
    const products = [];
    let headerInfo = null;

    // Read and parse CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    if (lines.length < 2) {
      fs.unlinkSync(filePath); // Clean up uploaded file
      return res.status(400).json({ message: 'CSV file must contain header and at least one product row' });
    }

    // Parse header line
    const headerLine = lines[0].trim();
    const headerParts = headerLine.split(',');
    
    if (headerParts.length !== 4) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Invalid header format. Expected: rowCount,totalAmount,timestamp,hashCode' });
    }

    headerInfo = {
      rowCount: parseInt(headerParts[0]),
      totalAmount: parseFloat(headerParts[1]),
      timestamp: headerParts[2],
      hashCode: headerParts[3]
    };

    // Verify hash (basic integrity check)
    const dataToHash = lines.slice(1, headerInfo.rowCount + 1).join('\n');
    const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    
    if (calculatedHash !== headerInfo.hashCode) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'File integrity check failed. Hash mismatch.' });
    }

    // Parse product rows
    for (let i = 1; i <= headerInfo.rowCount && i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length !== 8) {
        continue; // Skip invalid rows
      }

      const [id, vendorCode, category, description, count, cost, currency, expiryDate] = parts;

      products.push({
        vendorCode: vendorCode.trim(),
        category: category.trim(),
        description: description.trim(),
        warehouseStock: parseInt(count) || 0,
        cost: parseFloat(cost) || 0,
        currency: currency.trim() || 'USD',
        expiryDate: new Date(expiryDate.trim()),
        status: 'pending',
        createdBy: req.user._id,
        minThreshold: 10, // Default threshold
        damageStatus: 'none',
        supplierInvoice: `INV-${Date.now()}-${i}`
      });
    }

    // Validate products
    if (products.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'No valid products found in CSV file' });
    }

    // Save products to database
    const savedProducts = await Product.insertMany(products);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `Successfully imported ${savedProducts.length} products`,
      imported: savedProducts.length,
      headerInfo,
      products: savedProducts
    });

  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error uploading CSV:', error);
    res.status(500).json({ message: 'Error processing CSV file', error: error.message });
  }
});

// Generate sample CSV file
router.get('/sample-csv', authenticate, (req, res) => {
  try {
    const sampleData = [
      'ID001,VND001,Dairy,Fresh Milk 1L,100,3.99,USD,2025-02-15',
      'ID002,VND002,Produce,Organic Bananas,50,2.49,USD,2025-01-20',
      'ID003,VND003,Bakery,Whole Wheat Bread,25,4.99,USD,2025-01-18',
      'ID004,VND004,Meat,Ground Beef 1lb,30,8.99,USD,2025-01-25',
      'ID005,VND005,Dairy,Greek Yogurt,40,5.99,USD,2025-01-30'
    ];

    // Calculate hash for integrity
    const dataString = sampleData.join('\n');
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    
    // Create header
    const totalAmount = sampleData.reduce((sum, line) => {
      const parts = line.split(',');
      const quantity = parseInt(parts[4]);
      const cost = parseFloat(parts[5]);
      return sum + (quantity * cost);
    }, 0);

    const header = `${sampleData.length},${totalAmount.toFixed(2)},${new Date().toISOString()},${hash}`;
    
    const csvContent = [header, ...sampleData].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample-products.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Error generating sample CSV:', error);
    res.status(500).json({ message: 'Error generating sample CSV', error: error.message });
  }
});

export default router;