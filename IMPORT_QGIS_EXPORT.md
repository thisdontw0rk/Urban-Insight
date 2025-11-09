# Importing Your QGIS2Web Export

Your QGIS export is located at:
`~/Downloads/qgis2web_2025_11_08-19_28_48_571715`

## Current Situation

Your QGIS export contains **JavaScript files** (not GeoJSON files):
- `import_flood_01_chance_2.js` - Flood zone data (~20MB)
- `import_major_roads_1.js` - Road data (~20MB)

These are Leaflet layer files optimized for web performance, but our React app needs **GeoJSON files**.

## ✅ Best Solution: Re-export from QGIS as GeoJSON

Since the JS files are complex and optimized, the easiest solution is to export your layers directly as GeoJSON from QGIS:

### Step 1: Export Flood Layer
1. Open your QGIS project
2. Right-click the **flood layer** in the Layers panel
3. Select: **Export → Save Features As...**
4. In the dialog:
   - **Format**: GeoJSON
   - **File name**: Browse to `Urban-Insight/public/data/`
   - **Name**: `flood-zones.geojson`
   - Click **OK**

### Step 2: Export Roads Layer
1. Right-click the **roads layer**
2. **Export → Save Features As...**
3. **Format**: GeoJSON
4. **File name**: `public/data/major-roads.geojson`
5. Click **OK**

### Step 3: Update Layer Mapping

Edit `src/utils/loadGeoJSON.js` and update the `layerFileMap`:

```javascript
export const layerFileMap = {
  flood: '/data/flood-zones.geojson',
  accessibility: '/data/accessibility.geojson',
  safety: '/data/safety.geojson',
  sustainability: '/data/sustainability.geojson',
  roads: '/data/major-roads.geojson', // Add if needed
};
```

### Step 4: Test

```bash
npm run dev
```

Open http://localhost:5173 and click the flood layer button!

## Alternative: Extract from JS Files (Advanced)

If you can't re-export from QGIS, you can try extracting GeoJSON from the JS files:

```bash
# Try the extraction script
node extract-geojson.js ~/Downloads/qgis2web_2025_11_08-19_28_48_571715/data/import_flood_01_chance_2.js
```

**Note**: This may not work for all JS files as qgis2web uses various optimization techniques.

## File Organization

After exporting, your `public/data/` folder should contain:

```
public/data/
├── calgary-flood.json (existing example)
├── flood-zones.geojson (from QGIS)
├── major-roads.geojson (from QGIS, optional)
├── accessibility.geojson (if you have this layer)
├── safety.geojson (if you have this layer)
└── sustainability.geojson (if you have this layer)
```

## Quick Reference

**QGIS Export Location**: `~/Downloads/qgis2web_2025_11_08-19_28_48_571715`

**Target Location**: `Urban-Insight/public/data/`

**Required Format**: GeoJSON (`.geojson` or `.json`)

**Layer Mapping**: `src/utils/loadGeoJSON.js`

---

## Why Re-export as GeoJSON?

1. ✅ **Simpler**: Direct GeoJSON is easier to work with
2. ✅ **Smaller files**: No embedded Leaflet code
3. ✅ **Better compatibility**: Works with all mapping libraries
4. ✅ **Easier debugging**: Can view/edit in text editor
5. ✅ **Standard format**: GeoJSON is the web standard

The qgis2web JS files are optimized for standalone Leaflet maps, but for React apps, GeoJSON is preferred.

