# Aplikasi Inventory Baju

Aplikasi desktop untuk manajemen inventory baju yang dibangun dengan Electron, React, dan SQLite. Aplikasi ini mendukung import/export Excel/CSV, manajemen SKU, sistem peringatan stok, dan dashboard lengkap.

## Fitur Utama

- ✅ **Import/Export Excel/CSV**: Support file .xlsx dan .csv
- ✅ **Manajemen SKU**: Form lengkap dengan validasi duplikat
- ✅ **Sistem Peringatan**: Warna otomatis untuk stok menipis/habis
- ✅ **Kalkulasi Otomatis**: Total stok dan nett receive
- ✅ **Dashboard**: Ringkasan inventory dan statistik
- ✅ **Filter**: Filter berdasarkan status dan kategori
- ✅ **Validasi**: Pencegahan duplikat SKU dan Style Name

## Teknologi

- **Frontend**: React 18 + Tailwind CSS
- **Desktop**: Electron
- **Database**: SQLite
- **File Processing**: SheetJS (xlsx)
- **Icons**: Lucide React

## Instalasi

1. **Pastikan Node.js terinstall** (versi 16 atau lebih baru)
   ```bash
   node --version
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan aplikasi dalam mode development**
   ```bash
   npm run electron-dev
   ```

4. **Build untuk production**
   ```bash
   npm run build
   npm run dist
   ```

## Struktur Database

Tabel `products` memiliki kolom:
- `seller_sku` (UNIQUE) - SKU dari seller
- `shop_sku` - SKU internal toko
- `style_name` - Nama style produk
- `category` - Kategori produk
- `size_s` sampai `size_onesize` - Stok per ukuran
- `total_stock` - Total stok (terhitung otomatis)
- `price`, `cost`, `admin_fee`, `commission` - Informasi harga
- `nett_receive` - Pendapatan bersih (terhitung otomatis)
- `status` - Status produk (Active, Update Price, Inactive)

## Format Import/Export

Kolom yang didukung untuk import/export:
- seller_sku, shop_sku, style_name, category
- size_s, size_m, size_l, size_xl, size_xxl, size_xxxl, size_onesize
- price, cost, admin_fee, commission, status, notes

## Cara Penggunaan

1. **Tambah Produk**: Klik "Tambah Barang" dan isi form
2. **Import Data**: Gunakan menu Import/Export untuk upload file Excel/CSV
3. **Filter Data**: Gunakan filter di halaman Inventory untuk melihat data tertentu
4. **Export Data**: Export data ke Excel/CSV untuk backup atau analisis
5. **Monitor Stok**: Dashboard menampilkan produk yang perlu restock

## Development

### Scripts Available

- `npm start` - Jalankan React dev server
- `npm run electron` - Jalankan Electron app
- `npm run electron-dev` - Jalankan kedua nya bersamaan
- `npm run build` - Build React app
- `npm run dist` - Build Electron distributable

### File Structure

```
src/
  components/     # Komponen React
    Dashboard.js
    Inventory.js
    ProductForm.js
    ImportExport.js
    Sidebar.js
  database/       # Koneksi database
    db.js
  App.js          # Komponen utama
  index.js        # Entry point
```

## Troubleshooting

1. **Database error**: Pastikan folder database memiliki permission write
2. **Import error**: Pastikan format file sesuai template
3. **Build error**: Pastikan semua dependencies terinstall dengan benar

## License

MIT License