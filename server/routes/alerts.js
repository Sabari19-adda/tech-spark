import express from 'express';
import Alert from '../models/Alert.js';
import Product from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';
import { sendAlertEmail } from '../utils/email.js';

const router = express.Router();

// Get all alerts with filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      resolved,
      type,
      severity,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const alerts = await Alert.find(filter)
      .populate('productId', 'description vendorCode category warehouseStock shelfStock minThreshold expiryDate')
      .populate('resolvedBy', 'name username')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(filter);

    res.json({
      alerts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
});

// Get alert statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$resolved', true] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } }
        }
      }
    ]);

    const typeStats = await Alert.aggregate([
      { $match: { resolved: false } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overall: stats[0] || {
        total: 0,
        active: 0,
        resolved: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byType: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ message: 'Error fetching alert stats', error: error.message });
  }
});

// Resolve alert
router.post('/:id/resolve', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.resolved) {
      return res.status(400).json({ message: 'Alert is already resolved' });
    }

    await alert.resolve(req.user._id);

    await alert.populate('productId', 'description vendorCode category');
    await alert.populate('resolvedBy', 'name username');

    res.json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert', error: error.message });
  }
});

// Send alert email
router.post('/:id/send-email', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('productId', 'description vendorCode category warehouseStock shelfStock minThreshold expiryDate');
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.emailSent) {
      return res.status(400).json({ message: 'Email already sent for this alert' });
    }

    await sendAlertEmail(alert);

    alert.emailSent = true;
    alert.emailSentAt = new Date();
    await alert.save();

    res.json({
      message: 'Alert email sent successfully',
      alert
    });
  } catch (error) {
    console.error('Error sending alert email:', error);
    res.status(500).json({ message: 'Error sending alert email', error: error.message });
  }
});

// Create manual alert
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, productId, message, severity, metadata } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alert = new Alert({
      type,
      productId,
      message,
      severity,
      metadata
    });

    await alert.save();
    await alert.populate('productId', 'description vendorCode category');

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Error creating alert', error: error.message });
  }
});

export default router;