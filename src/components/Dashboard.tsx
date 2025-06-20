import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { products, alerts } = useInventory();

  // Calculate metrics
  const totalProducts = products.length;
  const approvedProducts = products.filter(p => p.status === 'approved').length;
  const pendingApproval = products.filter(p => p.status === 'pending').length;
  const unreadAlerts = alerts.filter(a => !a.resolved).length;
  
  const totalWarehouseStock = products.reduce((sum, p) => sum + p.warehouseStock, 0);
  const totalShelfStock = products.reduce((sum, p) => sum + p.shelfStock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.warehouseStock + p.shelfStock) * p.cost, 0);

  // Low stock products
  const lowStockProducts = products.filter(p => 
    (p.warehouseStock + p.shelfStock) <= p.minThreshold
  ).length;

  // Expiring soon products
  const expiringSoonProducts = products.filter(p => {
    const expiryDate = new Date(p.expiryDate);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 3);
    return expiryDate <= warningDate;
  }).length;

  // Category distribution data
  const categoryData = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, stock: 0 };
    }
    acc[category].value += 1;
    acc[category].stock += product.warehouseStock + product.shelfStock;
    return acc;
  }, {} as Record<string, { name: string; value: number; stock: number }>);

  const categoryChartData = Object.values(categoryData);

  // Stock movement data (mock data for demo)
  const stockMovementData = [
    { name: 'Mon', warehouse: 120, shelf: 80 },
    { name: 'Tue', warehouse: 115, shelf: 85 },
    { name: 'Wed', warehouse: 110, shelf: 90 },
    { name: 'Thu', warehouse: 105, shelf: 95 },
    { name: 'Fri', warehouse: 100, shelf: 100 },
    { name: 'Sat', warehouse: 95, shelf: 105 },
    { name: 'Sun', warehouse: 90, shelf: 110 }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, changeType, icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'positive' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-gray-600 text-sm">{title}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your inventory management system</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={totalProducts}
          change="+12%"
          changeType="positive"
          icon={<Package className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        
        <MetricCard
          title="Inventory Value"
          value={`$${totalValue.toLocaleString()}`}
          change="+8%"
          changeType="positive"
          icon={<DollarSign className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        
        <MetricCard
          title="Low Stock Items"
          value={lowStockProducts}
          change={lowStockProducts > 0 ? "-5%" : "0%"}
          changeType={lowStockProducts > 0 ? "negative" : "positive"}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          color="bg-orange-500"
        />
        
        <MetricCard
          title="Active Alerts"
          value={unreadAlerts}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          color="bg-red-500"
        />
      </div>

      {/* Stock Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Warehouse</span>
              </div>
              <span className="font-semibold text-gray-900">{totalWarehouseStock.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Shelf</span>
              </div>
              <span className="font-semibold text-gray-900">{totalShelfStock.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Approved</span>
              </div>
              <span className="font-semibold text-gray-900">{approvedProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Pending</span>
              </div>
              <span className="font-semibold text-gray-900">{pendingApproval}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Urgent Actions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">Expiring Soon</span>
              </div>
              <span className="font-semibold text-orange-600">{expiringSoonProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-gray-600">Low Stock</span>
              </div>
              <span className="font-semibold text-red-600">{lowStockProducts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movement Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movement (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockMovementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="warehouse" fill="#3b82f6" name="Warehouse" />
              <Bar dataKey="shelf" fill="#10b981" name="Shelf" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {products.slice(0, 5).map((product) => (
            <div key={product.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{product.description}</p>
                <p className="text-xs text-gray-500">
                  Status: <span className="capitalize">{product.status}</span> • 
                  Stock: {product.warehouseStock + product.shelfStock} units
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">${product.cost}</p>
                <p className="text-xs text-gray-500">{product.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};