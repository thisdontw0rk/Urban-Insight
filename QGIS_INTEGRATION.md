# How to Incorporate QGIS2Web Export into Urban Insight

## Step 1: Export from QGIS using qgis2web

1. **In QGIS:**
   - Install the `qgis2web` plugin if not already installed
   - Prepare your map layers (shapefiles, GeoJSON, etc.)
   - Go to: `Web` → `qgis2web` → `Create web map`
   - Choose **Leaflet** as the web library
   - Configure your layers, styles, and popups
   - Click **Export** and choose a location

## Step 2: Extract Files from qgis2web Export

The qgis2web export typically contains:
```
qgis2web_export/
├── index.html
├── resources/
│   ├── qgis2web.js
│   └── ...
├── data/
│   ├── layer1.geojson
│   ├── layer2.geojson
│   └── ...
└── css/
    └── ...
```

**What you need:**
- All `.geojson` files from the `data/` folder
- Note the layer names and styling from `qgis2web.js`

## Step 3: Add GeoJSON Files to Your Project

1. **Copy GeoJSON files to your project:**
   ```bash
   # Copy all GeoJSON files from qgis2web export to your project
   cp /path/to/qgis2web_export/data/*.geojson /Users/lidmarka/Developer/Urban-Insight/public/data/
   ```

2. **Organize by layer type:**
   ```
   public/data/
   ├── calgary-flood.json
   ├── flood-zones.geojson
   ├── accessibility.geojson
   ├── neighborhoods.geojson
   └── ...
   ```

## Step 4: Install Leaflet (if not already installed)

```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

## Step 5: Integrate into React Component

See the updated `MapContainer.jsx` component for full implementation.

## Step 6: Load and Display GeoJSON Layers

The component will:
- Load GeoJSON files based on active layer
- Apply styles based on layer type
- Show popups with feature properties
- Handle layer switching

---

## Quick Reference

### Loading GeoJSON in React:
```javascript
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Load GeoJSON file
const loadGeoJSON = async (url) => {
  const response = await fetch(url);
  return await response.json();
};

// Add to map
useEffect(() => {
  if (map && geoJsonData) {
    L.geoJSON(geoJsonData, {
      style: (feature) => ({
        color: '#3388ff',
        weight: 2,
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          layer.bindPopup(`
            <b>${feature.properties.name || 'Feature'}</b><br>
            ${JSON.stringify(feature.properties, null, 2)}
          `);
        }
      }
    }).addTo(map);
  }
}, [map, geoJsonData]);
```

### Mapping QGIS Layers to Your App Layers:

```javascript
const layerFileMap = {
  'flood': '/data/flood-zones.geojson',
  'accessibility': '/data/accessibility.geojson',
  'safety': '/data/safety-zones.geojson',
  'sustainability': '/data/green-spaces.geojson'
};
```

---

## Tips

1. **Styling:** Extract color schemes from QGIS and apply them in Leaflet
2. **Popups:** Use the properties from your QGIS attributes
3. **Coordinate System:** QGIS2web usually exports in WGS84 (EPSG:4326) which is what Leaflet uses
4. **File Size:** Large GeoJSON files should be simplified or served as tiles
5. **Performance:** Consider using GeoJSON tiles or vector tiles for large datasets

