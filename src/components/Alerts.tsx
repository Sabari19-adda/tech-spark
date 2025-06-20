import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  CheckCircle,
  X,
  Calendar,
  TrendingDown
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export const Alerts: React.FC = () => {
  const { alerts, products, resolveAlert } = useInventory();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <TrendingDown className="h-5 w-5" />;
      case 'expiry_warning':
        return <Clock className="h-5 w-5" />;
      case 'damaged_goods':
        return <Package className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIconColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  const getProductDetails = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alert Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage inventory alerts and warnings</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Active: {activeAlerts.length}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Resolved: {resolvedAlerts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeAlerts.filter(a => a.type === 'low_stock').length}
              </p>
              <p className="text-gray-600">Low Stock Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeAlerts.filter(a => a.type === 'expiry_warning').length}
              </p>
              <p className="text-gray-600">Expiring Soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeAlerts.filter(a => a.type === 'damaged_goods').length}
              </p>
              <p className="text-gray-600">Damaged Goods</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
        </div>
        
        <div className="p-6">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No active alerts. Everything looks good!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => {
                const product = getProductDetails(alert.productId);
                const daysUntilExpiry = product ? 
                  differenceInDays(new Date(product.expiryDate), new Date()) : 0;

                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-0.5 ${getAlertIconColor(alert.severity)}`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {product?.description || 'Unknown Product'}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{alert.message}</p>
                          
                          {product && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Category:</span>
                                <p className="font-medium">{product.category}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Current Stock:</span>
                                <p className="font-medium">{product.warehouseStock + product.shelfStock}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Threshold:</span>
                                <p className="font-medium">{product.minThreshold}</p>
                              </div>
                              {alert.type === 'expiry_warning' && (
                                <div>
                                  <span className="text-gray-500">Days Left:</span>
                                  <p className={`font-medium ${daysUntilExpiry <= 1 ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Created: {format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                        title="Mark as resolved"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recently Resolved</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {resolvedAlerts.slice(-5).map((alert) => {
                const product = getProductDetails(alert.productId);
                
                return (
                  <div
                    key={alert.id}
                    className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {product?.description || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-gray-600">{alert.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(alert.createdAt), 'MMM dd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};