import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['low_stock', 'expiry_warning', 'damaged_goods', 'approval_required'],
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  metadata: {
    currentStock: Number,
    threshold: Number,
    daysUntilExpiry: Number,
    damageType: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
alertSchema.index({ resolved: 1, createdAt: -1 });
alertSchema.index({ type: 1, severity: 1 });
alertSchema.index({ productId: 1, resolved: 1 });

// Method to resolve alert
alertSchema.methods.resolve = function(userId) {
  this.resolved = true;
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  return this.save();
};

export default mongoose.model('Alert', alertSchema);