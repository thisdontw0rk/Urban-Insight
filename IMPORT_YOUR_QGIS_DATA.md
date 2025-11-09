# 🗺️ Import Your QGIS Data - Step by Step Guide

## Your QGIS Export Location
`~/Downloads/qgis2web_2025_11_08-19_28_48_571715`

## ⚠️ Current Situation

Your QGIS export contains **JavaScript files** (not GeoJSON):
- `import_flood_01_chance_2.js` (~20MB) - Flood zones
- `import_major_roads_1.js` (~20MB) - Roads

These are optimized for standalone Leaflet maps, but our React app needs **GeoJSON files**.

## ✅ Recommended Solution: Export GeoJSON from QGIS

### Option 1: Export Individual Layers (Easiest)

1. **Open your QGIS project**

2. **Export Flood Layer:**
   - Right-click the **flood layer** in the Layers panel
   - Select: **Export → Save Features As...**
   - In the dialog:
     - **Format**: `GeoJSON`
     - **File name**: Click the `...` button
     - Navigate to: `/Users/lidmarka/Developer/Urban-Insight/public/data/`
     - Name it: `flood-zones.geojson`
     - Click **OK**

3. **Export Roads Layer (optional):**
   - Right-click the **roads layer**
   - **Export → Save Features As...**
   - **Format**: `GeoJSON`
   - Save to: `public/data/major-roads.geojson`

4. **Export Other Layers** (accessibility, safety, sustainability) if you have them:
   - Repeat the same process for each layer
   - Save as: `accessibility.geojson`, `safety.geojson`, `sustainability.geojson`

### Option 2: Use QGIS Processing Toolbox

1. Open QGIS
2. Go to: **Processing → Toolbox**
3. Search for: **"Export to GeoJSON"** or **"Save Vector Layer"**
4. Select your layer
5. Choose output format: **GeoJSON**
6. Save to: `public/data/[layer-name].geojson`

## 📁 After Exporting

Your `public/data/` folder should look like:

```
public/data/
├── calgary-flood.json (existing)
├── flood-zones.geojson (✅ your flood data)
├── major-roads.geojson (✅ your roads)
├── accessibility.geojson (if exported)
├── safety.geojson (if exported)
└── sustainability.geojson (if exported)
```

## 🔧 Update Layer Mapping

Edit `src/utils/loadGeoJSON.js`:

```javascript
export const layerFileMap = {
  flood: '/data/flood-zones.geojson',  // ✅ Your exported flood data
  accessibility: '/data/accessibility.geojson',
  safety: '/data/safety.geojson',
  sustainability: '/data/sustainability.geojson',
};
```

## 🚀 Test It

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open: http://localhost:5173

3. Click the **Flood Risk** layer button in the sidebar

4. You should see your QGIS data on the map! 🎉

## 🆘 Troubleshooting

### Files not showing on map?
- Check browser console (F12) for errors
- Verify file paths in `layerFileMap` match actual file names
- Ensure files are in `public/data/` folder (not `src/data/`)

### Wrong styling?
- Edit `getLayerStyle()` function in `src/utils/loadGeoJSON.js`
- Adjust colors to match your QGIS styles

### Popups not working?
- Check that your GeoJSON features have `properties`
- Edit `createPopupContent()` to show your data fields

## 📝 File Size Tips

If your GeoJSON files are very large (>10MB):
1. **Simplify geometries** in QGIS before exporting:
   - Vector → Geometry Tools → Simplify
   - Reduce vertices while keeping shape
2. **Filter features** if you don't need all data
3. **Split into multiple files** by region or type

## 🎯 Quick Checklist

- [ ] Export flood layer as GeoJSON from QGIS
- [ ] Save to `public/data/flood-zones.geojson`
- [ ] Update `layerFileMap` in `src/utils/loadGeoJSON.js`
- [ ] Test with `npm run dev`
- [ ] Verify data appears on map
- [ ] Adjust styling if needed

---

## Why GeoJSON Instead of JS Files?

- ✅ **Standard format**: Works with all mapping libraries
- ✅ **Easier to work with**: Can edit/view in text editor
- ✅ **Better for React**: Direct fetch, no JS execution needed
- ✅ **Smaller files**: No embedded Leaflet code
- ✅ **Easier debugging**: Can validate with online tools

The qgis2web JS files are great for standalone maps, but GeoJSON is the web standard for React applications.

