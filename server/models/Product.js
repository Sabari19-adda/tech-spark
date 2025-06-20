import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  vendorCode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  warehouseStock: {
    type: Number,
    default: 0,
    min: 0
  },
  shelfStock: {
    type: Number,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'CAD'],
    default: 'USD'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  minThreshold: {
    type: Number,
    required: true,
    min: 0
  },
  damageStatus: {
    type: String,
    enum: ['none', 'transport', 'shopping', 'expired'],
    default: 'none'
  },
  supplierInvoice: {
    type: String,
    trim: true
  },
  stockMovements: [{
    type: {
      type: String,
      enum: ['in', 'out', 'transfer', 'damage'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    from: {
      type: String,
      enum: ['warehouse', 'shelf', 'supplier', 'customer']
    },
    to: {
      type: String,
      enum: ['warehouse', 'shelf', 'supplier', 'customer']
    },
    reason: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ vendorCode: 1, category: 1 });
productSchema.index({ expiryDate: 1 });
productSchema.index({ status: 1, createdAt: -1 });

// Virtual for total stock
productSchema.virtual('totalStock').get(function() {
  return this.warehouseStock + this.shelfStock;
});

// Method to check if stock is low
productSchema.methods.isLowStock = function() {
  return this.totalStock <= this.minThreshold;
};

// Method to check if expiring soon
productSchema.methods.isExpiringSoon = function(days = 3) {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  return this.expiryDate <= warningDate;
};

export default mongoose.model('Product', productSchema);