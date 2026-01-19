import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle,
  AlertCircle,
  X,
  Database,
  RefreshCw,
  Save
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ImportExport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.role === 'STAFF') {
      navigate('/inventory');
    }
  }, [user, navigate]);

  const [importFile, setImportFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0
  });

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const products = await db.products.getAll();
        if (products) {
          setStats({
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + (parseInt(p.total_stock) || 0), 0),
            lowStock: products.filter(p => (p.total_stock || 0) > 0 && (p.total_stock || 0) < 10).length,
            outOfStock: products.filter(p => (p.total_stock || 0) === 0).length
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadStats();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (['xlsx', 'csv'].includes(extension)) {
        setImportFile(file);
        setImportResults(null);
      } else {
        alert('Hanya file Excel (.xlsx) atau CSV (.csv) yang didukung');
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Process data
        const currentProducts = await db.products.getAll();
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        const newProducts = json.map((row, index) => {
          try {
            if (!row['Seller SKU'] && !row['Style Name']) {
              throw new Error('Missing SKU or Name');
            }

            // Calculate stock from sizes if available
            const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONESIZE'];
            let stockFromSizes = 0;
            let hasSizeData = false;
            sizes.forEach(size => {
              if (row[size] !== undefined) {
                stockFromSizes += parseInt(row[size]) || 0;
                hasSizeData = true;
              }
            });

            const totalStock = hasSizeData ? stockFromSizes : (parseInt(row['Total Stock'] || row['Stock']) || 0);

            return {
              id: Date.now() + Math.random(),
              seller_sku: row['Seller SKU'] || `SKU-${Date.now()}-${index}`,
              style_name: row['Style Name'] || 'Unnamed Product',
              category: row['Category'] || 'Uncategorized',
              price: parseInt(row['Current Listing Price'] || row['Price']) || 0,
              cost: parseInt(row['NETT RECEIVE'] || row['Cost']) || 0, // Best guess
              total_stock: totalStock,
              created_at: new Date().toISOString()
            };
          } catch (err) {
            failCount++;
            errors.push({ row: index + 2, message: err.message }); // +2 for header and 0-index
            return null;
          }
        }).filter(Boolean);

        successCount = newProducts.length;
        
        // Merge with existing
        // Strategy: Append new, or update if SKU exists? 
        // For simplicity: Append for now, but user might want Update.
        // Let's check for existing SKU and update if found, append otherwise.
        
        const mergedProducts = [...currentProducts];
        
        newProducts.forEach(np => {
          const idx = mergedProducts.findIndex(cp => cp.seller_sku === np.seller_sku);
          if (idx >= 0) {
            // Update
            mergedProducts[idx] = { ...mergedProducts[idx], ...np, id: mergedProducts[idx].id }; // Keep old ID
          } else {
            // Add
            mergedProducts.push(np);
          }
        });

        await db.products.saveBulk(mergedProducts);

        setImportResults({
          success: successCount,
          failed: failCount,
          errors: errors
        });

        // Update stats
        setStats({
          totalProducts: mergedProducts.length,
          totalStock: mergedProducts.reduce((sum, p) => sum + (parseInt(p.total_stock) || 0), 0),
          lowStock: mergedProducts.filter(p => (p.total_stock || 0) > 0 && (p.total_stock || 0) < 10).length,
          outOfStock: mergedProducts.filter(p => (p.total_stock || 0) === 0).length
        });

        setTimeout(() => {
             // Optional: reload or just let state update
             // window.location.reload(); 
        }, 1000);

      } catch (error) {
        console.error(error);
        setImportResults({
          success: 0,
          failed: 1,
          errors: [{ row: 0, message: 'File parsing failed' }]
        });
      } finally {
        setIsImporting(false);
        setImportFile(null);
        // Reset input
        const fileInput = document.getElementById('import-file');
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsArrayBuffer(importFile);
  };

  const handleExport = async () => {
    try {
      const products = await db.products.getAll();
      if (!products || products.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(products);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      
      const fileName = `isvara_products_${new Date().toISOString().slice(0,10)}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error(error);
      alert('Gagal mengekspor data');
    }
  };

  const handleBackup = async () => {
    try {
      const [products, sales, logs, categories, channels] = await Promise.all([
        db.products.getAll(),
        db.sales.getAll(),
        db.logs.getAll(),
        db.settings.getCategories(),
        db.settings.getChannels()
      ]);

      const backupData = {
        products: products || [],
        sales: sales || [],
        logs: logs || [],
        categories: categories || [],
        channels: channels || [],
        backupDate: new Date().toISOString(),
        version: '2.0'
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `isvara_backup_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Backup gagal');
    }
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('Restore akan menimpa data yang ada. Lanjutkan?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        // Validate
        if (!backupData || typeof backupData !== 'object') {
          throw new Error('File backup kosong atau tidak valid');
        }

        // Support Legacy Format (isvara_*)
        if (backupData['isvara_products']) {
             const products = JSON.parse(backupData['isvara_products'] || '[]');
             await db.products.saveBulk(products);
        } else if (backupData.products) {
             // New Format
             await db.products.saveBulk(backupData.products);
        }

        if (backupData['isvara_sales_records']) {
             const sales = JSON.parse(backupData['isvara_sales_records'] || '[]');
             await db.sales.restore(sales);
        } else if (backupData.sales) {
             await db.sales.restore(backupData.sales);
        }

        if (backupData['isvara_activity_log']) {
             const logs = JSON.parse(backupData['isvara_activity_log'] || '[]');
             await db.logs.restore(logs);
        } else if (backupData.logs) {
             await db.logs.restore(backupData.logs);
        }
        
        // Settings
        if (backupData.categories) await db.settings.saveCategories(backupData.categories);
        if (backupData.channels) await db.settings.saveChannels(backupData.channels);

        alert('Restore berhasil! Aplikasi akan dimuat ulang.');
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert('Restore gagal: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const getTemplateColumns = () => {
    return [
      'Seller SKU', 'Style Name', 'Category', 'Current Listing Price', 'NETT RECEIVE', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONESIZE'
    ];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Import & Export Data</h1>
        <p className="text-gray-600">
          Kelola data inventory dan backup sistem
        </p>
      </div>

      {/* Statistics */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Statistik Database Saat Ini
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
            <p className="text-sm text-gray-600">Total Produk</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.totalStock}</p>
            <p className="text-sm text-gray-600">Total Stok</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            <p className="text-sm text-gray-600">Stok Menipis</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-sm text-gray-600">Stok Habis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Backup & Restore Section (New) */}
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center mb-6">
            <Database size={24} className="mr-3 text-blue-300" />
            <div>
              <h2 className="text-xl font-semibold">System Backup & Restore</h2>
              <p className="text-slate-300 text-sm">Amankan seluruh data aplikasi (Produk, Penjualan, Log, Setting) dalam satu file JSON.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-600/50 p-4 rounded-lg border border-slate-500">
              <h3 className="font-medium mb-2 flex items-center">
                <Save size={18} className="mr-2" /> Backup Data
              </h3>
              <p className="text-xs text-slate-300 mb-4">Download semua data saat ini ke file JSON.</p>
              <button 
                onClick={handleBackup}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
              >
                Download Backup (.json)
              </button>
            </div>

            <div className="bg-slate-600/50 p-4 rounded-lg border border-slate-500">
              <h3 className="font-medium mb-2 flex items-center">
                <RefreshCw size={18} className="mr-2" /> Restore Data
              </h3>
              <p className="text-xs text-slate-300 mb-4">Upload file JSON backup untuk mengembalikan data.</p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="w-full bg-slate-500 hover:bg-slate-400 text-white py-2 px-4 rounded transition-colors border border-slate-400 border-dashed">
                  Pilih File Backup (.json)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Upload size={20} className="mr-2" />
            Import Produk (Excel)
          </h2>

          <div className="mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!importFile ? (
                <div>
                  <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop file Excel atau CSV di sini
                  </p>
                  <label htmlFor="import-file" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block">
                    Pilih File
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center">
                    <FileText size={24} className="text-green-600 mr-3" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                        {importFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setImportFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Template Kolom Didukung:
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
              <p className="text-xs text-gray-600 font-mono whitespace-nowrap">
                {getTemplateColumns().join(', ')}
              </p>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isImporting ? 'Mengimport...' : 'Mulai Import'}
          </button>

          {importResults && (
            <div className={`mt-4 p-4 rounded-lg ${
              importResults.failed > 0 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center mb-2">
                {importResults.failed > 0 ? (
                  <AlertCircle size={20} className="text-yellow-600 mr-2" />
                ) : (
                  <CheckCircle size={20} className="text-green-600 mr-2" />
                )}
                <h4 className="font-medium">
                  {importResults.success} Berhasil, {importResults.failed} Gagal
                </h4>
              </div>
              
              {importResults.failed > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <ul className="text-sm text-gray-600 space-y-1">
                    {importResults.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-1">•</span>
                        Baris {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Download size={20} className="mr-2" />
            Export Produk
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format Export
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Info:</h4>
            <p className="text-xs text-blue-600">
              Export akan mengunduh seluruh data produk yang tersimpan saat ini.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <Download size={16} className="mr-2" />
            Download Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExport;
