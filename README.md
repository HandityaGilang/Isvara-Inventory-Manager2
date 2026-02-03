# Isvara Inventory Manager

Isvara Inventory Manager adalah aplikasi desktop manajemen inventaris modern yang dirancang untuk membantu UMKM mengelola stok, penjualan, dan keuntungan dengan mudah dan efisien.

## 🚀 Fitur Utama

### 1. Dual Mode (Offline & Online)
*   **Offline Mode:** Bekerja sepenuhnya tanpa internet. Data disimpan secara lokal di perangkat Anda (menggunakan SQL.js). Ideal untuk keamanan data dan kecepatan.
*   **Online Mode:** Sinkronisasi real-time dengan database cloud (Supabase). Memungkinkan kolaborasi tim dari berbagai lokasi.

### 2. Manajemen Stok Komprehensif
*   Tambah, edit, dan hapus produk dengan mudah.
*   **Multi-Image Support:** Unggah hingga 5 gambar per produk dengan kompresi otomatis untuk performa optimal.
*   Pelacakan stok real-time dengan indikator visual (Stok Rendah).

### 3. Pencatatan Penjualan & Laporan
*   Catat transaksi penjualan harian.
*   **Kalkulator Keuntungan:** Hitung margin keuntungan bersih setelah biaya admin marketplace (Shopee, Tokopedia, TikTok Shop, dll).
*   Dashboard interaktif dengan ringkasan: Total Item, Total Nilai Aset, dan Peringatan Stok.

### 4. Manajemen Pengguna (Role-Based Access)
*   **OWNER:** Akses penuh ke semua fitur, pengaturan, dan manajemen user.
*   **ADMIN:** Akses ke inventaris dan pengaturan operasional.
*   **STAFF:** Akses terbatas untuk operasional harian (input stok/penjualan).

### 5. Import & Export Data
*   Dukungan Import data massal dari file Excel (.xlsx).
*   Export laporan stok dan penjualan ke Excel untuk analisis lebih lanjut.

## 🛠️ Teknologi yang Digunakan
*   **Frontend:** React.js, Tailwind CSS
*   **Backend/Runtime:** Electron (untuk aplikasi desktop)
*   **Database:** 
    *   Lokal: SQL.js (SQLite versi WebAssembly)
    *   Cloud: Supabase (PostgreSQL)
*   **Icons:** Lucide React

## 📦 Cara Install
1.  Unduh file `.zip` rilis terbaru.
2.  Ekstrak folder tersebut.
3.  Jalankan `Isvara Inventory Manager.exe`.
4.  Login menggunakan akun yang tersedia (atau Local Owner untuk offline).

## 🔒 Keamanan
Aplikasi ini mendukung autentikasi yang aman dengan pemisahan hak akses pengguna, memastikan data sensitif (seperti harga modal) hanya bisa dilihat oleh pihak yang berwenang.

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

Made By Handitya Gilang (Garda) 
=======
---
*Dibuat oleh HandityaGilang(Garda)*
>>>>>>> Prototype-UI
