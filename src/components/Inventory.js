import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [hoverImageIndex, setHoverImageIndex] = useState(0);

  const addActivityLogEntry = async (entry) => {
    try {
      const now = new Date();
      const timestamp = now.getTime();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      
      const newEntry = {
        timestamp,
        date,
        user: user?.username || 'Unknown',
        role: user?.role || 'OWNER',
        ...entry
      };
      
      await db.logs.add(newEntry);
    } catch (error) {
      console.error('Failed to add activity log entry:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedProducts = await db.products.getAll();
        
        if (loadedProducts && loadedProducts.length > 0) {
          setProducts(loadedProducts);
          setFilteredProducts(loadedProducts);
        } else {
          // Initialize with mock data if empty
          const mockProducts = [
            {
              id: '1',
              seller_sku: 'TSH-BLK-001',
              shop_sku: 'TSH001',
              style_name: 'Kaos Basic Hitam',
              category: 'Kaos',
              size_s: 5,
              size_m: 3,
              size_l: 2,
              size_xl: 1,
              size_xxl: 0,
              size_xxxl: 0,
              size_onesize: 0,
              total_stock: 11,
              price: 75000,
              cost: 45000,
              shipping_cost: 8000,
              platform_commission: 9750,
              discount: 0,
              tax: 3750,
              admin_fee: 5000,
              commission: 7500,
              nett_receive: 62500,
              status: 'Active',
              notes: '',
              imageUrl: '/DummyFashion.jpg',
              images: ['/DummyFashion.jpg', '/DummyFashion.jpg'],
              distribution_channel: 'Shopee'
            },
            {
              id: '2',
              seller_sku: 'JKT-DNM-001',
              shop_sku: 'JKT001',
              style_name: 'Jaket Denim Blue',
              category: 'Jaket',
              size_s: 0,
              size_m: 1,
              size_l: 0,
              size_xl: 0,
              size_xxl: 0,
              size_xxxl: 0,
              size_onesize: 0,
              total_stock: 1,
              price: 250000,
              cost: 150000,
              shipping_cost: 15000,
              platform_commission: 32500,
              discount: 5000,
              tax: 12500,
              admin_fee: 10000,
              commission: 25000,
              nett_receive: 215000,
              status: 'Update Price',
              notes: 'Perlu update harga',
              imageUrl: '/DummyFashion.jpg',
              images: ['/DummyFashion.jpg'],
              distribution_channel: 'Zalora'
            },
            {
              id: '3',
              seller_sku: 'PNT-CRG-001',
              shop_sku: 'PNT001',
              style_name: 'Celana Cargo Army',
              category: 'Celana',
              size_s: 0,
              size_m: 0,
              size_l: 0,
              size_xl: 0,
              size_xxl: 0,
              size_xxxl: 0,
              size_onesize: 0,
              total_stock: 0,
              price: 180000,
              cost: 100000,
              shipping_cost: 12000,
              platform_commission: 23400,
              discount: 0,
              tax: 9000,
              admin_fee: 8000,
              commission: 18000,
              nett_receive: 154000,
              status: 'Inactive',
              notes: 'Stok habis',
              imageUrl: '/DummyFashion.jpg',
              images: ['/DummyFashion.jpg', '/DummyFashion.jpg', '/DummyFashion.jpg'],
              distribution_channel: 'Offline Store'
            }
          ];
          
          setProducts(mockProducts);
          setFilteredProducts(mockProducts);
          
          // Save mock data one by one
          for (const p of mockProducts) {
            await db.products.save(p);
          }
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = 
        product.seller_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.style_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter, categoryFilter]);

  const getStockColor = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getRowColor = (stock) => {
    if (stock === 0) return 'bg-red-50';
    if (stock < 3) return 'bg-yellow-50';
    return '';
  };

  const calculateMargin = (product) => {
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
    
    const totalCost = cost + shipping_cost + platform_commission + discount + tax + admin_fee + commission;
    const margin = price - totalCost;
    const marginPercentage = price > 0 ? (margin / price) * 100 : 0;
    
    return {
      amount: margin,
      percentage: marginPercentage,
      status: margin >= 0 ? 'profit' : 'loss'
    };
  };

  const getMarginColor = (margin) => {
    if (margin >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const statuses = ['all', 'Active', 'Update Price', 'Inactive'];

  const changeStock = async (id, delta) => {
    // Optimistic update
    setProducts(prev => {
      const updated = prev.map(product =>
        product.id === id
          ? {
              ...product,
              total_stock: Math.max(0, (product.total_stock || 0) + delta)
            }
          : product
      );
      return updated;
    });

    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newStock = Math.max(0, (product.total_stock || 0) + delta);
    const updatedProduct = { ...product, total_stock: newStock };
    
    try {
      await db.products.save(updatedProduct);
      
      if (product.total_stock !== newStock) {
        await addActivityLogEntry({
          action: 'Update Stock',
          item: `${product.style_name} (${product.seller_sku})`,
          oldVal: product.total_stock,
          newVal: newStock,
          source: 'inventory'
        });
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
      // Revert optimistic update if needed, but for now we'll just log
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    const productToDelete = products.find(p => p.id === id);
    
    // Optimistic update
    setProducts(prev => prev.filter(p => p.id !== id));
    setFilteredProducts(prev => prev.filter(p => p.id !== id));

    try {
      await db.products.delete(id);
      
      if (productToDelete) {
        await addActivityLogEntry({
          action: 'Delete Product',
          item: `${productToDelete.style_name} (${productToDelete.seller_sku})`,
          role: user?.role,
          source: 'inventory'
        });
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Gagal menghapus produk');
      // Revert would go here
    }
  };

  useEffect(() => {
    if (!hoveredProductId) {
      setHoverImageIndex(0);
      return;
    }

    const product = products.find(p => p.id === hoveredProductId);
    if (!product || !product.images || product.images.length <= 1) {
      setHoverImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setHoverImageIndex(prev => {
        const next = prev + 1;
        return next >= product.images.length ? 0 : next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [hoveredProductId, products]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Inventory</h1>
            <p className="text-gray-600">Kelola semua produk baju dalam sistem</p>
          </div>
          {user?.role !== 'STAFF' && (
            <Link
              to="/add-product"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center w-full md:w-auto"
            >
              <Plus size={20} className="mr-2" />
              Tambah Barang
            </Link>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Produk
              </label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari SKU, nama, atau kategori..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'Semua Status' : status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kategori
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Semua Kategori' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gambar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={getRowColor(product.total_stock)}
                  >
                    <td
                      className="px-6 py-4 whitespace-nowrap relative"
                      onMouseEnter={() => setHoveredProductId(product.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                    >
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.style_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">No Image</span>
                        )}
                      </div>
                      {hoveredProductId === product.id && (
                        <div className="absolute z-20 left-20 top-0 bg-white shadow-xl rounded-lg p-3 w-64 border border-gray-100">
                          <div className="w-full h-32 rounded-md overflow-hidden bg-gray-100 mb-3">
                            <img
                              src={
                                product.images && product.images.length > 0
                                  ? product.images[hoverImageIndex]
                                  : product.imageUrl
                              }
                              alt={product.style_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-800">
                              {product.style_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.seller_sku} • {product.category}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stok: {product.total_stock} pcs
                            </p>
                            <p className="text-xs text-gray-500">
                              Harga: Rp {product.price.toLocaleString('id-ID')}
                            </p>
                            {product.distribution_channel && (
                              <p className="text-xs text-blue-600">
                                Distribusi: {product.distribution_channel}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.seller_sku}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.shop_sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.style_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => changeStock(product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs"
                        >
                          -
                        </button>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStockColor(
                            product.total_stock
                          )} min-w-[72px] text-center`}
                        >
                          {product.total_stock} pcs
                        </span>
                        <button
                          type="button"
                          onClick={() => changeStock(product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Rp {product.price.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const margin = calculateMargin(product);
                        return (
                          <div className="text-sm">
                            <div className={getMarginColor(margin.amount)}>
                              Rp {margin.amount.toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({margin.percentage.toFixed(1)}%)
                            </div>
                            <div className="text-xs">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                margin.status === 'profit' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {margin.status === 'profit' ? 'Profit' : 'Loss'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : product.status === 'Update Price'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user?.role !== 'STAFF' && (
                        <div className="flex space-x-2">
                          <Link to={`/edit-product/${product.id}`} className="text-blue-600 hover:text-blue-900">
                            <Edit size={16} />
                          </Link>
                          {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                            <button 
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Tidak ada produk yang ditemukan</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Menampilkan {filteredProducts.length} dari {products.length} produk
              </p>
            </div>
            <div className="flex space-x-2">
              {user?.role !== 'STAFF' && (
                <>
                  <button className="flex items-center px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50">
                    <Download size={16} className="mr-2" />
                    Export
                  </button>
                  <button className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                    <Upload size={16} className="mr-2" />
                    Import
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
