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

---
*Dibuat oleh HandityaGilang(Garda)*
