
Add-Type -AssemblyName System.Drawing

$source = "public\splash.png"
$dest = "public\icon_fixed.ico"

if (-not (Test-Path $source)) {
    Write-Host "Source file not found: $source"
    exit 1
}

try {
    $bitmap = [System.Drawing.Bitmap]::FromFile((Get-Item $source).FullName)
    
    # Create a new 256x256 bitmap
    $newBitmap = New-Object System.Drawing.Bitmap 256, 256
    $graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    # Draw resized image
    $graphics.DrawImage($bitmap, 0, 0, 256, 256)
    
    # Save as ICO
    # Note: .NET Icon.Save() only supports basic formats, but let's try
    $fileStream = [System.IO.File]::Create($dest)
    $icon = [System.Drawing.Icon]::FromHandle($newBitmap.GetHicon())
    $icon.Save($fileStream)
    
    $fileStream.Close()
    $graphics.Dispose()
    $newBitmap.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Icon created successfully at $dest"
} catch {
    Write-Host "Error converting icon: $_"
    exit 1
}
