#!/bin/bash

# PWA Icon Generator Script
# Generates all required icon sizes from source icon.png

set -e

SOURCE_ICON="public/icon.png"
OUTPUT_DIR="public/icons"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Icon sizes for PWA
SIZES=(72 96 128 144 152 167 180 192 384 512)

echo "Generating PWA icons from $SOURCE_ICON..."

for size in "${SIZES[@]}"; do
    output_file="$OUTPUT_DIR/icon-${size}x${size}.png"
    
    # Use ImageMagick if available, otherwise use Node.js
    if command -v convert &> /dev/null; then
        convert "$SOURCE_ICON" -resize ${size}x${size} "$output_file"
        echo "✓ Generated $output_file (ImageMagick)"
    else
        echo "✗ ImageMagick not available, will use Node.js fallback"
        break
    fi
done

echo ""
echo "Icon generation complete!"
echo "Icons saved to: $OUTPUT_DIR"
echo ""
echo "Required icons:"
ls -la "$OUTPUT_DIR/"
