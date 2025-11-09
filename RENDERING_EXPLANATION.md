# How Rendering Works in Urban Insight

## Overview

The application uses **React** for UI components and **Leaflet** for map rendering. GeoJSON data is loaded from the `public/data/` folder and rendered as interactive map layers.

## Rendering Pipeline

### 1. Initial Setup

```
index.html
  └─> <div id="root"></div>
      └─> main.jsx (React entry)
          └─> App.jsx
              ├─> Header
              ├─> Sidebar (Layer selection)
              ├─> MapContainer (Map rendering)
              └─> Legend
```

### 2. Map Initialization (MapContainer.jsx)

**First useEffect (lines 28-54):**
- Creates Leaflet map instance once on mount
- Centers map on Calgary: `[51.0447, -114.0719]`
- Adds OpenStreetMap tile layer as base map
- Stores map instance in `mapInstanceRef`

```javascript
// Creates the Leaflet map
mapInstanceRef.current = L.map(mapRef.current, {
  center: [51.0447, -114.0719],
  zoom: 11,
});

// Adds base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(mapInstanceRef.current);
```

### 3. Layer Loading Flow (MapContainer.jsx)

**Second useEffect (lines 57-135):** Triggers when `activeLayer` changes

#### Step-by-Step:

1. **Remove Previous Layer**
   ```javascript
   if (geoJsonLayerRef.current) {
     mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
   }
   ```

2. **Get File Path**
   ```javascript
   const filePath = layerFileMap[activeLayer];
   // Example: 'major_roads' → '/data/major-roads.json'
   ```

3. **Fetch GeoJSON Data**
   ```javascript
   const geoJsonData = await loadGeoJSON(filePath);
   // Uses fetch() to load JSON from public/data/
   ```

4. **Create Leaflet GeoJSON Layer**
   ```javascript
   geoJsonLayerRef.current = L.geoJSON(geoJsonData, {
     style: (feature) => getLayerStyle(activeLayer, feature),
     onEachFeature: (feature, layer) => {
       // Add popups and hover effects
     }
   }).addTo(mapInstanceRef.current);
   ```

5. **Fit Map to Data Bounds**
   ```javascript
   mapInstanceRef.current.fitBounds(
     geoJsonLayerRef.current.getBounds(),
     { padding: [50, 50], maxZoom: 15 }
   );
   ```

## Styling System (loadGeoJSON.js)

### getLayerStyle() Function

Returns Leaflet style object based on layer type:

**Major Roads:**
```javascript
{
  color: 'rgba(219,30,42,1.0)',  // Red
  weight: 3.0,                     // Line thickness
  lineCap: 'square',
  lineJoin: 'bevel'
}
```

**Flood 1% Chance:**
```javascript
{
  color: 'rgba(35,35,35,1.0)',    // Dark gray border
  weight: 1.0,
  fillColor: 'rgba(21,174,243,0.45)', // Light blue fill
  fillOpacity: 1
}
```

## Feature Rendering

### Geometry Types

Leaflet automatically handles different GeoJSON geometry types:

- **Point** → `L.circleMarker()` (lines 89-96)
- **LineString/MultiLineString** → `L.polyline()` (for roads)
- **Polygon/MultiPolygon** → `L.polygon()` (for flood zones)

### Interactive Features

**Popups:**
- Created via `createPopupContent(feature, layerId)`
- Bound to each feature with `layer.bindPopup()`
- Shows on click

**Hover Effects:**
- `mouseover`: Increases weight to 4, brings to front
- `mouseout`: Resets to original style

## Data Flow

```
public/data/major-roads.json (20MB)
  ↓
fetch('/data/major-roads.json')
  ↓
JSON.parse() → GeoJSON object
  ↓
L.geoJSON(geoJsonData, options)
  ↓
Leaflet renders each feature as SVG/Canvas
  ↓
Displayed on map with styling
```

## Performance Considerations

1. **Large Files**: 
   - `major-roads.json` (20MB) and `flood-01-chance.json` (19MB) are large
   - Loading indicator shown during fetch
   - Leaflet handles rendering efficiently

2. **Layer Switching**:
   - Previous layer removed before loading new one
   - Prevents memory leaks
   - Smooth transitions

3. **Bounds Fitting**:
   - Automatically zooms to show all data
   - Prevents user from seeing empty map

## Key Technologies

- **React**: Component lifecycle, state management
- **Leaflet**: Map rendering, GeoJSON handling
- **Vite**: Dev server, hot module replacement
- **Tailwind CSS**: Styling

## File Structure

```
src/
├── main.jsx              # React entry point
├── App.jsx               # Main app component
└── components/
    └── Map/
        ├── MapContainer.jsx  # Map rendering logic
        └── Legend.jsx        # Legend display
└── utils/
    └── loadGeoJSON.js       # Data loading & styling

public/
└── data/
    ├── major-roads.json      # Road network (20MB)
    ├── flood-01-chance.json  # Flood zones (19MB)
    └── calgary-flood.json    # Original flood data
```

