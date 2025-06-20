import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Alert, Invoice } from '../types';

interface InventoryContextType {
  products: Product[];
  alerts: Alert[];
  invoices: Invoice[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  approveProduct: (id: string, approverId: string) => void;
  rejectProduct: (id: string, approverId: string) => void;
  transferStock: (id: string, amount: number) => void;
  generateBarcode: (id: string) => string;
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  resolveAlert: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  checkAlerts: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Initialize with sample data
  useEffect(() => {
    const sampleProducts: Product[] = [
      {
        id: '1',
        vendorCode: 'VND001',
        category: 'Dairy',
        description: 'Fresh Milk 1L',
        warehouseStock: 150,
        shelfStock: 45,
        cost: 3.99,
        currency: 'USD',
        expiryDate: '2025-02-15',
        createdAt: '2025-01-08',
        status: 'approved',
        createdBy: 'maker',
        approvedBy: 'checker',
        barcode: '1234567890123',
        minThreshold: 20,
        damageStatus: 'none'
      },
      {
        id: '2',
        vendorCode: 'VND002',
        category: 'Produce',
        description: 'Organic Bananas',
        warehouseStock: 12,
        shelfStock: 8,
        cost: 2.49,
        currency: 'USD',
        expiryDate: '2025-01-12',
        createdAt: '2025-01-08',
        status: 'approved',
        createdBy: 'maker',
        approvedBy: 'checker',
        barcode: '1234567890124',
        minThreshold: 15,
        damageStatus: 'none'
      }
    ];
    setProducts(sampleProducts);
    
    // Generate initial alerts
    const initialAlerts: Alert[] = [
      {
        id: '1',
        type: 'low_stock',
        productId: '2',
        message: 'Organic Bananas stock is below threshold',
        severity: 'high',
        createdAt: '2025-01-08',
        resolved: false
      },
      {
        id: '2',
        type: 'expiry_warning',
        productId: '2',
        message: 'Organic Bananas will expire in 4 days',
        severity: 'medium',
        createdAt: '2025-01-08',
        resolved: false
      }
    ];
    setAlerts(initialAlerts);
  }, []);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      warehouseStock: 0,
      shelfStock: 0
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const approveProduct = (id: string, approverId: string) => {
    updateProduct(id, { status: 'approved', approvedBy: approverId });
  };

  const rejectProduct = (id: string, approverId: string) => {
    updateProduct(id, { status: 'rejected', approvedBy: approverId });
  };

  const transferStock = (id: string, amount: number) => {
    const product = products.find(p => p.id === id);
    if (product && product.warehouseStock >= amount) {
      updateProduct(id, {
        warehouseStock: product.warehouseStock - amount,
        shelfStock: product.shelfStock + amount
      });
    }
  };

  const generateBarcode = (id: string): string => {
    const barcode = `EMT${id.padStart(10, '0')}`;
    updateProduct(id, { barcode });
    return barcode;
  };

  const addAlert = (alert: Omit<Alert, 'id' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setInvoices(prev => [...prev, newInvoice]);
  };

  const checkAlerts = () => {
    products.forEach(product => {
      const totalStock = product.warehouseStock + product.shelfStock;
      
      // Check low stock
      if (totalStock <= product.minThreshold) {
        const existingAlert = alerts.find(a => a.productId === product.id && a.type === 'low_stock' && !a.resolved);
        if (!existingAlert) {
          addAlert({
            type: 'low_stock',
            productId: product.id,
            message: `${product.description} stock is below threshold`,
            severity: 'high',
            resolved: false
          });
        }
      }

      // Check expiry warnings
      const expiryDate = new Date(product.expiryDate);
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 3);
      
      if (expiryDate <= warningDate) {
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const existingAlert = alerts.find(a => a.productId === product.id && a.type === 'expiry_warning' && !a.resolved);
        if (!existingAlert && daysUntilExpiry >= 0) {
          addAlert({
            type: 'expiry_warning',
            productId: product.id,
            message: `${product.description} will expire in ${daysUntilExpiry} day(s)`,
            severity: daysUntilExpiry <= 1 ? 'high' : 'medium',
            resolved: false
          });
        }
      }
    });
  };

  // Check alerts periodically
  useEffect(() => {
    const interval = setInterval(checkAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [products, alerts]);

  return (
    <InventoryContext.Provider value={{
      products,
      alerts,
      invoices,
      addProduct,
      updateProduct,
      approveProduct,
      rejectProduct,
      transferStock,
      generateBarcode,
      addAlert,
      resolveAlert,
      addInvoice,
      checkAlerts
    }}>
      {children}
    </InventoryContext.Provider>
  );
};