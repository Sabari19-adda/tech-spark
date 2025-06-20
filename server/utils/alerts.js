import Alert from '../models/Alert.js';

export const checkAndCreateAlerts = async (product) => {
  try {
    const alerts = [];
    const totalStock = product.warehouseStock + product.shelfStock;

    // Check for low stock alert
    if (totalStock <= product.minThreshold) {
      const existingLowStockAlert = await Alert.findOne({
        productId: product._id,
        type: 'low_stock',
        resolved: false
      });

      if (!existingLowStockAlert) {
        alerts.push({
          type: 'low_stock',
          productId: product._id,
          message: `${product.description} stock is below threshold (${totalStock}/${product.minThreshold})`,
          severity: totalStock === 0 ? 'high' : 'medium',
          metadata: {
            currentStock: totalStock,
            threshold: product.minThreshold
          }
        });
      }
    }

    // Check for expiry warning
    const expiryDate = new Date(product.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
      const existingExpiryAlert = await Alert.findOne({
        productId: product._id,
        type: 'expiry_warning',
        resolved: false
      });

      if (!existingExpiryAlert) {
        alerts.push({
          type: 'expiry_warning',
          productId: product._id,
          message: `${product.description} will expire in ${daysUntilExpiry} day(s)`,
          severity: daysUntilExpiry <= 1 ? 'high' : 'medium',
          metadata: {
            daysUntilExpiry,
            expiryDate: product.expiryDate
          }
        });
      }
    }

    // Check for damaged goods
    if (product.damageStatus !== 'none') {
      const existingDamageAlert = await Alert.findOne({
        productId: product._id,
        type: 'damaged_goods',
        resolved: false
      });

      if (!existingDamageAlert) {
        alerts.push({
          type: 'damaged_goods',
          productId: product._id,
          message: `${product.description} has damage status: ${product.damageStatus}`,
          severity: 'high',
          metadata: {
            damageType: product.damageStatus,
            currentStock: totalStock
          }
        });
      }
    }

    // Create alerts if any
    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    return alerts;
  } catch (error) {
    console.error('Error checking and creating alerts:', error);
    return [];
  }
};

export const runPeriodicAlertCheck = async () => {
  try {
    const Product = (await import('../models/Product.js')).default;
    const products = await Product.find({ status: 'approved' });
    
    for (const product of products) {
      await checkAndCreateAlerts(product);
    }
    
    console.log(`Checked ${products.length} products for alerts`);
  } catch (error) {
    console.error('Error in periodic alert check:', error);
  }
};