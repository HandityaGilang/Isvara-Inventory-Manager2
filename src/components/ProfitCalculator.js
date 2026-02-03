import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, DollarSign, TrendingUp, TrendingDown, Percent, Search, Save } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

const ProfitCalculator = ({ product: initialProduct, onCalculate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.role !== 'OWNER' && user?.mode !== 'OFFLINE') {
      navigate('/inventory');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    cost: initialProduct?.cost || 0,
    price: initialProduct?.price || 0,
    shipping_cost: initialProduct?.shipping_cost || 0,
    platform_commission: initialProduct?.platform_commission || 0,
    discount: initialProduct?.discount || 0,
    tax: initialProduct?.tax || 0,
    admin_fee: initialProduct?.admin_fee || 0
  });

  const [results, setResults] = useState(null);
  const [inputMode, setInputMode] = useState('rp'); // 'rp' or '%'
  const [discountMode, setDiscountMode] = useState('rp');
  const [taxMode, setTaxMode] = useState('rp');
  const [chartData, setChartData] = useState([]);
  
  // State for product search
  const [storedProducts, setStoredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

  // Load products from db
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await db.products.getAll();
        if (products) {
          setStoredProducts(products);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (results) {
      const price = parseFloat(formData.price) || 0;

      let chartPlatformCommission = parseFloat(formData.platform_commission) || 0;
      if (inputMode === 'percent' && price > 0) {
        chartPlatformCommission = (parseFloat(formData.platform_commission) || 0) / 100 * price;
      }

      let chartDiscount = parseFloat(formData.discount) || 0;
      if (discountMode === 'percent' && price > 0) {
        chartDiscount = (parseFloat(formData.discount) || 0) / 100 * price;
      }

      let chartTax = parseFloat(formData.tax) || 0;
      if (taxMode === 'percent' && price > 0) {
        chartTax = (parseFloat(formData.tax) || 0) / 100 * price;
      }

      const data = [
        { name: 'Profit', value: Math.max(0, results.nett_receive) },
        { name: 'HPP', value: parseFloat(formData.cost) || 0 },
        { name: 'Expedisi', value: parseFloat(formData.shipping_cost) || 0 },
        { name: 'Komisi', value: chartPlatformCommission },
        { name: 'Discount', value: chartDiscount },
        { name: 'Pajak', value: chartTax },
        { name: 'Admin', value: parseFloat(formData.admin_fee) || 0 }
      ].filter(item => item.value > 0);
      
      setChartData(data);
    }
  }, [results, formData, inputMode, discountMode, taxMode]);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        cost: initialProduct.cost || 0,
        price: initialProduct.price || 0,
        shipping_cost: initialProduct.shipping_cost || 0,
        platform_commission: initialProduct.platform_commission || 0,
        discount: initialProduct.discount || 0,
        tax: initialProduct.tax || 0,
        admin_fee: initialProduct.admin_fee || 0
      });
      if (initialProduct.id) {
        setSelectedProductId(initialProduct.id);
        setSearchTerm(`${initialProduct.style_name} (${initialProduct.seller_sku})`);
      }
    }
  }, [initialProduct]);

  const selectProduct = (p) => {
    setFormData({
      cost: p.cost || 0,
      price: p.price || 0,
      shipping_cost: p.shipping_cost || 0,
      platform_commission: p.platform_commission || 0,
      discount: p.discount || 0,
      tax: p.tax || 0,
      admin_fee: p.admin_fee || 0
    });
    setSearchTerm(`${p.style_name} (${p.seller_sku})`);
    setSelectedProductId(p.id);
    setShowDropdown(false);
    setSaveStatus(null);
  };

  const handleUpdateProduct = async () => {
    if (!selectedProductId) return;

    try {
      const products = await db.products.getAll();
      const oldProduct = products.find(p => p.id === selectedProductId);
      if (!oldProduct) return;

      const updatedProduct = {
        ...oldProduct,
        cost: formData.cost,
        price: formData.price,
        shipping_cost: formData.shipping_cost,
        platform_commission: formData.platform_commission,
        discount: formData.discount,
        tax: formData.tax,
        admin_fee: formData.admin_fee
      };

      await db.products.save(updatedProduct);

      // Log activity
      const newLog = {
        id: Date.now(),
        user: user?.username || 'System',
        role: user?.role || 'SYSTEM',
        action: 'Update Product (Profit Calc)',
        item: `${updatedProduct.style_name} (${updatedProduct.seller_sku})`,
        oldVal: `Price: ${oldProduct.price}, Cost: ${oldProduct.cost}`,
        newVal: `Price: ${updatedProduct.price}, Cost: ${updatedProduct.cost}`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      
      await db.logs.add(newLog);

      const newProducts = products.map(p => p.id === selectedProductId ? updatedProduct : p);
      setStoredProducts(newProducts);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to update product:', err);
      setSaveStatus('error');
    }
  };

  const calculateProfit = () => {
    const {
      cost,
      price,
      shipping_cost,
      platform_commission,
      discount,
      tax,
      admin_fee
    } = formData;

    // Hitung komisi platform berdasarkan mode input
    const numericPrice = parseFloat(price) || 0;

    let calculatedPlatformCommission = parseFloat(platform_commission) || 0;
    if (inputMode === 'percent' && numericPrice > 0) {
      calculatedPlatformCommission = (parseFloat(platform_commission) || 0) / 100 * numericPrice;
    }

    let calculatedDiscount = parseFloat(discount) || 0;
    if (discountMode === 'percent' && numericPrice > 0) {
      calculatedDiscount = (parseFloat(discount) || 0) / 100 * numericPrice;
    }

    let calculatedTax = parseFloat(tax) || 0;
    if (taxMode === 'percent' && numericPrice > 0) {
      calculatedTax = (parseFloat(tax) || 0) / 100 * numericPrice;
    }

    // Hitung total biaya
    const totalCost = (parseFloat(cost) || 0) + 
                     (parseFloat(shipping_cost) || 0) + 
                     calculatedPlatformCommission + 
                     calculatedDiscount + 
                     calculatedTax + 
                     (parseFloat(admin_fee) || 0);

    // Hitung pendapatan bersih
    const nettReceive = numericPrice - totalCost;

    // Hitung margin persentase
    const marginPercentage = numericPrice > 0 ? 
      ((nettReceive / numericPrice) * 100) : 0;

    const calculatedResults = {
      total_cost: totalCost,
      nett_receive: nettReceive,
      margin_percentage: marginPercentage,
      is_profitable: nettReceive > 0
    };

    setResults(calculatedResults);
    
    // Jika ada callback, kirim hasil perhitungan
    if (onCalculate) {
      onCalculate({
        ...formData,
        nett_receive: nettReceive
      });
    }
  };

  const handleInputChange = (field, value) => {
    let finalValue = value;

    // Validation for percentage modes
    let isPercent = false;
    if (field === 'platform_commission' && inputMode === 'percent') isPercent = true;
    if (field === 'discount' && discountMode === 'percent') isPercent = true;
    if (field === 'tax' && taxMode === 'percent') isPercent = true;

    if (isPercent) {
      const numVal = parseFloat(value);
      if (numVal > 100) finalValue = 100;
      if (numVal < 0) finalValue = 0;
    }

    const numericValue = finalValue === '' ? 0 : parseFloat(finalValue) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const toggleInputMode = () => {
    setInputMode(prev => prev === 'rp' ? 'percent' : 'rp');
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-6 transition-colors">
      <div className="flex items-center mb-6">
        <Calculator size={24} className="text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-yellow-50">Kalkulator Profit Margin</h3>
      </div>

      {/* Product Selector */}
      <div className="relative mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1">
          Pilih Produk dari Inventory (Opsional)
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Cari nama produk atau SKU..."
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        
        {showDropdown && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {storedProducts
              .filter(p => 
                (p.style_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                (p.seller_sku || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProduct(p)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-navy-700 flex justify-between items-center border-b dark:border-navy-700 last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">{p.style_name}</div>
                    <div className="text-xs text-gray-500 dark:text-navy-200">{p.seller_sku}</div>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    Stok: {p.total_stock}
                  </div>
                </button>
              ))}
              {storedProducts.filter(p => 
                (p.style_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                (p.seller_sku || '').toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-navy-200 text-center">
                  Produk tidak ditemukan
                </div>
              )}
          </div>
        )}
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1">
            HPP (Cost of Goods)
          </label>
          <input
            type="number"
            value={formData.cost}
            onChange={(e) => handleInputChange('cost', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1">
            Harga Jual (Selling Price)
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1">
            Biaya Expedisi
          </label>
          <input
            type="number"
            value={formData.shipping_cost}
            onChange={(e) => handleInputChange('shipping_cost', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-navy-100">
              Komisi Platform
            </label>
            <button
              type="button"
              onClick={toggleInputMode}
              className="flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {inputMode === 'rp' ? (
                <>
                  <DollarSign size={12} className="mr-1" />
                  Rp
                </>
              ) : (
                <>
                  <Percent size={12} className="mr-1" />
                  %
                </>
              )}
            </button>
          </div>
          <input
            type="number"
            value={formData.platform_commission}
            onChange={(e) => handleInputChange('platform_commission', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={inputMode === 'rp' ? "0" : "0.00"}
            step={inputMode === 'rp' ? "1" : "0.01"}
          />
          <p className="text-xs text-gray-500 dark:text-navy-200 mt-1">
            {inputMode === 'rp' ? 'Nominal Rupiah' : 'Persentase dari Harga Jual'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-navy-100">
              Discount
            </label>
            <button
              type="button"
              onClick={() => setDiscountMode(prev => prev === 'rp' ? 'percent' : 'rp')}
              className="flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {discountMode === 'rp' ? (
                <>
                  <DollarSign size={12} className="mr-1" />
                  Rp
                </>
              ) : (
                <>
                  <Percent size={12} className="mr-1" />
                  %
                </>
              )}
            </button>
          </div>
          <input
            type="number"
            value={formData.discount}
            onChange={(e) => handleInputChange('discount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={discountMode === 'rp' ? "0" : "0.00"}
            step={discountMode === 'rp' ? "1" : "0.01"}
          />
          <p className="text-xs text-gray-500 dark:text-navy-200 mt-1">
            {discountMode === 'rp' ? 'Nominal Rupiah' : 'Persentase dari Harga Jual'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-navy-100">
              Pajak
            </label>
            <button
              type="button"
              onClick={() => setTaxMode(prev => prev === 'rp' ? 'percent' : 'rp')}
              className="flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {taxMode === 'rp' ? (
                <>
                  <DollarSign size={12} className="mr-1" />
                  Rp
                </>
              ) : (
                <>
                  <Percent size={12} className="mr-1" />
                  %
                </>
              )}
            </button>
          </div>
          <input
            type="number"
            value={formData.tax}
            onChange={(e) => handleInputChange('tax', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={taxMode === 'rp' ? "0" : "0.00"}
            step={taxMode === 'rp' ? "1" : "0.01"}
          />
          <p className="text-xs text-gray-500 dark:text-navy-200 mt-1">
            {taxMode === 'rp' ? 'Nominal Rupiah' : 'Persentase dari Harga Jual'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1">
            Biaya Admin Lainnya
          </label>
          <input
            type="number"
            value={formData.admin_fee}
            onChange={(e) => handleInputChange('admin_fee', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateProfit}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center mb-6"
      >
        <Calculator size={18} className="mr-2" />
        Hitung Profit Margin
      </button>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Pie Chart Visualization */}
          {chartData.length > 0 && (
            <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4 border border-gray-100 dark:border-navy-700">
              <h4 className="font-semibold text-gray-800 dark:text-yellow-50 mb-4 text-center">Visualisasi Komposisi Biaya & Profit</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Nilai']}
                      contentStyle={{ backgroundColor: '#102a43', borderColor: '#243b53', color: '#fef3c7' }}
                    />
                    <Legend wrapperStyle={{ color: '#fef3c7' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className={`p-4 rounded-lg border ${
            results.is_profitable 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 dark:text-yellow-50">Hasil Perhitungan</h4>
              {results.is_profitable ? (
                <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-navy-200">Total Biaya:</span>
                <p className="font-medium dark:text-white">Rp {results.total_cost.toLocaleString('id-ID')}</p>
              </div>

              <div>
                <span className="text-gray-600 dark:text-navy-200">Nett Receive:</span>
                <p className={`font-bold text-lg ${
                  results.is_profitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  Rp {results.nett_receive.toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <span className="text-gray-600 dark:text-navy-200">Margin (%):</span>
                <p className={`font-medium ${
                  results.is_profitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {results.margin_percentage.toFixed(2)}%
                </p>
              </div>
              
              <div>
                <span className="text-gray-600 dark:text-navy-200">Status:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  results.is_profitable 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {results.is_profitable ? 'PROFIT' : 'LOSS'}
                </span>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          {selectedProductId && (
            <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-navy-200">
                  <p>Anda sedang mengedit parameter untuk produk:</p>
                  <p className="font-medium text-gray-800 dark:text-white">{searchTerm}</p>
                </div>
                <button
                  onClick={handleUpdateProduct}
                  className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save size={18} className="mr-2" />
                  Simpan Perubahan
                </button>
              </div>
              {saveStatus === 'success' && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded text-center">
                  Perubahan berhasil disimpan ke inventory!
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded text-center">
                  Gagal menyimpan perubahan. Silakan coba lagi.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfitCalculator;
