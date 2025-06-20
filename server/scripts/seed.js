import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emart_inventory');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [
      {
        username: 'admin',
        email: 'admin@emart.com',
        password: 'password123',
        name: 'System Administrator',
        role: 'admin'
      },
      {
        username: 'maker',
        email: 'maker@emart.com',
        password: 'password123',
        name: 'Inventory Maker',
        role: 'maker'
      },
      {
        username: 'checker',
        email: 'checker@emart.com',
        password: 'password123',
        name: 'Inventory Checker',
        role: 'checker'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users:', createdUsers.map(u => u.username));

    // Create sample products
    const makerUser = createdUsers.find(u => u.role === 'maker');
    const checkerUser = createdUsers.find(u => u.role === 'checker');

    const products = [
      {
        vendorCode: 'VND001',
        category: 'Dairy',
        description: 'Fresh Milk 1L',
        warehouseStock: 150,
        shelfStock: 45,
        cost: 3.99,
        currency: 'USD',
        expiryDate: new Date('2025-02-15'),
        status: 'approved',
        createdBy: makerUser._id,
        approvedBy: checkerUser._id,
        barcode: '1234567890123',
        minThreshold: 20,
        damageStatus: 'none',
        supplierInvoice: 'INV-2025-001'
      },
      {
        vendorCode: 'VND002',
        category: 'Produce',
        description: 'Organic Bananas',
        warehouseStock: 12,
        shelfStock: 8,
        cost: 2.49,
        currency: 'USD',
        expiryDate: new Date('2025-01-20'),
        status: 'approved',
        createdBy: makerUser._id,
        approvedBy: checkerUser._id,
        barcode: '1234567890124',
        minThreshold: 15,
        damageStatus: 'none',
        supplierInvoice: 'INV-2025-002'
      },
      {
        vendorCode: 'VND003',
        category: 'Bakery',
        description: 'Whole Wheat Bread',
        warehouseStock: 25,
        shelfStock: 15,
        cost: 4.99,
        currency: 'USD',
        expiryDate: new Date('2025-01-18'),
        status: 'pending',
        createdBy: makerUser._id,
        minThreshold: 10,
        damageStatus: 'none',
        supplierInvoice: 'INV-2025-003'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log('Created products:', createdProducts.map(p => p.description));

    console.log('Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin / password123');
    console.log('Maker: maker / password123');
    console.log('Checker: checker / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();