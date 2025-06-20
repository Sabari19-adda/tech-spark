import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  FileText, 
  Settings, 
  LogOut,
  Bell,
  User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { alerts } = useInventory();

  const unreadAlerts = alerts.filter(a => !a.resolved).length;

  const menuItems = [
    { id: 'dashboard', icon: ShoppingCart, label: 'Dashboard', roles: ['admin', 'checker', 'maker'] },
    { id: 'inventory', icon: Package, label: 'Inventory', roles: ['admin', 'checker', 'maker'] },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', roles: ['admin', 'checker', 'maker'] },
    { id: 'invoices', icon: FileText, label: 'Invoices', roles: ['admin', 'checker'] },
    { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-600 text-white p-2 rounded-lg">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">eMart Inventory</h1>
              <p className="text-sm text-gray-500">Grocery Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Alerts Bell */}
            <button 
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => onPageChange('alerts')}
            >
              <Bell className="h-5 w-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <div className="p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onPageChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.id === 'alerts' && unreadAlerts > 0 && (
                        <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                          {unreadAlerts}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};