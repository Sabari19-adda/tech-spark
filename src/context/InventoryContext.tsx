import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Alert, Invoice } from '../types';
import apiService from '../services/api';

interface InventoryContextType {
  products: Product[];
  alerts: Alert[];
  invoices: Invoice[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  approveProduct: (id: string, approverId: string) => Promise<void>;
  rejectProduct: (id: string, approverId: string) => Promise<void>;
  transferStock: (id: string, amount: number) => Promise<void>;
  generateBarcode: (id: string) => Promise<string>;
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  refreshData: () => Promise<void>;
  uploadCSV: (file: File) => Promise<void>;
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
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [productsResponse, alertsResponse, invoicesResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getAlerts(),
        apiService.getInvoices().catch(() => ({ invoices: [] })) // Invoices might not be accessible to all roles
      ]);

      setProducts(productsResponse.products || []);
      setAlerts(alertsResponse.alerts || []);
      setInvoices(invoicesResponse.invoices || []);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createProduct(productData);
      await refreshData(); // Refresh to get updated data
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await apiService.updateProduct(id, updates);
      await refreshData();
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const approveProduct = async (id: string, approverId: string) => {
    try {
      await apiService.approveProduct(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to approve product:', error);
      throw error;
    }
  };

  const rejectProduct = async (id: string, approverId: string) => {
    try {
      await apiService.rejectProduct(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to reject product:', error);
      throw error;
    }
  };

  const transferStock = async (id: string, amount: number) => {
    try {
      await apiService.transferStock(id, amount);
      await refreshData();
    } catch (error) {
      console.error('Failed to transfer stock:', error);
      throw error;
    }
  };

  const generateBarcode = async (id: string): Promise<string> => {
    try {
      const response = await apiService.generateBarcode(id);
      await refreshData();
      return response.barcode;
    } catch (error) {
      console.error('Failed to generate barcode:', error);
      throw error;
    }
  };

  const addAlert = async (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
    try {
      await apiService.createAlert(alertData);
      await refreshData();
    } catch (error) {
      console.error('Failed to add alert:', error);
      throw error;
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await apiService.resolveAlert(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      await apiService.createInvoice(invoiceData);
      await refreshData();
    } catch (error) {
      console.error('Failed to add invoice:', error);
      throw error;
    }
  };

  const uploadCSV = async (file: File) => {
    try {
      await apiService.uploadCSV(file);
      await refreshData();
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      throw error;
    }
  };

  return (
    <InventoryContext.Provider value={{
      products,
      alerts,
      invoices,
      loading,
      addProduct,
      updateProduct,
      approveProduct,
      rejectProduct,
      transferStock,
      generateBarcode,
      addAlert,
      resolveAlert,
      addInvoice,
      refreshData,
      uploadCSV
    }}>
      {children}
    </InventoryContext.Provider>
  );
};