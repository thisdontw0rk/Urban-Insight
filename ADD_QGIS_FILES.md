# How to Add Your QGIS2Web Export Files

## Step-by-Step Instructions

### 1. Locate Your QGIS2Web Export Folder

Your QGIS2web export is typically named something like:
- `qgis2web_2025_11_08-19_28_48_571715`
- Located wherever you exported it from QGIS

### 2. Find the GeoJSON Files

Inside the export folder, look for:
```
qgis2web_export/
└── data/
    ├── layer1_0.geojson
    ├── layer2_0.geojson
    └── ...
```

### 3. Copy GeoJSON Files to Your Project

**Option A: Using Terminal**
```bash
# Navigate to your project
cd /Users/lidmarka/Developer/Urban-Insight

# Copy GeoJSON files from QGIS export to your project
# Replace /path/to/qgis2web_export with your actual path
cp /path/to/qgis2web_export/data/*.geojson ./public/data/
```

**Option B: Using Finder (Mac)**
1. Open Finder
2. Navigate to your QGIS export folder
3. Go into the `data` folder
4. Select all `.geojson` files
5. Copy them (Cmd+C)
6. Navigate to: `/Users/lidmarka/Developer/Urban-Insight/public/data/`
7. Paste them (Cmd+V)

### 4. Rename Files to Match Layer Types

Rename your GeoJSON files to match the layer types in your app:

```bash
# Example renaming (adjust based on your actual files)
cd /Users/lidmarka/Developer/Urban-Insight/public/data/

# Flood zones
mv your_flood_layer.geojson flood-zones.geojson

# Accessibility
mv your_accessibility_layer.geojson accessibility.geojson

# Safety
mv your_safety_layer.geojson safety.geojson

# Sustainability
mv your_sustainability_layer.geojson sustainability.geojson
```

### 5. Update the Layer File Mapping

Edit `src/utils/loadGeoJSON.js` and update the `layerFileMap`:

```javascript
export const layerFileMap = {
  flood: '/data/flood-zones.geojson',        // Your flood GeoJSON
  accessibility: '/data/accessibility.geojson', // Your accessibility GeoJSON
  safety: '/data/safety.geojson',            // Your safety GeoJSON
  sustainability: '/data/sustainability.geojson', // Your sustainability GeoJSON
};
```

### 6. Verify File Structure

Your project should now have:
```
public/
└── data/
    ├── calgary-flood.json (existing)
    ├── flood-zones.geojson (from QGIS)
    ├── accessibility.geojson (from QGIS)
    ├── safety.geojson (from QGIS)
    └── sustainability.geojson (from QGIS)
```

### 7. Test the Integration

1. Start your dev server: `npm run dev`
2. Open http://localhost:5173
3. Click on different layers in the sidebar
4. You should see your QGIS data on the map!

## Troubleshooting

### Files Not Loading?
- Check browser console (F12) for errors
- Verify file paths in `layerFileMap` match actual file names
- Ensure files are in `public/data/` folder
- Check that GeoJSON files are valid (open in a text editor)

### Map Not Showing?
- Check that Leaflet CSS is loading (should be automatic)
- Verify map container has height: `h-full` class
- Check browser console for JavaScript errors

### Wrong Styling?
- Edit `getLayerStyle()` function in `src/utils/loadGeoJSON.js`
- Adjust colors, opacity, and line weights to match your QGIS styles

### Popups Not Working?
- Check that your GeoJSON features have `properties`
- Edit `createPopupContent()` function to show the properties you want

## Quick Reference

**File Location:** `public/data/*.geojson`

**Configuration:** `src/utils/loadGeoJSON.js`

**Map Component:** `src/components/Map/MapContainer.jsx`

**Layer Types:**
- `flood` - Flood risk zones
- `accessibility` - Accessibility coverage
- `safety` - Safety index zones
- `sustainability` - Sustainability areas

