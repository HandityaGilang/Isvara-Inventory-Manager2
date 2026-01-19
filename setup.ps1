# Script Setup untuk Aplikasi Inventory Baju
# Script ini akan membantu menginstall dependencies

Write-Host "=== Setup Aplikasi Inventory Baju ===" -ForegroundColor Green
Write-Host ""

# Cek apakah Node.js sudah terinstall
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js ditemukan: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js tidak ditemukan di PATH" -ForegroundColor Red
    Write-Host "Silakan install Node.js dari https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Setelah install, buka terminal baru dan jalankan script ini lagi" -ForegroundColor Yellow
    exit 1
}

# Cek apakah npm sudah tersedia
try {
    $npmVersion = npm --version
    Write-Host "✓ npm ditemukan: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm tidak ditemukan" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Menginstall dependencies..." -ForegroundColor Yellow

# Install dependencies
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Dependencies berhasil diinstall!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Untuk menjalankan aplikasi:" -ForegroundColor Cyan
    Write-Host "1. npm run electron-dev    (jalankan development)" -ForegroundColor White
    Write-Host "2. npm start              (hanya frontend)" -ForegroundColor White
    Write-Host "3. npm run build          (build untuk production)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Gagal menginstall dependencies" -ForegroundColor Red
    Write-Host "Coba jalankan perintah manual: npm install" -ForegroundColor Yellow
}