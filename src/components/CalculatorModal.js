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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Kalkulator Profit Margin</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HPP (Harga Pokok Penjualan)
              </label>
              <input
                type="number"
                value={formData.hpp}
                onChange={(e) => handleInputChange('hpp', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan HPP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga Jual
              </label>
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan Harga Jual"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya Expedisi
              </label>
              <input
                type="number"
                value={formData.shippingCost}
                onChange={(e) => handleInputChange('shippingCost', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan Biaya Expedisi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Komisi Platform
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.platformCommission}
                  onChange={(e) => handleInputChange('platformCommission', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={inputMode === 'rp' ? 'Rp' : '%'}
                  step={inputMode === 'rp' ? '1000' : '1'}
                />
                <button
                  onClick={toggleInputMode}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  {inputMode === 'rp' ? 'Rp' : '%'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan Discount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pajak
              </label>
              <input
                type="number"
                value={formData.tax}
                onChange={(e) => handleInputChange('tax', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan Pajak"
              />
            </div>
          </div>

          <button
            onClick={calculateProfit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Hitung Profit
          </button>

          {results && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-semibold text-gray-800 mb-3">Hasil Kalkulasi:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Biaya:</span>
                  <span className="font-medium">Rp {results.totalCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendapatan Bersih:</span>
                  <span className={`font-medium ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rp {results.netProfit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Margin:</span>
                  <span className={`font-medium ${results.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.profitMargin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;