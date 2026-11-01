# Genere le logo RAMBooster (PNG 256 + ICO 32x32) sans dependance externe.
# Usage : powershell -ExecutionPolicy Bypass -File logo.ps1 -OutDir <dossier>

param([string]$OutDir = $PSScriptRoot)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function New-LogoBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    # Carre arrondi degrade
    $r = [int]($size * 0.25)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $r, $r, 180, 90)
    $path.AddArc($size - $r, 0, $r, $r, 270, 90)
    $path.AddArc($size - $r, $size - $r, $r, $r, 0, 90)
    $path.AddArc(0, $size - $r, $r, $r, 90, 90)
    $path.CloseFigure()
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 14, 165, 233),
        [System.Drawing.Color]::FromArgb(255, 34, 211, 238),
        45.0)
    $g.FillPath($brush, $path)

    # Eclair
    $pts = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new($size * 0.556, $size * 0.188),
        [System.Drawing.PointF]::new($size * 0.313, $size * 0.570),
        [System.Drawing.PointF]::new($size * 0.461, $size * 0.570),
        [System.Drawing.PointF]::new($size * 0.430, $size * 0.812),
        [System.Drawing.PointF]::new($size * 0.703, $size * 0.406),
        [System.Drawing.PointF]::new($size * 0.555, $size * 0.406)
    )
    $g.FillPolygon([System.Drawing.Brushes]::White, $pts)

    $g.Dispose()
    return $bmp
}

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

# PNG haute resolution
$big = New-LogoBitmap 256
$big.Save((Join-Path $OutDir 'logo.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$big.Dispose()

# Favicon 64
$med = New-LogoBitmap 64
$med.Save((Join-Path $OutDir 'logo-64.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$med.Dispose()

# ICO 32x32 pour le binaire Windows
$small = New-LogoBitmap 32
$hIcon = $small.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::Create((Join-Path $OutDir 'logo.ico'))
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$small.Dispose()

Write-Host "[OK] logo.png (256), logo-64.png, logo.ico (32x32) -> $OutDir"
