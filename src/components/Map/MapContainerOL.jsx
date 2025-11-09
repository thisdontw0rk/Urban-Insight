import { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Stroke, Fill, Circle, Text } from 'ol/style';
import 'ol/ol.css';
import { loadGeoJSON, getOpenLayersStyle, createPopupContent, layerFileMap } from '../../utils/loadGeoJSON';

// Ensure map container has height

const MapContainerOL = ({ activeLayer, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      console.warn('Map ref not available');
      return;
    }

    // Create map if it doesn't exist
    if (!mapInstanceRef.current) {
      try {
        console.log('Initializing OpenLayers map...');
        mapInstanceRef.current = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({
              source: new XYZ({
                url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attributions: '© OpenStreetMap contributors',
              }),
            }),
          ],
          view: new View({
            center: fromLonLat([-114.0719, 51.0447]), // Calgary coordinates
            zoom: 11,
          }),
        });
        console.log('Map initialized successfully');
        
        // Notify parent that map is ready
        if (onMapReady) {
          onMapReady(mapInstanceRef.current);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(null);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Close popup when layer changes
  useEffect(() => {
    setPopupContent(null);
  }, [activeLayer]);

  // Load and display GeoJSON based on active layer
  useEffect(() => {
    if (!mapInstanceRef.current || !activeLayer) return;

    const loadLayer = async () => {
      setIsLoading(true);
      
      // Remove ALL existing vector layers to ensure only one layer is visible
      if (vectorLayerRef.current) {
        try {
          mapInstanceRef.current.removeLayer(vectorLayerRef.current);
          // Dispose of the layer to free up resources
          if (vectorLayerRef.current.getSource()) {
            vectorLayerRef.current.getSource().clear();
          }
        } catch (error) {
          console.warn('Error removing previous layer:', error);
        }
        vectorLayerRef.current = null;
      }
      
      // Also remove any other vector layers that might exist (except base tile layer)
      const layers = mapInstanceRef.current.getLayers().getArray();
      layers.forEach(layer => {
        if (layer instanceof VectorLayer && layer !== vectorLayerRef.current) {
          try {
            mapInstanceRef.current.removeLayer(layer);
            if (layer.getSource()) {
              const source = layer.getSource();
              // For cluster sources, clear the underlying source
              if (source.getSource && typeof source.getSource === 'function') {
                const underlyingSource = source.getSource();
                if (underlyingSource && underlyingSource.clear) {
                  underlyingSource.clear();
                }
              }
              if (source.clear) {
                source.clear();
              }
            }
          } catch (error) {
            console.warn('Error removing additional layer:', error);
          }
        }
      });

      // Special handling for LRT layer - combine lines and stops
      if (activeLayer === 'lrt') {
        const [linesData, stopsData] = await Promise.all([
          loadGeoJSON('/data/lrt-lines.json'),
          loadGeoJSON('/data/lrt-stops.json')
        ]);

        if (!linesData && !stopsData) {
          setIsLoading(false);
          return;
        }

        // Combine features from both datasets
        const combinedFeatures = [];
        if (linesData?.features) combinedFeatures.push(...linesData.features);
        if (stopsData?.features) combinedFeatures.push(...stopsData.features);

        const combinedGeoJSON = {
          type: 'FeatureCollection',
          features: combinedFeatures
        };

        // Create vector source from combined GeoJSON
        let vectorSource;
        try {
          vectorSource = new VectorSource({
            features: new GeoJSON().readFeatures(combinedGeoJSON, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
          });
        } catch (error) {
          console.error('Error creating vector source:', error);
          setIsLoading(false);
          return;
        }

        // Create vector layer with styling
        vectorLayerRef.current = new VectorLayer({
          source: vectorSource,
          style: (feature, resolution) => {
            // Determine if it's a line or stop based on geometry type
            const geom = feature.getGeometry();
            const isStop = geom && (geom.getType() === 'Point' || geom.getType() === 'MultiPoint');
            return getOpenLayersStyle(isStop ? 'lrt_stops' : 'lrt_lines', feature, resolution);
          },
        });
        
        // Add the layer to the map
        mapInstanceRef.current.addLayer(vectorLayerRef.current);
      } 
      // Special handling for NO2 Vancouver - skip, handled by iframe in App.jsx
      else if (activeLayer === 'no2_vancouver') {
        // This layer is handled by iframe in App.jsx, so we don't need to do anything here
        setIsLoading(false);
        return;
      }
      // Special handling for Traffic layer - combine incidents and signals (simple, no clustering)
      else if (activeLayer === 'traffic') {
        const [incidentsData, signalsData] = await Promise.all([
          loadGeoJSON('/data/traffic-incidents.json'),
          loadGeoJSON('/data/traffic-signals.json')
        ]);

        if (!incidentsData && !signalsData) {
          setIsLoading(false);
          return;
        }

        // Combine features from both datasets
        const combinedFeatures = [];
        if (incidentsData?.features) {
          incidentsData.features.forEach(feature => {
            feature.properties = feature.properties || {};
            feature.properties._layerType = 'incident';
          });
          combinedFeatures.push(...incidentsData.features);
        }
        if (signalsData?.features) {
          signalsData.features.forEach(feature => {
            feature.properties = feature.properties || {};
            feature.properties._layerType = 'signal';
          });
          combinedFeatures.push(...signalsData.features);
        }

        if (combinedFeatures.length === 0) {
          setIsLoading(false);
          return;
        }

        const combinedGeoJSON = {
          type: 'FeatureCollection',
          features: combinedFeatures
        };

        // Create vector source from combined GeoJSON
        let vectorSource;
        try {
          const geoJsonFormat = new GeoJSON();
          const features = geoJsonFormat.readFeatures(combinedGeoJSON, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          });
          
          vectorSource = new VectorSource({
            features: features,
          });
        } catch (error) {
          console.error('Error creating vector source:', error);
          setIsLoading(false);
          return;
        }

        // Create vector layer with simple styling
        vectorLayerRef.current = new VectorLayer({
          source: vectorSource,
          style: (feature, resolution) => {
            const props = feature.getProperties();
            const isSignal = props._layerType === 'signal';
            return getOpenLayersStyle(
              isSignal ? 'traffic_signals' : 'traffic_incidents', 
              feature, 
              resolution
            );
          },
        });
        
        // Add the layer to the map
        mapInstanceRef.current.addLayer(vectorLayerRef.current);
        
        setIsLoading(false);
      } 
      else {
        // Standard single layer loading
        const filePath = layerFileMap[activeLayer];
        
        if (!filePath) {
          console.warn(`No GeoJSON file mapped for layer: ${activeLayer}`);
          setIsLoading(false);
          return;
        }

        // Load GeoJSON data with progress indication
        console.log(`Loading layer: ${activeLayer} from ${filePath}`);
        const geoJsonData = await loadGeoJSON(filePath);
        
        if (!geoJsonData) {
          console.error(`Failed to load GeoJSON for layer: ${activeLayer}`);
          setIsLoading(false);
          return;
        }

        console.log(`Loaded GeoJSON for ${activeLayer}:`, {
          type: geoJsonData.type,
          featureCount: geoJsonData.features?.length || 0
        });

        // Create vector source from GeoJSON with chunking for large files
        let vectorSource;
        try {
          const geoJsonFormat = new GeoJSON();
          const features = geoJsonFormat.readFeatures(geoJsonData, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          });

          console.log(`Created ${features.length} features for ${activeLayer}`);

          // For very large datasets, use a strategy to improve performance
          vectorSource = new VectorSource({
            features: features,
            // Use strategy to improve rendering performance
            strategy: features.length > 10000 ? undefined : undefined, // Can add clustering for very large datasets
          });
        } catch (error) {
          console.error('Error creating vector source:', error);
          setIsLoading(false);
          return;
        }

        // Create vector layer with styling
        vectorLayerRef.current = new VectorLayer({
          source: vectorSource,
          style: (feature, resolution) => {
            return getOpenLayersStyle(activeLayer, feature, resolution);
          },
          // Ensure layer is interactive and updates properly
          updateWhileInteracting: true,
          updateWhileAnimating: true,
        });
        
        // Add the layer to the map
        mapInstanceRef.current.addLayer(vectorLayerRef.current);
        
        console.log(`Created vector layer for ${activeLayer}`);
      }
      
      // Ensure layer is added to map and fit extent
      if (vectorLayerRef.current) {
        // Make sure layer is added (in case it wasn't added in the if/else blocks)
        const layers = mapInstanceRef.current.getLayers().getArray();
        if (!layers.includes(vectorLayerRef.current)) {
          console.log('Layer not in map, adding it...');
          mapInstanceRef.current.addLayer(vectorLayerRef.current);
        }
        
        // Force map update
        mapInstanceRef.current.render();
        
        // Fit map to layer extent if available
        try {
          const source = vectorLayerRef.current.getSource();
          if (source) {
            // For cluster sources, get extent from the underlying source
            let extentSource = source;
            if (source.getSource && typeof source.getSource === 'function') {
              // This is a cluster source, get the underlying source
              extentSource = source.getSource();
            }
            
            if (extentSource && extentSource.getExtent) {
              const extent = extentSource.getExtent();
              console.log('Layer extent:', extent);
              if (extent && extent.length === 4 && 
                  !isNaN(extent[0]) && !isNaN(extent[1]) && 
                  !isNaN(extent[2]) && !isNaN(extent[3]) &&
                  extent[0] !== extent[2] && extent[1] !== extent[3]) {
                mapInstanceRef.current.getView().fit(extent, {
                  padding: [50, 50, 50, 50],
                  maxZoom: 15,
                  duration: 500,
                });
              }
            }
          }
        } catch (error) {
          console.warn('Error fitting extent:', error);
        }
      } else {
        console.warn('No vector layer created for:', activeLayer);
      }
      
      setIsLoading(false);
      console.log(`Layer loading complete for: ${activeLayer}`);

      // Add popup interaction - recreate handler when activeLayer changes to get current value
      // Remove existing handler if it exists
      if (mapInstanceRef.current._popupHandler) {
        mapInstanceRef.current.un('singleclick', mapInstanceRef.current._popupHandler);
      }
      
      // Create new handler with current activeLayer
      const clickHandler = (evt) => {
        // Use hitTolerance for better polygon detection (parks, flood zones, etc.)
        const feature = mapInstanceRef.current.forEachFeatureAtPixel(
          evt.pixel,
          (feature) => feature,
          {
            hitTolerance: 5, // 5 pixel tolerance for better click detection
            layerFilter: (layer) => {
              // Only check vector layers (not tile layers)
              return layer instanceof VectorLayer;
            }
          }
        );
        
        console.log('Click detected, feature found:', !!feature, 'activeLayer:', activeLayer);
        
        if (feature) {
          const props = feature.getProperties();
          const geom = feature.getGeometry();
          let layerId = activeLayer;
          
          console.log('Feature properties:', Object.keys(props));
          console.log('Feature geometry type:', geom?.getType());
          
          // Handle clustered features (traffic layer)
          if (activeLayer === 'traffic' && feature.get('features')) {
            const features = feature.get('features');
            if (features.length > 1) {
              // Cluster clicked - show summary
              const incidents = features.filter(f => f.get('_layerType') === 'incident').length;
              const signals = features.filter(f => f.get('_layerType') === 'signal').length;
              const clusterContent = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #ff8c00;">Traffic Cluster</b><br><span style="color: #666;"><strong>Total Items:</strong></span> ${features.length}<br><span style="color: #666;"><strong>Incidents:</strong></span> ${incidents}<br><span style="color: #666;"><strong>Signals:</strong></span> ${signals}</div>`;
              const mapElement = mapRef.current;
              if (mapElement) {
                const rect = mapElement.getBoundingClientRect();
                setPopupContent(clusterContent);
                setPopupPosition({ 
                  x: evt.pixel[0] + rect.left, 
                  y: evt.pixel[1] + rect.top 
                });
              } else {
                setPopupContent(clusterContent);
                setPopupPosition({ x: evt.pixel[0], y: evt.pixel[1] });
              }
              return;
            } else if (features.length === 1) {
              // Single feature in cluster
              const singleFeature = features[0];
              const singleProps = singleFeature.getProperties();
              const isSignal = singleProps._layerType === 'signal';
              layerId = isSignal ? 'traffic_signals' : 'traffic_incidents';
              const popupContent = createPopupContent(
                { properties: singleProps, geometry: singleFeature.getGeometry() },
                layerId
              );
              if (popupContent) {
                const mapElement = mapRef.current;
                if (mapElement) {
                  const rect = mapElement.getBoundingClientRect();
                  setPopupContent(popupContent);
                  setPopupPosition({ 
                    x: evt.pixel[0] + rect.left, 
                    y: evt.pixel[1] + rect.top 
                  });
                } else {
                  setPopupContent(popupContent);
                  setPopupPosition({ x: evt.pixel[0], y: evt.pixel[1] });
                }
              }
              return;
            }
          }
          
          // Determine layer ID for popup based on active layer
          if (activeLayer === 'lrt') {
            const isStop = geom && (geom.getType() === 'Point' || geom.getType() === 'MultiPoint');
            layerId = isStop ? 'lrt_stops' : 'lrt_lines';
          } else if (activeLayer === 'traffic') {
            const isSignal = props._layerType === 'signal';
            layerId = isSignal ? 'traffic_signals' : 'traffic_incidents';
          } else if (activeLayer === 'flood' || activeLayer === 'flood_01_chance') {
            layerId = 'flood_01_chance'; // Use flood_01_chance for popup formatting
          } else {
            // Ensure layerId is set to activeLayer if not handled above
            layerId = layerId || activeLayer;
          }
          
          const popupContent = createPopupContent(
            { properties: props, geometry: geom },
            layerId
          );
          
          console.log('Popup content created:', popupContent ? 'Yes' : 'No', 'Length:', popupContent?.length);
          console.log('LayerId used:', layerId);
          
          // Only show popup if content is not empty
          if (popupContent && popupContent.trim() && popupContent !== '<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px;">Feature</b></div>') {
            // Get map container position relative to viewport
            const mapElement = mapRef.current;
            if (mapElement) {
              const rect = mapElement.getBoundingClientRect();
              console.log('Setting popup at position:', evt.pixel[0] + rect.left, evt.pixel[1] + rect.top);
              setPopupContent(popupContent);
              setPopupPosition({ 
                x: evt.pixel[0] + rect.left, 
                y: evt.pixel[1] + rect.top 
              });
            } else {
              console.log('Setting popup at pixel position:', evt.pixel[0], evt.pixel[1]);
              setPopupContent(popupContent);
              setPopupPosition({ x: evt.pixel[0], y: evt.pixel[1] });
            }
          } else {
            console.log('Popup content rejected - empty or invalid');
          }
        } else {
          // Clicked on empty space - close popup
          setPopupContent(null);
        }
      };
      
      mapInstanceRef.current.on('singleclick', clickHandler);
      mapInstanceRef.current._popupHandler = clickHandler;

      // Add hover effect
      if (!mapInstanceRef.current._hoverHandler) {
        mapInstanceRef.current.on('pointermove', (evt) => {
          const feature = mapInstanceRef.current.forEachFeatureAtPixel(
            evt.pixel,
            (feature) => feature,
            {
              hitTolerance: 5, // 5 pixel tolerance for better hover detection
              layerFilter: (layer) => {
                // Only check vector layers (not tile layers)
                return layer instanceof VectorLayer;
              }
            }
          );
          
          mapInstanceRef.current.getViewport().style.cursor = feature ? 'pointer' : '';
        });
        mapInstanceRef.current._hoverHandler = true;
      }

      // Add layer to map
      mapInstanceRef.current.addLayer(vectorLayerRef.current);

      // Fit map to bounds of GeoJSON data
      const extent = vectorLayerRef.current.getSource().getExtent();
      console.log(`Extent for ${activeLayer}:`, extent);
      if (extent && extent[0] !== Infinity && extent[1] !== Infinity && !isNaN(extent[0]) && !isNaN(extent[1])) {
        try {
          mapInstanceRef.current.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 15,
          });
          console.log(`Fitted map to extent for ${activeLayer}`);
        } catch (error) {
          console.warn(`Error fitting extent for ${activeLayer}:`, error);
        }
      } else {
        console.warn(`Invalid extent for ${activeLayer}, not fitting bounds`);
      }

      setIsLoading(false);
      console.log(`OpenLayers: Layer "${activeLayer}" loaded and displayed`);
    };

    loadLayer();
    
    // Cleanup function to remove layer when switching
    return () => {
      if (vectorLayerRef.current) {
        try {
          mapInstanceRef.current.removeLayer(vectorLayerRef.current);
          vectorLayerRef.current = null;
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [activeLayer]);

  return (
    <div className="w-full h-full relative" style={{ width: '100%', height: '100%' }}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-gray-800/90 text-white px-4 py-2 rounded-lg shadow-lg z-[1000] flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Loading map data...</span>
        </div>
      )}
      
      {/* Layer info overlay */}
      {!isLoading && vectorLayerRef.current && (
        <div className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-2 rounded-lg shadow-lg z-[1000] text-sm">
          <span className="font-semibold">{activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1).replace(/_/g, ' ')} Layer</span>
        </div>
      )}
      
      {/* Integrated Popup Overlay */}
      {popupContent && (
        <>
          {/* Backdrop to close popup on outside click */}
          <div
            className="fixed inset-0 z-[1999]"
            onClick={() => setPopupContent(null)}
            style={{ backgroundColor: 'transparent' }}
          />
          {/* Popup card */}
          <div
            className="fixed bg-white rounded-lg shadow-2xl z-[2000] p-4 max-w-sm"
            style={{
              left: `${Math.min(popupPosition.x + 10, window.innerWidth - 350)}px`,
              top: `${Math.min(popupPosition.y + 10, window.innerHeight - 200)}px`,
              pointerEvents: 'auto',
              border: '2px solid #3b82f6',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1"></div>
              <button
                onClick={() => setPopupContent(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                aria-label="Close popup"
              >
                ×
              </button>
            </div>
            <div 
              dangerouslySetInnerHTML={{ __html: popupContent }}
              className="text-gray-800"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MapContainerOL;

