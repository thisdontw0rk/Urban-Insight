import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadGeoJSON, getLayerStyle, createPopupContent, layerFileMap } from '../../utils/loadGeoJSON';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapContainer = ({ activeLayer }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [51.0447, -114.0719], // Calgary coordinates
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load and display GeoJSON based on active layer
  useEffect(() => {
    if (!mapInstanceRef.current || !activeLayer) return;

    const loadLayer = async () => {
      setIsLoading(true);
      
      // Remove existing GeoJSON layer
      if (geoJsonLayerRef.current) {
        mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }

      // Get file path for active layer
      const filePath = layerFileMap[activeLayer];
      
      if (!filePath) {
        console.warn(`No GeoJSON file mapped for layer: ${activeLayer}`);
        setIsLoading(false);
        return;
      }

      // Load GeoJSON data
      const geoJsonData = await loadGeoJSON(filePath);
      
      if (!geoJsonData) {
        setIsLoading(false);
        return;
      }

      // Create GeoJSON layer with styling and popups
      geoJsonLayerRef.current = L.geoJSON(geoJsonData, {
        style: (feature) => getLayerStyle(activeLayer, feature),
        pointToLayer: (feature, latlng) => {
          // For point features, create a circle marker
          const style = getLayerStyle(activeLayer, feature);
          return L.circleMarker(latlng, {
            radius: 8,
            ...style,
          });
        },
        onEachFeature: (feature, layer) => {
          // Add popup with feature properties
          if (feature.properties) {
            const popupContent = createPopupContent(feature);
            layer.bindPopup(popupContent);
          }

          // Add hover effects
          layer.on({
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 4,
                opacity: 1,
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
              }
            },
            mouseout: (e) => {
              geoJsonLayerRef.current?.resetStyle(e.target);
            },
          });
        },
      }).addTo(mapInstanceRef.current);

      // Fit map to bounds of GeoJSON data
      if (geoJsonLayerRef.current.getBounds().isValid()) {
        mapInstanceRef.current.fitBounds(geoJsonLayerRef.current.getBounds(), {
          padding: [50, 50],
          maxZoom: 15,
        });
      }

      setIsLoading(false);
    };

    loadLayer();
  }, [activeLayer]);

  return (
    <div className="w-full h-full relative">
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ zIndex: 1 }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-gray-800/90 text-white px-4 py-2 rounded-lg shadow-lg z-[1000] flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Loading map data...</span>
        </div>
      )}
      
      {/* Layer info overlay */}
      {!isLoading && geoJsonLayerRef.current && (
        <div className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-2 rounded-lg shadow-lg z-[1000] text-sm">
          <span className="font-semibold">{activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} Layer</span>
        </div>
      )}
    </div>
  );
};

export default MapContainer;
