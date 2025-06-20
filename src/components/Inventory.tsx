import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Package,
  ShoppingCart,
  ArrowRight,
  Download,
  BarChart3,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export const Inventory: React.FC = () => {
  const { products, addProduct, approveProduct, rejectProduct, transferStock, generateBarcode, uploadCSV, loading } = useInventory();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showTransferModal, setShowTransferModal] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    vendorCode: '',
    category: '',
    description: '',
    cost: '',
    currency: 'USD',
    expiryDate: '',
    minThreshold: '',
    supplierInvoice: ''
  });

  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendorCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await addProduct({
        ...newProduct,
        cost: parseFloat(newProduct.cost),
        minThreshold: parseInt(newProduct.minThreshold),
        status: 'pending',
        createdBy: user?.id || '',
        damageStatus: 'none',
        warehouseStock: 0,
        shelfStock: 0
      });

      setNewProduct({
        vendorCode: '',
        category: '',
        description: '',
        cost: '',
        currency: 'USD',
        expiryDate: '',
        minThreshold: '',
        supplierInvoice: ''
      });
      setShowAddForm(false);
    } catch (error: any) {
      setError(error.message || 'Failed to add product');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await uploadCSV(file);
    } catch (error: any) {
      setError(error.message || 'Failed to upload CSV file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTransferStock = async () => {
    if (showTransferModal && transferAmount) {
      setError(null);
      try {
        await transferStock(showTransferModal, parseInt(transferAmount));
        setShowTransferModal(null);
        setTransferAmount('');
      } catch (error: any) {
        setError(error.message || 'Failed to transfer stock');
      }
    }
  };

  const handleApprove = async (productId: string) => {
    setError(null);
    try {
      await approveProduct(productId, user?.id || '');
    } catch (error: any) {
      setError(error.message || 'Failed to approve product');
    }
  };

  const handleReject = async (productId: string) => {
    setError(null);
    try {
      await rejectProduct(productId, user?.id || '');
    } catch (error: any) {
      setError(error.message || 'Failed to reject product');
    }
  };

  const handleGenerateBarcode = async (productId: string) => {
    setError(null);
    try {
      await generateBarcode(productId);
    } catch (error: any) {
      setError(error.message || 'Failed to generate barcode');
    }
  };

  const canApprove = user?.role === 'checker' || user?.role === 'admin';
  const canAdd = user?.role === 'maker' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your grocery inventory and stock levels</p>
        </div>
        
        <div className="flex space-x-3">
          {canAdd && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>{uploading ? 'Uploading...' : 'Upload CSV'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.status === 'approved' ? 'bg-green-100 text-green-800' :
                    product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                  
                  {product.barcode && (
                    <div className="text-xs text-gray-500">
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      {product.barcode}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.description}</h3>
                  <p className="text-sm text-gray-600">Vendor: {product.vendorCode}</p>
                  <p className="text-sm text-gray-600">Category: {product.category}</p>
                </div>

                {/* Stock Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Warehouse</p>
                    <p className="text-lg font-semibold text-blue-600">{product.warehouseStock}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Shelf</p>
                    <p className="text-lg font-semibold text-green-600">{product.shelfStock}</p>
                  </div>
                </div>

                {/* Price and Expiry */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{product.cost} {product.currency}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(product.expiryDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {product.status === 'pending' && canApprove && (
                    <>
                      <button
                        onClick={() => handleApprove(product.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(product.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  
                  {product.status === 'approved' && (
                    <>
                      {product.warehouseStock > 0 && (
                        <button
                          onClick={() => setShowTransferModal(product.id)}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ArrowRight className="h-4 w-4" />
                          <span>Transfer</span>
                        </button>
                      )}
                      
                      {!product.barcode && (
                        <button
                          onClick={() => handleGenerateBarcode(product.id)}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>Barcode</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products found matching your criteria</p>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Product</h2>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Code</label>
                <input
                  type="text"
                  value={newProduct.vendorCode}
                  onChange={(e) => setNewProduct({...newProduct, vendorCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={newProduct.currency}
                    onChange={(e) => setNewProduct({...newProduct, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newProduct.expiryDate}
                  onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Threshold</label>
                <input
                  type="number"
                  value={newProduct.minThreshold}
                  onChange={(e) => setNewProduct({...newProduct, minThreshold: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transfer Stock</h2>
            <p className="text-gray-600 mb-4">Transfer stock from warehouse to shelf</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Transfer</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter amount"
                min="1"
                max={products.find(p => p.id === showTransferModal)?.warehouseStock || 0}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleTransferStock}
                className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Transfer
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(null);
                  setTransferAmount('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};