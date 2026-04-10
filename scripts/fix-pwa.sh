#!/bin/bash
set -e

echo "PWA Fix Script"
echo "=============="
echo ""

if [ ! -f "public/icon.png" ]; then
    echo "Error: Source icon not found at public/icon.png"
    exit 1
fi

mkdir -p public/icons

echo "Generating icons..."

convert_icon() {
    local size=$1
    local output="public/icons/icon-${size}x${size}.png"
    
    if command -v convert >/dev/null 2>&1; then
        convert public/icon.png -resize ${size}x${size} "$output"
        echo "  $size: $output"
    elif command -v sips >/dev/null 2>&1; then
        sips -Z $size public/icon.png --out "$output"
        echo "  $size: $output"
    else
        echo "  $size: Skipped (no image tool available)"
    fi
}

for size in 72 96 128 144 152 167 180 192 384 512; do
    convert_icon $size
done

echo ""
echo "Done!"
echo ""
echo "Next steps:"
echo "1. Commit these changes"
echo "2. Deploy to Vercel"
echo "3. Test on mobile Chrome"
echo ""
echo "If icons still don't generate automatically, use:"
echo "  https://pwa-asset-generator.nicepkg.cn/"
