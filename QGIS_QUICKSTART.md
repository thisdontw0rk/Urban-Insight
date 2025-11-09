# Quick Start: Import QGIS2Web Files

## ✅ What's Already Set Up

1. ✅ Leaflet and React-Leaflet installed
2. ✅ Map component ready to display GeoJSON
3. ✅ Layer switching integrated
4. ✅ Styling and popups configured
5. ✅ Example GeoJSON file: `public/data/calgary-flood.json`

## 🚀 Quick Import (3 Steps)

### Step 1: Find Your QGIS Export Folder

Your QGIS2web export folder is likely named:
```
qgis2web_2025_11_08-19_28_48_571715
```

**Common locations:**
- `~/Downloads/`
- `~/Documents/`
- Desktop

### Step 2: Copy GeoJSON Files

**Using the import script:**
```bash
cd /Users/lidmarka/Developer/Urban-Insight
./import-qgis-files.sh /path/to/qgis2web_2025_11_08-19_28_48_571715
```

**Or manually:**
1. Open the QGIS export folder
2. Go to `data/` subfolder
3. Copy all `.geojson` files
4. Paste into: `Urban-Insight/public/data/`

### Step 3: Update File Names

Rename files to match your layers:
- Flood data → `flood-zones.geojson` (or keep `calgary-flood.json`)
- Accessibility → `accessibility.geojson`
- Safety → `safety.geojson`
- Sustainability → `sustainability.geojson`

## 🎯 Test It

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** http://localhost:5173

3. **Click layer buttons** in the sidebar to see your QGIS data!

## 📝 File Mapping

The app automatically loads GeoJSON files based on the active layer:

| Layer | File Path |
|-------|-----------|
| Flood Risk | `/data/calgary-flood.json` |
| Accessibility | `/data/accessibility.geojson` |
| Safety | `/data/safety.geojson` |
| Sustainability | `/data/sustainability.geojson` |

**To change file paths:** Edit `src/utils/loadGeoJSON.js`

## 🎨 Customize Styling

Edit `src/utils/loadGeoJSON.js` → `getLayerStyle()` function:

```javascript
case 'flood':
  return {
    color: '#ef4444',      // Border color
    weight: 3,             // Border width
    fillColor: '#ef4444',  // Fill color
    fillOpacity: 0.4,      // Fill transparency (0-1)
  };
```

## 🐛 Troubleshooting

### Map shows but no data?
- Check browser console (F12) for errors
- Verify file paths in `layerFileMap`
- Ensure files are in `public/data/` folder

### Wrong colors/styling?
- Edit `getLayerStyle()` in `src/utils/loadGeoJSON.js`
- Match colors to your QGIS project

### Popups not showing?
- Check that GeoJSON has `properties` field
- Edit `createPopupContent()` to show your data

## 📚 More Info

- **Full guide:** See `QGIS_INTEGRATION.md`
- **Adding files:** See `ADD_QGIS_FILES.md`
- **Map component:** `src/components/Map/MapContainer.jsx`
- **GeoJSON utils:** `src/utils/loadGeoJSON.js`

