# Isvara Inventory Manager - Patch Notes

## Version 1.0.5 (Latest)

### 🎨 Tampilan & UI (Dark Mode)
- **Tema Baru Blue Navy**: Mengubah warna dasar dark mode menjadi **Blue Navy** yang lebih modern dan nyaman di mata (menggantikan warna hitam standar).
- **High Contrast Headers**: Mengubah warna font pada judul dan header tabel menjadi **Kuning Terang** agar lebih kontras dan mudah dibaca di latar gelap.
- **Peningkatan Visibilitas**: Menyesuaikan warna teks konten tabel menjadi putih/abu-terang untuk memastikan keterbacaan yang optimal.
- **Konsistensi Tema**: Menerapkan tema Blue Navy secara menyeluruh di halaman Inventory, Penjualan, Calculator, dan Form Tambah Barang.

### ⚡ Fitur & Fungsionalitas
- **Input Persentase (%)**: Menambahkan opsi input dalam bentuk **Persen (%)** untuk:
  - Pajak
  - Diskon
  - Komisi Platform
- **Dual Input Mode**: Pengguna dapat beralih antara input **Rupiah (Rp)** dan **Persen (%)** dengan mudah menggunakan tombol toggle di samping kolom input.
- **Validasi Input**: Menambahkan validasi otomatis pada input persen (min 0%, max 100%) untuk mencegah kesalahan input.

### 🛠️ Perbaikan Teknis
- **Optimasi Build**: Memperbaiki masalah file lock saat proses packaging installer.
- **Konfigurasi Installer**: Update konfigurasi electron-builder untuk stabilitas yang lebih baik pada Windows.

---

## Cara Update
1. Download installer versi terbaru (`Isvara Inventory Manager Setup 1.0.5.exe`).
2. Jalankan installer tersebut (tidak perlu uninstall versi sebelumnya, data akan aman).
3. Aplikasi akan otomatis terupdate ke versi 1.0.5.
