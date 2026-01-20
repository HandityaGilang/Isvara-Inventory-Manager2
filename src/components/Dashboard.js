import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  PieChart,
  Sun,
  Moon
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { db } from '../services/db';
import { useTheme } from '../context/ThemeContext';

const Dashboard = ({ user }) => {
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalStockValue: 0,
    totalProfit: 0,
    totalLoss: 0,
    profitProducts: 0,
    lossProducts: 0,
    averageMarginPercentage: 0
  });
  const [bestsellerFilter, setBestsellerFilter] = useState('week');
  const [products, setProducts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [bestsellerData, setBestsellerData] = useState({
    week: [],
    month: [],
    threeMonths: []
  });

  const calculateProductMargin = (product) => {
    const {
      price,
      cost,
      shipping_cost,
      platform_commission,
      discount,
      tax,
      admin_fee,
      commission
    } = product;

    const numericPrice = Number(price) || 0;
    const totalCost =
      (Number(cost) || 0) +
      (Number(shipping_cost) || 0) +
      (Number(platform_commission) || 0) +
      (Number(discount) || 0) +
      (Number(tax) || 0) +
      (Number(admin_fee) || 0) +
      (Number(commission) || 0);

    const margin = numericPrice - totalCost;
    const marginPercentage =
      numericPrice > 0 ? (margin / numericPrice) * 100 : 0;

    return {
      amount: margin,
      percentage: marginPercentage
    };
  };

  const processBestsellers = (records) => {
    if (!Array.isArray(records) || records.length === 0) {
      setBestsellerData({
        week: [],
        month: [],
        threeMonths: []
      });
      return;
    }

    const now = new Date();

    const aggregateForRange = (days) => {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const totals = new Map();

      records.forEach((record) => {
        if (record.type !== 'sale') return;
        if (!record.date) return;
        const recordDate = new Date(record.date.replace(' ', 'T'));
        if (Number.isNaN(recordDate.getTime())) return;
        if (recordDate < cutoff) return;

        const key = record.seller_sku || '';
        if (!key) return;

        const prev = totals.get(key) || {
          seller_sku: record.seller_sku,
          style_name: record.style_name || '',
          imageUrl: '/DummyFashion.jpg',
          qty: 0
        };
        prev.qty += record.qty || 0;
        totals.set(key, prev);
      });

      const items = Array.from(totals.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10)
        .map((item, index) => ({
          id: `${days}-${item.seller_sku}-${index}`,
          name: item.style_name || item.seller_sku,
          imageUrl: item.imageUrl,
          qty: item.qty
        }));

      return items;
    };

    setBestsellerData({
      week: aggregateForRange(7),
      month: aggregateForRange(30),
      threeMonths: aggregateForRange(90)
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedProducts, loadedLogs, loadedSales] = await Promise.all([
          db.products.getAll(),
          db.logs.getAll(),
          db.sales.getAll()
        ]);

        if (loadedProducts) {
          setProducts(loadedProducts);
        }

        if (loadedLogs) {
          const sorted = [...loadedLogs].sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          );
          setRecentActivities(sorted.slice(0, 5));
        }

        if (loadedSales) {
          processBestsellers(loadedSales);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!products || products.length === 0) {
      setStats({
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalStockValue: 0,
        totalProfit: 0,
        totalLoss: 0,
        profitProducts: 0,
        lossProducts: 0,
        averageMarginPercentage: 0
      });
      return;
    }

    let totalProducts = products.length;
    let lowStockProductsCount = 0;
    let outOfStockProductsCount = 0;
    let totalStockValue = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let profitProducts = 0;
    let lossProducts = 0;
    let totalMarginPercentage = 0;
    let marginCount = 0;

    products.forEach((product) => {
      const stock = Number(product.total_stock) || 0;
      const price = Number(product.price) || 0;

      if (stock === 0) {
        outOfStockProductsCount += 1;
      } else if (stock < 3) {
        lowStockProductsCount += 1;
      }

      totalStockValue += price * stock;

      const margin = calculateProductMargin(product);

      if (!Number.isNaN(margin.amount)) {
        if (margin.amount >= 0) {
          profitProducts += 1;
          totalProfit += margin.amount;
        } else {
          lossProducts += 1;
          totalLoss += Math.abs(margin.amount);
        }
      }

      if (!Number.isNaN(margin.percentage)) {
        totalMarginPercentage += margin.percentage;
        marginCount += 1;
      }
    });

    const averageMarginPercentage =
      marginCount > 0 ? totalMarginPercentage / marginCount : 0;

    setStats({
      totalProducts,
      lowStockProducts: lowStockProductsCount,
      outOfStockProducts: outOfStockProductsCount,
      totalStockValue,
      totalProfit,
      totalLoss,
      profitProducts,
      lossProducts,
      averageMarginPercentage
    });
  }, [products]);

  // Aesthetic Card for Highlighted Stats
  const AestheticCard = ({ icon: Icon, label, value, gradient }) => (
    <div className={`rounded-xl shadow-lg p-6 text-white ${gradient} transform transition-all hover:scale-105`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-90 mb-1">{label}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, color, iconColor }) => (
    <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-4 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${color}`}>
          <Icon size={20} className={iconColor || "text-white"} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-navy-200 truncate">{label}</p>
          <p className="text-lg md:text-xl font-bold text-gray-800 dark:text-yellow-50 break-words">
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  const currentBestsellers =
    bestsellerFilter === 'week'
      ? bestsellerData.week
      : bestsellerFilter === 'month'
      ? bestsellerData.month
      : bestsellerData.threeMonths;

  const lowStockProducts = products
    .filter((product) => (product.total_stock || 0) <= 2)
    .sort(
      (a, b) =>
        (a.total_stock || 0) - (b.total_stock || 0)
    )
    .slice(0, 5);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-yellow-50 mb-2">
            Dashboard Inventory
          </h1>
          <p className="text-gray-600 dark:text-navy-200">
            Ringkasan kondisi stok dan inventory baju
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white dark:bg-navy-800 shadow-sm text-gray-600 dark:text-yellow-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Aesthetic Cards Section (Owner Only) */}
      {user?.role !== 'STAFF' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <AestheticCard
            icon={DollarSign}
            label="Total Nilai Stok"
            value={`Rp ${stats.totalStockValue.toLocaleString('id-ID')}`}
            gradient="bg-gradient-to-r from-emerald-500 to-teal-600"
          />
          <AestheticCard
            icon={TrendingUp}
            label="Rata-rata Margin"
            value={`${stats.averageMarginPercentage.toFixed(1)}%`}
            gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
          />
        </div>
      )}

      {/* Standard Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Package}
          label="Total Produk"
          value={stats.totalProducts}
          color="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-300"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stok Menipis"
          value={stats.lowStockProducts}
          color="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-yellow-600 dark:text-yellow-300"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stok Habis"
          value={stats.outOfStockProducts}
          color="bg-red-100 dark:bg-red-900"
          iconColor="text-red-600 dark:text-red-300"
        />
      </div>

      {/* Profit/Loss Visualization (Owner Only) */}
      {(user?.role === 'OWNER' || user?.mode === 'OFFLINE') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center mb-4">
              <PieChart size={20} className="text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-yellow-50">Komposisi Produk (Profit vs Loss)</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Produk Profit', value: stats.profitProducts },
                      { name: 'Produk Loss', value: stats.lossProducts }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    <Cell fill="#00C49F" />
                    <Cell fill="#FF8042" />
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} produk`, 'Jumlah']} 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#102a43' : '#fff', borderColor: theme === 'dark' ? '#243b53' : '#e5e7eb', color: theme === 'dark' ? '#fef3c7' : '#000' }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center mb-4">
              <BarChart3 size={20} className="text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-yellow-50">Total Profit vs Loss</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Profit', amount: stats.totalProfit, fill: '#00C49F' },
                    { name: 'Loss', amount: stats.totalLoss, fill: '#FF8042' }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                  <YAxis tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`} stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                  <Tooltip 
                    formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Nilai']} 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#102a43' : '#fff', borderColor: theme === 'dark' ? '#243b53' : '#e5e7eb', color: theme === 'dark' ? '#fef3c7' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Nilai (Rp)" radius={[4, 4, 0, 0]}>
                    <Cell fill="#00C49F" />
                    <Cell fill="#FF8042" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-yellow-50 mb-4">
            Produk yang Perlu Restock
          </h3>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-navy-200">
                Belum ada produk dengan stok menipis atau habis.
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    (product.total_stock || 0) === 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-yellow-50">{product.style_name}</p>
                    <p className="text-sm text-gray-600 dark:text-navy-100">{product.seller_sku}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      (product.total_stock || 0) === 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {(product.total_stock || 0) === 0
                      ? 'Habis'
                      : `${product.total_stock} pcs`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-yellow-50 mb-4">
            Aktivitas Terbaru
          </h3>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-navy-200">
                Belum ada aktivitas terbaru.
              </p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 bg-gray-50 dark:bg-navy-700/50 rounded-lg transition-colors">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full mr-3">
                    <BarChart3 size={16} className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-yellow-50">
                      <span className="font-medium">{activity.action}</span> - {activity.item}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-navy-200">{activity.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-navy-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-yellow-50">
              Produk Best Seller
            </h3>
            <p className="text-sm text-gray-500 dark:text-navy-200">
              Daftar produk dengan penjualan tertinggi
            </p>
          </div>
          <div className="mt-3 md:mt-0 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBestsellerFilter('week')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                bestsellerFilter === 'week'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-navy-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-navy-600'
              }`}
            >
              Minggu ini
            </button>
            <button
              type="button"
              onClick={() => setBestsellerFilter('month')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                bestsellerFilter === 'month'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-navy-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-navy-600'
              }`}
            >
              Bulan ini
            </button>
            <button
              type="button"
              onClick={() => setBestsellerFilter('threeMonths')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                bestsellerFilter === 'threeMonths'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-navy-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-navy-600'
              }`}
            >
              3 bulan terakhir
            </button>
          </div>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          {currentBestsellers.map((item) => (
            <div
              key={item.id}
              className="min-w-[140px] max-w-[160px] bg-gray-50 dark:bg-navy-700/50 rounded-lg p-3 flex-shrink-0 transition-colors"
            >
              <div className="w-full h-24 rounded-md overflow-hidden bg-gray-100 dark:bg-navy-600 mb-2">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs font-medium text-gray-800 dark:text-yellow-50 line-clamp-2">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
