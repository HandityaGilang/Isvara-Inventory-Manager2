import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  Plus,
  Upload,
  Download,
  BarChart3,
  Calculator,
  History,
  LogOut,
  ShoppingBag,
  Settings,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      path: '/',
      icon: Home,
      label: 'Dashboard',
      allowedRoles: ['OWNER', 'ADMIN', 'STAFF']
    },
    {
      path: '/inventory',
      icon: Package,
      label: 'Inventory',
      allowedRoles: ['OWNER', 'ADMIN', 'STAFF']
    },
    {
      path: '/sales',
      icon: ShoppingBag,
      label: 'Penjualan',
      allowedRoles: ['OWNER', 'ADMIN', 'STAFF']
    },
    {
      path: '/add-product',
      icon: Plus,
      label: 'Tambah Barang',
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      path: '/import-export',
      icon: Upload,
      label: 'Import/Export',
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      path: '/profit-calculator',
      icon: Calculator,
      label: 'Kalkulator Profit',
      allowedRoles: ['OWNER']
    },
    {
      path: '/activity-log',
      icon: History,
      label: 'Aktivitas',
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Pengaturan',
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      path: '/users',
      icon: Users,
      label: 'Manajemen User',
      allowedRoles: ['OWNER']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.allowedRoles.includes(user?.role || 'STAFF')
  );

  return (
    <div className="w-full md:w-64 bg-white dark:bg-navy-900 shadow-lg flex-shrink-0 flex flex-col h-screen transition-colors">
      <div className="p-6 border-b dark:border-navy-800">
        <h1 className="text-xl font-bold text-gray-800 dark:text-yellow-50">
          Isvara Inventory
        </h1>
        <p className="text-xs text-gray-500 dark:text-navy-200 mt-1 uppercase tracking-wide">
          {user?.mode} MODE • {user?.role}
        </p>
      </div>
      
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-navy-700 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-navy-100 hover:bg-gray-100 dark:hover:bg-navy-800 hover:text-gray-800 dark:hover:text-yellow-50'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t dark:border-navy-800">
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 dark:text-yellow-50 text-sm">{user?.username}</span>
            <span className="text-xs text-gray-500 dark:text-navy-200">Logged In</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Keluar</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
