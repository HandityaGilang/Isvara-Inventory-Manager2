import React, { useState, useEffect } from 'react';
import { Search, Filter, PlusCircle, ArrowDownCircle, ArrowUpCircle, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

const Sales = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('sale');
  const [modalData, setModalData] = useState({
    seller_sku: '',
    qty: 1,
    remark: ''
  });
  const [modalErrors, setModalErrors] = useState({});
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    const loadSales = async () => {
      const mockRecords = [
        {
          id: '1',
          date: '2026-01-19 10:30',
          seller_sku: 'TSH-BLK-001',
          style_name: 'Kaos Basic Hitam',
          type: 'sale',
          qty: 2,
          remark: 'Order Zalora #ZL12345',
          remaining_stock: 9,
        },
        {
          id: '2',
          date: '2026-01-19 09:50',
          seller_sku: 'JKT-DNM-001',
          style_name: 'Jaket Denim Blue',
          type: 'sale',
          qty: 1,
          remark: 'Order Shopee #SP8891',
          remaining_stock: 0,
        },
        {
          id: '3',
          date: '2026-01-18 17:20',
          seller_sku: 'TSH-BLK-001',
          style_name: 'Kaos Basic Hitam',
          type: 'return',
          qty: 1,
          remark: 'Retur size tidak cocok',
          remaining_stock: 11,
        },
      ];

      try {
        const stored = await db.sales.getAll();
        if (stored && stored.length > 0) {
          setRecords(stored);
          setFilteredRecords(stored);
        } else {
          // Initialize with mock data
          setRecords(mockRecords);
          setFilteredRecords(mockRecords);
          
          // Save mocks safely using upsert (restore) to avoid duplicate key errors
          await db.sales.restore(mockRecords);
        }
      } catch (error) {
        console.error('Failed to load sales records:', error);
      }
    };
    
    loadSales();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await db.products.getAll();
        if (products) {
          setProducts(products);
        }
      } catch (error) {
        console.error('Failed to load products for sales form:', error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = records.filter((record) => {
      const matchesSearch =
        record.seller_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.style_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || record.type === typeFilter;

      return matchesSearch && matchesType;
    });

    setFilteredRecords(filtered);
  }, [records, searchTerm, typeFilter]);

  const getTypeBadge = (type) => {
    if (type === 'sale') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const totalTransactions = filteredRecords.length;
  const totalSaleQty = filteredRecords
    .filter((r) => r.type === 'sale')
    .reduce((sum, r) => sum + r.qty, 0);
  const totalReturnQty = filteredRecords
    .filter((r) => r.type === 'return')
    .reduce((sum, r) => sum + r.qty, 0);
  const netMovement = totalSaleQty - totalReturnQty;

  const filteredProductList = products.filter((p) => {
    if (!productSearchTerm.trim()) return true;
    const q = productSearchTerm.toLowerCase();
    return (
      p.seller_sku.toLowerCase().includes(q) ||
      (p.style_name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  const openModal = (type) => {
    setModalType(type);
    setModalData({
      seller_sku: '',
      qty: 1,
      remark: ''
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalSubmitting(false);
  };

  const handleModalChange = (field, value) => {
    setModalData((prev) => ({
      ...prev,
      [field]: field === 'qty' ? Math.max(1, parseInt(value || '1', 10)) : value
    }));
  };

  const handleModalSubmit = async () => {
    const errors = {};
    if (!modalData.seller_sku.trim()) {
      errors.seller_sku = 'SKU wajib dipilih';
    }
    if (!modalData.qty || modalData.qty <= 0) {
      errors.qty = 'Qty harus lebih dari 0';
    }

    const selectedProduct = products.find(
      (p) => p.seller_sku === modalData.seller_sku
    );

    if (!selectedProduct) {
      errors.seller_sku = 'Produk tidak ditemukan di inventory';
    } else if (modalType === 'sale') {
      const currentStock = selectedProduct.total_stock || 0;
      if (modalData.qty > currentStock) {
        errors.qty = `Stok tidak cukup. Stok saat ini ${currentStock} pcs`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    setModalSubmitting(true);

    try {
      // 1. Update Product Stock
      const currentStock = selectedProduct.total_stock || 0;
      const qtyChange = modalType === 'sale' ? -modalData.qty : modalData.qty;
      const newStock = Math.max(0, currentStock + qtyChange);
      
      const productToUpdate = {
        ...selectedProduct,
        total_stock: newStock
      };

      const savedProduct = await db.products.save(productToUpdate);

      // Update local products state
      setProducts(prev => 
        prev.map(p => p.id === savedProduct.id ? savedProduct : p)
      );

      // 2. Create Sales Record
      const now = new Date();
      const dateString = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-${String(now.getDate()).padStart(
        2,
        '0'
      )} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const newRecord = {
        date: dateString,
        seller_sku: savedProduct.seller_sku,
        style_name: savedProduct.style_name,
        type: modalType === 'sale' ? 'sale' : 'return',
        qty: modalData.qty,
        remark: modalData.remark || (modalType === 'sale' ? 'Penjualan manual' : 'Retur manual'),
        remaining_stock: newStock
      };

      const savedRecord = await db.sales.add(newRecord);

      // Update local records state
      setRecords(prev => [savedRecord, ...prev]);

      // 3. Add Activity Log
      await db.logs.add({
        timestamp: now.getTime(),
        date: dateString,
        user: user?.username || 'Unknown',
        role: user?.role || 'OWNER',
        action: modalType === 'sale' ? 'Sale' : 'Return',
        item: `${savedProduct.style_name} (${savedProduct.seller_sku})`,
        oldVal: currentStock,
        newVal: newStock,
        source: 'sales'
      });

      setModalSubmitting(false);
      closeModal();
    } catch (error) {
      console.error('Failed to submit sales form:', error);
      setModalSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Penjualan dan Retur</h1>
            <p className="text-gray-600">Pantau pergerakan stok keluar dan masuk</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={() => openModal('sale')}
            >
              <PlusCircle size={18} className="mr-2" />
              Tambah Penjualan Manual
            </button>
            <button
              className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
              onClick={() => openModal('return')}
            >
              <ArrowUpCircle size={18} className="mr-2" />
              Input Retur
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari SKU atau Nama</label>
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="TSH-BLK-001, Kaos Basic Hitam..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Transaksi</label>
              <div className="relative">
                <Filter
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <select
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Semua</option>
                  <option value="sale">Penjualan</option>
                  <option value="return">Retur</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <div className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Total transaksi</span>
                  <span className="font-semibold">{totalTransactions}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Qty keluar (penjualan)</span>
                  <span className="font-semibold text-green-700">{totalSaleQty}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Qty masuk (retur)</span>
                  <span className="font-semibold text-red-700">{totalReturnQty}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                  <span>Pergerakan bersih stok</span>
                  <span className="font-semibold">
                    {netMovement > 0 ? '-' : netMovement < 0 ? '+' : ''}{Math.abs(netMovement)} pcs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sisa Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.seller_sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.style_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(
                          record.type
                        )}`}
                      >
                        {record.type === 'sale' ? (
                          <ArrowDownCircle size={14} className="mr-1" />
                        ) : (
                          <ArrowUpCircle size={14} className="mr-1" />
                        )}
                        {record.type === 'sale' ? 'Penjualan' : 'Retur'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStockColor(
                          record.remaining_stock
                        )}`}
                      >
                        {record.remaining_stock} pcs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada transaksi penjualan atau retur</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {modalType === 'sale' ? 'Tambah Penjualan Manual' : 'Input Retur Manual'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Pilih produk dan jumlah, stok akan {modalType === 'sale' ? 'berkurang' : 'bertambah'} otomatis.
            </p>

            {products.length === 0 && (
              <div className="flex items-center text-xs text-red-600 mb-3">
                <AlertCircle size={14} className="mr-1" />
                <span>Belum ada produk di inventory. Tambahkan produk terlebih dahulu.</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produk
                </label>
                <button
                  type="button"
                  className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between ${
                    modalErrors.seller_sku ? 'border-red-500' : 'border-gray-300'
                  } ${products.length === 0 ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => {
                    if (products.length === 0) return;
                    setProductSearchTerm('');
                    setIsProductPickerOpen(true);
                  }}
                  disabled={products.length === 0}
                >
                  <span className="text-sm text-gray-700">
                    {(() => {
                      const selected = products.find(
                        (p) => p.seller_sku === modalData.seller_sku
                      );
                      if (!selected) return 'Pilih produk dari inventory';
                      return `${selected.seller_sku} • ${selected.style_name}`;
                    })()}
                  </span>
                  <span className="ml-2 text-xs text-blue-600">
                    Pilih
                  </span>
                </button>
                {modalErrors.seller_sku && (
                  <p className="mt-1 text-xs text-red-600">{modalErrors.seller_sku}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      modalErrors.qty ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={modalData.qty}
                    onChange={(e) => handleModalChange('qty', e.target.value)}
                  />
                  {modalErrors.qty && (
                    <p className="mt-1 text-xs text-red-600">{modalErrors.qty}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe
                  </label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50">
                    {modalType === 'sale' ? 'Penjualan (stok berkurang)' : 'Retur (stok bertambah)'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={modalData.remark}
                  onChange={(e) => handleModalChange('remark', e.target.value)}
                  placeholder={modalType === 'sale' ? 'Contoh: Order Shopee #12345' : 'Contoh: Retur ukuran tidak sesuai'}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                disabled={modalSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleModalSubmit}
                disabled={modalSubmitting || products.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalSubmitting
                  ? 'Menyimpan...'
                  : modalType === 'sale'
                  ? 'Simpan Penjualan'
                  : 'Simpan Retur'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && isProductPickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Pilih Produk dari Inventory</h3>
                <p className="text-xs text-gray-500">
                  Cari berdasarkan SKU, nama produk, atau kategori.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Tutup
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cari Produk
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="TSH-BLK-001, Kaos Basic Hitam, Kaos..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
              {filteredProductList.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  Tidak ada produk yang cocok dengan pencarian.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProductList.map((p) => (
                      <tr
                        key={p.id || p.seller_sku}
                        className="hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          setModalData((prev) => ({
                            ...prev,
                            seller_sku: p.seller_sku
                          }));
                          setModalErrors((prev) => ({
                            ...prev,
                            seller_sku: ''
                          }));
                          setIsProductPickerOpen(false);
                        }}
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800">
                          {p.seller_sku}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {p.style_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                            {p.category || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                          {p.total_stock || 0} pcs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
