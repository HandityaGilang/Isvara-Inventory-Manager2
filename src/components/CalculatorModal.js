import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CalculatorModal = ({ isOpen, onClose, initialData = {}, onDataUpdate }) => {
  const [formData, setFormData] = useState({
    hpp: '',
    sellingPrice: '',
    shippingCost: '',
    platformCommission: '',
    discount: '',
    tax: ''
  });

  const [results, setResults] = useState(null);
  const [inputMode, setInputMode] = useState('rp');

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        hpp: initialData.hpp || '',
        sellingPrice: initialData.sellingPrice || '',
        shippingCost: initialData.shippingCost || '',
        platformCommission: initialData.platformCommission || '',
        discount: initialData.discount || '',
        tax: initialData.tax || ''
      });
    }
  }, [isOpen, initialData]);

  const calculateProfit = () => {
    const hpp = parseFloat(formData.hpp) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const shippingCost = parseFloat(formData.shippingCost) || 0;
    
    let platformCommissionValue = parseFloat(formData.platformCommission) || 0;
    if (inputMode === 'percent' && sellingPrice > 0) {
      platformCommissionValue = (sellingPrice * platformCommissionValue) / 100;
    }

    const discount = parseFloat(formData.discount) || 0;
    const tax = parseFloat(formData.tax) || 0;

    const totalCost = hpp + shippingCost + platformCommissionValue + discount + tax;
    const netProfit = sellingPrice - totalCost;
    const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

    setResults({
      totalCost,
      netProfit,
      profitMargin,
      platformCommissionValue
    });

    if (onDataUpdate) {
      onDataUpdate({
        ...formData,
        platformCommission: platformCommissionValue
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleInputMode = () => {
    setInputMode(prev => prev === 'rp' ? 'percent' : 'rp');
  };

  const handleClose = () => {
    setResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-navy-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Kalkulator Profit Margin</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-navy-400 hover:text-gray-600 dark:hover:text-navy-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">
                HPP (Harga Pokok Penjualan)
              </label>
              <input
                type="number"
                value={formData.hpp}
                onChange={(e) => handleInputChange('hpp', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-navy-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-navy-900 dark:text-white"
                placeholder="Masukkan HPP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">
                Harga Jual
              </label>
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-navy-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-navy-900 dark:text-white"
                placeholder="Masukkan Harga Jual"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">
                Biaya Expedisi
              </label>
              <input
                type="number"
                value={formData.shippingCost}
                onChange={(e) => handleInputChange('shippingCost', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-navy-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-navy-900 dark:text-white"
                placeholder="Masukkan Biaya Expedisi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">
                Komisi Platform
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.platformCommission}
                  onChange={(e) => handleInputChange('platformCommission', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-navy-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-navy-900 dark:text-white"
                  placeholder={inputMode === 'rp' ? 'Rp' : '%'}
                  step={inputMode === 'rp' ? '1000' : '1'}
                />
                <button
                  onClick={toggleInputMode}
                  className="px-3 py-2 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-navy-200 rounded-md hover:bg-gray-300 dark:hover:bg-navy-600 text-sm"
                >
                  {inputMode === 'rp' ? 'Rp' : '%'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">
                Discount
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-navy-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-navy-900 dark:text-white"
                placeholder="Masukkan Discount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1">
                Pajak
              </label>
              <input
                type="number"
                value={formData.tax}
                onChange={(e) => handleInputChange('tax', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-navy-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-navy-900 dark:text-white"
                placeholder="Masukkan Pajak"
              />
            </div>
          </div>

          <button
            onClick={calculateProfit}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Hitung Profit
          </button>

          {results && (
            <div className="p-4 bg-gray-50 dark:bg-navy-900 rounded-md border border-gray-100 dark:border-navy-700">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Hasil Kalkulasi:</h4>
              <div className="space-y-2 text-sm text-gray-700 dark:text-navy-200">
                <div className="flex justify-between">
                  <span>Total Biaya:</span>
                  <span className="font-medium">Rp {results.totalCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendapatan Bersih:</span>
                  <span className={`font-medium ${results.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Rp {results.netProfit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Margin:</span>
                  <span className={`font-medium ${results.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {results.profitMargin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-900">
          <button
            onClick={handleClose}
            className="w-full bg-gray-300 dark:bg-navy-700 text-gray-700 dark:text-navy-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-navy-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;