/**
 * Utility function to load GeoJSON files
 * @param {string} url - Path to GeoJSON file in public folder
 * @returns {Promise<Object>} GeoJSON data
 */
export const loadGeoJSON = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return null;
  }
};

/**
 * Map layer IDs to their corresponding GeoJSON file paths
 */
export const layerFileMap = {
  flood: '/data/calgary-flood.json',
  accessibility: '/data/accessibility.geojson', // Add your accessibility GeoJSON
  safety: '/data/safety.geojson', // Add your safety GeoJSON
  sustainability: '/data/sustainability.geojson', // Add your sustainability GeoJSON
};

/**
 * Get style function based on layer type and feature properties
 */
export const getLayerStyle = (layerId, feature) => {
  const properties = feature?.properties || {};
  
  switch (layerId) {
    case 'flood':
      // Style based on risk level
      const risk = properties.risk?.toLowerCase();
      const intensity = properties.intensity || 0;
      
      if (risk === 'high') {
        return {
          color: '#ef4444', // red
          weight: 3,
          opacity: 0.8,
          fillColor: '#ef4444',
          fillOpacity: 0.4 + (intensity * 0.3),
        };
      } else if (risk === 'medium') {
        return {
          color: '#f59e0b', // amber
          weight: 2,
          opacity: 0.7,
          fillColor: '#f59e0b',
          fillOpacity: 0.3,
        };
      } else {
        return {
          color: '#10b981', // green
          weight: 2,
          opacity: 0.6,
          fillColor: '#10b981',
          fillOpacity: 0.2,
        };
      }
      
    case 'accessibility':
      return {
        color: '#22c55e', // green
        weight: 2,
        opacity: 0.7,
        fillColor: '#22c55e',
        fillOpacity: 0.3,
      };
      
    case 'safety':
      return {
        color: '#a855f7', // purple
        weight: 2,
        opacity: 0.7,
        fillColor: '#a855f7',
        fillOpacity: 0.3,
      };
      
    case 'sustainability':
      return {
        color: '#10b981', // emerald
        weight: 2,
        opacity: 0.7,
        fillColor: '#10b981',
        fillOpacity: 0.3,
      };
      
    default:
      return {
        color: '#3b82f6', // blue
        weight: 2,
        opacity: 0.7,
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
      };
  }
};

/**
 * Create popup content from feature properties
 */
export const createPopupContent = (feature) => {
  const props = feature?.properties || {};
  const name = props.name || props.NAME || props.Name || 'Feature';
  
  let content = `<div style="min-width: 150px;"><b>${name}</b>`;
  
  // Add other properties
  Object.entries(props).forEach(([key, value]) => {
    if (key !== 'name' && key !== 'NAME' && key !== 'Name') {
      if (typeof value === 'number') {
        content += `<br><span style="color: #666;">${key}:</span> ${value.toFixed(2)}`;
      } else if (typeof value === 'string' && value.length < 50) {
        content += `<br><span style="color: #666;">${key}:</span> ${value}`;
      }
    }
  });
  
  content += '</div>';
  return content;
};

