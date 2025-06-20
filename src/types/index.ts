export interface User {
  id: string;
  username: string;
  email: string;
  role: 'maker' | 'checker' | 'admin';
  name: string;
}

export interface Product {
  id: string;
  vendorCode: string;
  category: string;
  description: string;
  warehouseStock: number;
  shelfStock: number;
  cost: number;
  currency: string;
  expiryDate: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  barcode?: string;
  minThreshold: number;
  damageStatus?: 'none' | 'transport' | 'shopping' | 'expired';
  supplierInvoice?: string;
}

export interface Invoice {
  id: string;
  vendorCode: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  currency: string;
  products: string[];
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  dueDate: string;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'expiry_warning' | 'damaged_goods';
  productId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}

export interface FileUploadData {
  rowCount: number;
  totalAmount: number;
  timestamp: string;
  hashCode: string;
  products: Omit<Product, 'id' | 'createdAt' | 'status' | 'createdBy' | 'warehouseStock' | 'shelfStock' | 'minThreshold'>[];
}