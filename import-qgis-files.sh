#!/bin/bash

# Script to help import QGIS2web export files
# Usage: ./import-qgis-files.sh /path/to/qgis2web_export

echo "🗺️  QGIS2Web Import Helper"
echo "=========================="
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./import-qgis-files.sh /path/to/qgis2web_export"
    echo ""
    echo "Example: ./import-qgis-files.sh ~/Downloads/qgis2web_2025_11_08-19_28_48_571715"
    exit 1
fi

QGIS_EXPORT="$1"
DATA_DIR="$QGIS_EXPORT/data"
TARGET_DIR="./public/data"

# Check if export directory exists
if [ ! -d "$QGIS_EXPORT" ]; then
    echo "❌ Error: Directory not found: $QGIS_EXPORT"
    exit 1
fi

# Check if data directory exists
if [ ! -d "$DATA_DIR" ]; then
    echo "❌ Error: Data directory not found: $DATA_DIR"
    echo "   Make sure you're pointing to the qgis2web export folder"
    exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Find all GeoJSON files
echo "📁 Found GeoJSON files:"
find "$DATA_DIR" -name "*.geojson" -type f | while read file; do
    filename=$(basename "$file")
    echo "   - $filename"
done

echo ""
echo "📋 Copying files to $TARGET_DIR..."
echo ""

# Copy all GeoJSON files
cp "$DATA_DIR"/*.geojson "$TARGET_DIR/" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Successfully copied GeoJSON files!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Check the files in: $TARGET_DIR"
    echo "   2. Rename them to match your layer types:"
    echo "      - flood-zones.geojson"
    echo "      - accessibility.geojson"
    echo "      - safety.geojson"
    echo "      - sustainability.geojson"
    echo "   3. Update src/utils/loadGeoJSON.js if needed"
    echo "   4. Restart your dev server: npm run dev"
else
    echo "❌ Error copying files"
    exit 1
fi

