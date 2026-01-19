const SQL = require('sql.js');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { app } = require('electron');

const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'inventory.db')
  : path.join(__dirname, '../../database/inventory.db');

let db;

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // Load or create database
      let data;
      if (fs.existsSync(dbPath)) {
        data = fs.readFileSync(dbPath);
        db = new SQL.Database(data);
      } else {
        db = new SQL.Database();
        // Create directory if it doesn't exist
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      }
      
      console.log('Connected to SQL.js database');
      createTables().then(resolve).catch(reject);
    } catch (err) {
      console.error('Error opening database:', err);
      reject(err);
    }
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    const productsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_sku TEXT UNIQUE NOT NULL,
        shop_sku TEXT,
        style_name TEXT NOT NULL,
        category TEXT,
        size_s INTEGER DEFAULT 0,
        size_m INTEGER DEFAULT 0,
        size_l INTEGER DEFAULT 0,
        size_xl INTEGER DEFAULT 0,
        size_xxl INTEGER DEFAULT 0,
        size_xxxl INTEGER DEFAULT 0,
        size_onesize INTEGER DEFAULT 0,
        total_stock INTEGER DEFAULT 0,
        price REAL DEFAULT 0,
        cost REAL DEFAULT 0,              -- HPP
        shipping_cost REAL DEFAULT 0,       -- Biaya expedisi
        platform_commission REAL DEFAULT 0, -- Komisi platform
        discount REAL DEFAULT 0,            -- Discount
        tax REAL DEFAULT 0,                 -- Pajak
        admin_fee REAL DEFAULT 0,           -- Biaya admin
        commission REAL DEFAULT 0,          -- Komisi (legacy)
        nett_receive REAL DEFAULT 0,         -- Pendapatan bersih
        status TEXT DEFAULT 'Active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      db.run(productsTable);
      console.log('Products table created or already exists');
      resolve();
    } catch (err) {
      console.error('Error creating products table:', err);
      reject(err);
    }
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

const closeDatabase = () => {
  if (db) {
    try {
      // Save database to file before closing
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      console.log('Database saved and connection closed');
    } catch (err) {
      console.error('Error closing database:', err);
    }
  }
};

// Utility Functions
const calculateProfitMargin = (product) => {
  const {
    price,
    cost,
    shipping_cost,
    platform_commission,
    discount,
    tax,
    admin_fee
  } = product;
  
  // Hitung total biaya
  const totalCost = cost + shipping_cost + platform_commission + discount + tax + admin_fee;
  
  // Hitung pendapatan bersih
  const nettReceive = price - totalCost;
  
  // Hitung margin persentase
  const marginPercentage = price > 0 ? ((nettReceive / price) * 100) : 0;
  
  return {
    total_cost: totalCost,
    nett_receive: nettReceive,
    margin_percentage: marginPercentage,
    is_profitable: nettReceive > 0
  };
};

// CRUD Operations
const getAllProducts = () => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM products ORDER BY created_at DESC');
    const rows = [];
    while (stmt.step()) {
      const product = stmt.getAsObject();
      // Hitung margin profit untuk setiap produk
      const margin = calculateProfitMargin(product);
      rows.push({ ...product, ...margin });
    }
    stmt.free();
    return rows;
  } catch (err) {
    throw err;
  }
};

const getProductById = (id) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    
    // Hitung margin profit jika produk ditemukan
    if (result) {
      const margin = calculateProfitMargin(result);
      return { ...result, ...margin };
    }
    return result;
  } catch (err) {
    throw err;
  }
};

const addProduct = (productData) => {
  try {
    const db = getDb();
    const {
      seller_sku, shop_sku, style_name, category,
      size_s, size_m, size_l, size_xl, size_xxl, size_xxxl, size_onesize,
      price, cost, admin_fee, commission, nett_receive, status, notes
    } = productData;
    
    // Calculate total stock
    const total_stock = (size_s || 0) + (size_m || 0) + (size_l || 0) + 
                       (size_xl || 0) + (size_xxl || 0) + (size_xxxl || 0) + (size_onesize || 0);
    
    const sql = `INSERT INTO products (
      seller_sku, shop_sku, style_name, category,
      size_s, size_m, size_l, size_xl, size_xxl, size_xxxl, size_onesize,
      total_stock, price, cost, admin_fee, commission, nett_receive, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      seller_sku, shop_sku, style_name, category,
      size_s || 0, size_m || 0, size_l || 0, size_xl || 0, size_xxl || 0, size_xxxl || 0, size_onesize || 0,
      total_stock, price, cost, admin_fee, commission, nett_receive, status, notes
    ];
    
    db.run(sql, params);
    
    // Get the last inserted ID
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    
    return { id, ...productData, total_stock };
  } catch (err) {
    throw err;
  }
};

const updateProduct = (id, productData) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const {
      seller_sku, shop_sku, style_name, category,
      size_s, size_m, size_l, size_xl, size_xxl, size_xxxl, size_onesize,
      price, cost, admin_fee, commission, nett_receive, status, notes
    } = productData;
    
    // Calculate total stock
    const total_stock = (size_s || 0) + (size_m || 0) + (size_l || 0) + 
                       (size_xl || 0) + (size_xxl || 0) + (size_xxxl || 0) + (size_onesize || 0);
    
    const sql = `UPDATE products SET
      seller_sku = ?, shop_sku = ?, style_name = ?, category = ?,
      size_s = ?, size_m = ?, size_l = ?, size_xl = ?, size_xxl = ?, size_xxxl = ?, size_onesize = ?,
      total_stock = ?, price = ?, cost = ?, admin_fee = ?, commission = ?, nett_receive = ?, status = ?, notes = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`;
    
    const params = [
      seller_sku, shop_sku, style_name, category,
      size_s || 0, size_m || 0, size_l || 0, size_xl || 0, size_xxl || 0, size_xxxl || 0, size_onesize || 0,
      total_stock, price, cost, admin_fee, commission, nett_receive, status, notes, id
    ];
    
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, ...productData, total_stock });
      }
    });
  });
};

const deleteProduct = (id) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ deleted: this.changes });
      }
    });
  });
};

const getProductsByStatus = (status) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all('SELECT * FROM products WHERE status = ? ORDER BY created_at DESC', [status], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const getDashboardStats = () => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    Promise.all([
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as total_products FROM products', (err, row) => {
          if (err) rej(err); else res(row);
        });
      }),
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as low_stock FROM products WHERE total_stock < 3 AND total_stock > 0', (err, row) => {
          if (err) rej(err); else res(row);
        });
      }),
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as out_of_stock FROM products WHERE total_stock = 0', (err, row) => {
          if (err) rej(err); else res(row);
        });
      }),
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as update_price FROM products WHERE status = "Update Price"', (err, row) => {
          if (err) rej(err); else res(row);
        });
      })
    ]).then(([total, lowStock, outOfStock, updatePrice]) => {
      resolve({
        total_products: total.total_products,
        low_stock: lowStock.low_stock,
        out_of_stock: outOfStock.out_of_stock,
        update_price: updatePrice.update_price
      });
    }).catch(reject);
  });
};

// Excel Import Function
const importFromExcel = (filePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with proper header mapping
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // File Excel contoh memiliki struktur khusus:
      // - Row 0: Header gabungan (diabaikan)
      // - Row 1: Header kolom sebenarnya (diabaikan)  
      // - Row 2+: Data sebenarnya
      // Mapping index berdasarkan analisis file contoh:
      
      const columnIndexMapping = {
        style_name: 1,      // 'Style Name'
        seller_sku: 2,      // 'Seller SKU'
        shop_sku: 3,        // 'Shop SKU'
        size_s: 6,          // 'S'
        size_m: 7,          // 'M'
        size_l: 8,          // 'L'
        size_xl: 9,         // 'XL'
        size_xxl: 10,       // 'XXL'
        size_xxxl: 11,      // 'XXXL'
        size_onesize: 12,    // 'ONESIZE'
        status: 13,         // 'Status'
        category: 18,       // 'Category'
        price: 20,          // 'Current Listing Price'
        commission: 27,     // 'Comission Zalora 13%'
        nett_receive: 31,   // 'NETT RECEIVE - ZALORA'
        notes: 5            // 'Production Year'
      };
      
      const importedProducts = [];
      const errors = [];
      
      // Process each row starting from row 2 (skip header gabungan dan header kolom)
      // Row 0: Header gabungan (diabaikan)
      // Row 1: Header kolom (diabaikan)  
      // Row 2+: Data sebenarnya
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        try {
          const productData = {};
          
          // Map Excel columns to product data using index mapping
          Object.entries(columnIndexMapping).forEach(([field, index]) => {
            if (row[index] !== undefined && row[index] !== null) {
              const value = row[index];
              
              // Handle different data types based on field type
              if (field.startsWith('size_')) {
                // Size fields - convert to number
                productData[field] = typeof value === 'number' ? value : 
                  value && !isNaN(Number(value)) ? Number(value) : 0;
              } else if (field === 'price' || field === 'commission' || field === 'nett_receive') {
                // Price fields - handle #N/A and convert to number
                if (value === '#N/A' || value === 'N/A' || value === '' || value === null) {
                  productData[field] = 0;
                } else {
                  productData[field] = typeof value === 'number' ? value : 
                    !isNaN(Number(value)) ? Number(value) : 0;
                }
              } else if (field === 'status') {
                // Normalize status
                const statusMap = {
                  'Active': 'Active',
                  'Update Price': 'Update Price', 
                  'Gambar Hilang': 'Gambar Hilang',
                  'Barang Tidak Ditemukan': 'Barang Tidak Ditemukan'
                };
                productData[field] = statusMap[value] || value || 'Active';
              } else {
                // Text fields
                productData[field] = value !== undefined && value !== null ? 
                  String(value).trim() : '';
              }
            }
          });
          
          // Skip if essential data is missing
          if (!productData.seller_sku || !productData.style_name) {
            errors.push({ row: i + 1, error: 'Missing Seller SKU or Style Name', data: row });
            continue;
          }
          
          // Add default values for missing fields
          productData.size_s = productData.size_s || 0;
          productData.size_m = productData.size_m || 0;
          productData.size_l = productData.size_l || 0;
          productData.size_xl = productData.size_xl || 0;
          productData.size_xxl = productData.size_xxl || 0;
          productData.size_xxxl = productData.size_xxxl || 0;
          productData.size_onesize = productData.size_onesize || 0;
          productData.price = productData.price || 0;
          productData.commission = productData.commission || 0;
          productData.nett_receive = productData.nett_receive || 0;
          productData.status = productData.status || 'Active';
          
          // Try to insert product
          try {
            const result = await addProduct(productData);
            importedProducts.push({
              row: i + 1,
              seller_sku: productData.seller_sku,
              style_name: productData.style_name,
              success: true
            });
          } catch (insertError) {
            if (insertError.message.includes('UNIQUE constraint failed')) {
              errors.push({
                row: i + 1,
                error: 'Duplicate Seller SKU',
                seller_sku: productData.seller_sku,
                style_name: productData.style_name
              });
            } else {
              errors.push({
                row: i + 1,
                error: insertError.message,
                seller_sku: productData.seller_sku,
                style_name: productData.style_name
              });
            }
          }
          
        } catch (rowError) {
          errors.push({
            row: i + 1,
            error: rowError.message,
            data: row
          });
        }
      }
      
      resolve({
        totalRows: data.length - 1,
        imported: importedProducts.length,
        errors: errors.length,
        importedProducts,
        errors
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  initDatabase,
  getDb,
  closeDatabase,
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductsByStatus,
  getDashboardStats,
  importFromExcel,
  closeDatabase
};