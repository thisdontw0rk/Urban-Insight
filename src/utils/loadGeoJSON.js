import { Style, Stroke, Fill, Circle, Icon } from 'ol/style';

// Cache for loaded GeoJSON files to avoid re-fetching
const geoJsonCache = new Map();

/**
 * Utility function to load GeoJSON files (with caching)
 * @param {string} url - Path to GeoJSON file in public folder
 * @returns {Promise<Object>} GeoJSON data
 */
export const loadGeoJSON = async (url) => {
  // Return cached data if available
  if (geoJsonCache.has(url)) {
    return geoJsonCache.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Cache the data for future use
    geoJsonCache.set(url, data);
    
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
  // Original layers
  flood: '/data/flood-01-chance.json', // Use flood-01-chance.json for flood risk
  accessibility: '/data/accessibility.geojson',
  safety: '/data/safety.geojson',
  sustainability: '/data/sustainability.geojson',
  
  // OpenLayers QGIS export layers
  community_borders: '/data/community-borders.json',
  lrt: null, // Special case - combines lines and stops
  lrt_lines: '/data/lrt-lines.json', // Used internally for styling
  lrt_stops: '/data/lrt-stops.json', // Used internally for styling
  major_roads: '/data/major-roads.json',
  parks: '/data/parks.json',
  traffic: null, // Special case - combines incidents and signals
  traffic_incidents: '/data/traffic-incidents.json', // Used internally for styling
  traffic_signals: '/data/traffic-signals.json', // Used internally for styling
  flood_01_chance: '/data/flood-01-chance.json',
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
      
    case 'flood_01_chance':
      // QGIS style: dark gray border, light blue fill
      return {
        color: 'rgba(35,35,35,1.0)', // dark gray
        weight: 1.0,
        opacity: 1,
        fill: true,
        fillColor: 'rgba(21,174,243,0.45)', // light blue with transparency
        fillOpacity: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
      };
      
    case 'major_roads':
      // QGIS OpenLayers style: blue lines
      return {
        color: 'rgba(0,124,251,1.0)', // blue
        weight: 1.0,
        opacity: 1,
        fillOpacity: 0,
        lineCap: 'square',
        lineJoin: 'bevel',
      };
      
    case 'lrt_lines':
      return {
        color: 'rgba(255,0,0,1.0)', // red
        weight: 2,
        opacity: 1,
        fillOpacity: 0,
      };
      
    case 'lrt_stops':
      return {
        color: 'rgba(255,0,0,1.0)', // red
        weight: 1,
        opacity: 1,
        fillColor: 'rgba(255,0,0,1.0)',
        fillOpacity: 1,
        radius: 6,
      };
      
    case 'parks':
      return {
        color: 'rgba(34,139,34,1.0)', // green
        weight: 1,
        opacity: 1,
        fillColor: 'rgba(34,139,34,0.3)',
        fillOpacity: 0.3,
      };
      
    case 'traffic_incidents':
      return {
        color: 'rgba(255,165,0,1.0)', // orange
        weight: 1,
        opacity: 1,
        fillColor: 'rgba(255,165,0,1.0)',
        fillOpacity: 1,
        radius: 5,
      };
      
    case 'traffic_signals':
      return {
        color: 'rgba(255,255,0,1.0)', // yellow
        weight: 1,
        opacity: 1,
        fillColor: 'rgba(255,255,0,1.0)',
        fillOpacity: 1,
        radius: 4,
      };
      
    case 'community_borders':
      return {
        color: 'rgba(128,128,128,1.0)', // gray
        weight: 1,
        opacity: 1,
        fillColor: 'rgba(128,128,128,0.1)',
        fillOpacity: 0.1,
      };
      
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
export const createPopupContent = (feature, layerId) => {
  const props = feature?.properties || {};
  let name = props.name || props.NAME || props.Name || props.full_name || 'Feature';
  let content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px;">${name}</b>`;
  
  // Layer-specific popup content
  if (layerId === 'major_roads') {
    // Major Roads - show road information with more detail
    if (props.full_name && props.full_name !== name) {
      content += `<br><span style="color: #666;"><strong>Full Name:</strong></span> ${props.full_name}`;
    }
    if (props.street_typ) {
      const roadType = props.street_typ.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><span style="color: #666;"><strong>Road Type:</strong></span> ${roadType}`;
    }
    if (props.direction_) {
      const direction = props.direction_.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><span style="color: #666;"><strong>Direction:</strong></span> ${direction}`;
    }
    if (props.surface) {
      const surface = props.surface.charAt(0).toUpperCase() + props.surface.slice(1).toLowerCase();
      content += `<br><span style="color: #666;"><strong>Surface:</strong></span> ${surface}`;
    }
    if (props.ctp_class) {
      content += `<br><span style="color: #666;"><strong>Road Class:</strong></span> ${props.ctp_class}`;
    }
    if (props.octant) {
      content += `<br><span style="color: #666;"><strong>Quadrant:</strong></span> ${props.octant}`;
    }
    if (props.plan_statu) {
      const planStatus = props.plan_statu.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><span style="color: #666;"><strong>Plan Status:</strong></span> ${planStatus}`;
    }
  }
  else if (layerId === 'traffic' || layerId === 'traffic_incidents' || layerId === 'traffic_signals') {
    // Traffic layer - show incident or signal specific info
    if (props._layerType === 'incident' || layerId === 'traffic_incidents') {
      // Traffic Incident
      if (props.incident_i) {
        content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #ff6b35;">Traffic Incident</b>`;
        content += `<br><span style="color: #666;"><strong>Location:</strong></span> ${props.incident_i}`;
      }
      if (props.descriptio) {
        content += `<br><span style="color: #666;"><strong>Description:</strong></span> ${props.descriptio}`;
      }
      if (props.date_start) {
        content += `<br><span style="color: #666;"><strong>Date:</strong></span> ${props.date_start}`;
      }
      if (props.time_start) {
        const time = props.time_start.substring(0, 5); // Format time
        content += `<br><span style="color: #666;"><strong>Time:</strong></span> ${time}`;
      }
      if (props.date_modif && props.date_modif !== props.date_start) {
        content += `<br><span style="color: #666;"><strong>Last Modified:</strong></span> ${props.date_modif}`;
      }
      if (props.quadrant) {
        content += `<br><span style="color: #666;"><strong>Quadrant:</strong></span> ${props.quadrant}`;
      }
      if (props.count) {
        content += `<br><span style="color: #666;"><strong>Count:</strong></span> ${props.count}`;
      }
    } else if (props._layerType === 'signal' || layerId === 'traffic_signals') {
      // Traffic Signal
      content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #ffd700;">Traffic Signal</b>`;
      if (props.firstroad && props.secondroad) {
        content += `<br><span style="color: #666;"><strong>Intersection:</strong></span> ${props.firstroad} & ${props.secondroad}`;
      } else if (props.firstroad) {
        content += `<br><span style="color: #666;"><strong>Road:</strong></span> ${props.firstroad}`;
      }
      if (props.int_type) {
        const intType = props.int_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        content += `<br><span style="color: #666;"><strong>Type:</strong></span> ${intType}`;
      }
      if (props.quadrant) {
        content += `<br><span style="color: #666;"><strong>Quadrant:</strong></span> ${props.quadrant}`;
      }
      if (props.instdate) {
        content += `<br><span style="color: #666;"><strong>Installation Date:</strong></span> ${props.instdate}`;
      }
      if (props.mistno) {
        content += `<br><span style="color: #666;"><strong>MIST Number:</strong></span> ${props.mistno}`;
      }
      if (props.pedbuttons === 'Yes') {
        content += `<br><span style="color: #666;">✓ Pedestrian Buttons</span>`;
      }
      if (props.ped_timer === 'Yes') {
        content += `<br><span style="color: #666;">✓ Pedestrian Timer</span>`;
      }
      if (props.accessible === 'Yes') {
        content += `<br><span style="color: #666;">✓ Accessible</span>`;
      }
    }
  }
  else if (layerId === 'parks') {
    // Parks - show park information
    if (props.park_name || props.name) {
      const parkName = props.park_name || props.name;
      content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #22c55e;">${parkName}</b>`;
    }
    if (props.park_type) {
      const parkType = props.park_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><span style="color: #666;"><strong>Type:</strong></span> ${parkType}`;
    }
    if (props.area_ha) {
      content += `<br><span style="color: #666;"><strong>Area:</strong></span> ${props.area_ha.toFixed(2)} hectares`;
    } else if (props.area) {
      content += `<br><span style="color: #666;"><strong>Area:</strong></span> ${props.area}`;
    }
    if (props.ward) {
      content += `<br><span style="color: #666;"><strong>Ward:</strong></span> ${props.ward}`;
    }
    if (props.quadrant) {
      content += `<br><span style="color: #666;"><strong>Quadrant:</strong></span> ${props.quadrant}`;
    }
  }
  else if (layerId === 'lrt' || layerId === 'lrt_stops' || layerId === 'lrt_lines') {
    // LRT - show stop or line information
    const geom = feature?.geometry;
    const isStop = geom && (geom.getType && geom.getType() === 'Point' || geom.type === 'Point');
    
    if (isStop || layerId === 'lrt_stops') {
      // LRT Stop - show station name and address
      const stationName = props.stationnam || props.stop_name || props.name || 'LRT Station';
      content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 18px; color: #ef4444;">${stationName}</b>`;
      
      // Show address if available
      if (props.address) {
        content += `<br><span style="color: #666;"><strong>Address:</strong></span> ${props.address}`;
      } else if (props.street || props.location) {
        const address = props.street || props.location;
        content += `<br><span style="color: #666;"><strong>Location:</strong></span> ${address}`;
      }
      
      // Show route/line information
      if (props.route) {
        content += `<br><span style="color: #666;"><strong>Route:</strong></span> ${props.route}`;
      } else if (props.line) {
        content += `<br><span style="color: #666;"><strong>Line:</strong></span> ${props.line}`;
      }
      
      // Show direction and leg information
      if (props.direction) {
        content += `<br><span style="color: #666;"><strong>Direction:</strong></span> ${props.direction}`;
      }
      if (props.leg) {
        const leg = props.leg.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        content += `<br><span style="color: #666;"><strong>Area:</strong></span> ${leg}`;
      }
      
      // Show status
      if (props.status) {
        const status = props.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        content += `<br><span style="color: #666;"><strong>Status:</strong></span> ${status}`;
      }
      
      // Show facility type if available
      if (props.facility_type) {
        const facilityType = props.facility_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        content += `<br><span style="color: #666;"><strong>Facility:</strong></span> ${facilityType}`;
      }
      
      // Show accessibility
      if (props.accessible) {
        content += `<br><span style="color: #666;">${props.accessible === 'Yes' ? '✓' : ''} Accessible</span>`;
      }
    } else {
      // LRT Line
      content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #ef4444;">LRT Line</b>`;
      if (props.line_name || props.name) {
        const lineName = props.line_name || props.name;
        content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #ef4444;">${lineName}</b>`;
      }
      if (props.line) {
        content += `<br><span style="color: #666;"><strong>Line:</strong></span> ${props.line}`;
      }
      if (props.length_km) {
        content += `<br><span style="color: #666;"><strong>Length:</strong></span> ${props.length_km.toFixed(2)} km`;
      }
      if (props.line_id) {
        content += `<br><span style="color: #666;"><strong>Line ID:</strong></span> ${props.line_id}`;
      }
      if (props.status) {
        const status = props.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        content += `<br><span style="color: #666;"><strong>Status:</strong></span> ${status}`;
      }
    }
  }
  else if (layerId === 'flood' || layerId === 'flood_01_chance') {
    // Flood Risk - show flood zone information
    content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #3b82f6;">Flood Risk Zone</b>`;
    if (props.scenario) {
      content += `<br><span style="color: #666;"><strong>Scenario:</strong></span> ${props.scenario}`;
    }
    if (props.type) {
      const floodType = props.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><span style="color: #666;"><strong>Type:</strong></span> ${floodType}`;
    }
    if (props.reach) {
      content += `<br><span style="color: #666;"><strong>Reach:</strong></span> ${props.reach}`;
    }
    if (props.flow_rate !== null && props.flow_rate !== undefined && props.flow_rate > 0) {
      content += `<br><span style="color: #666;"><strong>Flow Rate:</strong></span> ${props.flow_rate} m³/s`;
    }
    if (props.id !== null && props.id !== undefined) {
      content += `<br><span style="color: #666;"><strong>Zone ID:</strong></span> ${props.id}`;
    }
    content += `<br><span style="color: #0066cc; font-weight: bold;">⚠️ 1% Annual Chance Flood Zone</span>`;
  }
  else if (layerId === 'community_borders') {
    // Community Borders - show community information
    if (props.community_name || props.name) {
      const communityName = props.community_name || props.name;
      content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #6b7280;">${communityName}</b>`;
    }
    if (props.sector) {
      content += `<br><span style="color: #666;"><strong>Sector:</strong></span> ${props.sector}`;
    }
    if (props.ward) {
      content += `<br><span style="color: #666;"><strong>Ward:</strong></span> ${props.ward}`;
    }
    if (props.quadrant) {
      content += `<br><span style="color: #666;"><strong>Quadrant:</strong></span> ${props.quadrant}`;
    }
    if (props.crime_by_community_total_crime) {
      content += `<br><span style="color: #666;"><strong>Crime Index:</strong></span> ${props.crime_by_community_total_crime}`;
    }
    if (props.community_id) {
      content += `<br><span style="color: #666;"><strong>Community ID:</strong></span> ${props.community_id}`;
    }
    if (props.population) {
      content += `<br><span style="color: #666;"><strong>Population:</strong></span> ${props.population.toLocaleString()}`;
    }
  }
  else if (layerId === 'safety') {
    // Safety - show crime statistics
    if (props.community_name || props.name) {
      const communityName = props.community_name || props.name;
      content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #a855f7;">${communityName}</b>`;
    }
    if (props.crime_by_community_total_crime) {
      content += `<br><span style="color: #666;"><strong>Total Crimes:</strong></span> ${props.crime_by_community_total_crime.toLocaleString()}`;
    }
    if (props.sector) {
      content += `<br><span style="color: #666;"><strong>Sector:</strong></span> ${props.sector}`;
    }
  }
  else {
    // Default - show only meaningful fields, filter technical ones
    const technicalFields = [
      'id', 'ID', 'Id', 'modified_a', 'modified_g', 'obsolete_c', 'segment_id',
      'left_from_', 'left_to_ad', 'right_from', 'right_to_a', 'municipali',
      'plan_statu', 'plan_numbe', 'name_valid', 'one_way', 'built_stat',
      'ownership', 'aquisition', 'asset_owne', 'attribute_', 'class_code',
      'octant', 'count', '_layerType', 'longitude', 'latitude'
    ];
    
    const meaningfulFields = ['description', 'type', 'status', 'category', 'ward', 'sector', 'quadrant'];
    
    Object.entries(props).forEach(([key, value]) => {
      if (technicalFields.includes(key) || 
          key === 'name' || key === 'NAME' || key === 'Name' || key === 'full_name' ||
          key.startsWith('_') || key.includes('_id') || key.includes('modified') ||
          key.includes('obsolete') || key.includes('valid')) {
        return;
      }
      
      if (value !== null && value !== undefined && value !== '') {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (meaningfulFields.some(f => key.toLowerCase().includes(f)) || 
            (typeof value === 'string' && value.length > 2 && value.length < 50 && 
             value !== 'N' && value !== 'Y' && value !== 'No' && value !== 'Yes')) {
          const formattedValue = typeof value === 'string' 
            ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            : value;
          content += `<br><span style="color: #666;"><strong>${formattedKey}:</strong></span> ${formattedValue}`;
        }
      }
    });
  }
  
  content += '</div>';
  return content;
};

/**
 * Get OpenLayers style function based on layer type and feature properties
 * Returns an OpenLayers Style object
 */
export const getOpenLayersStyle = (layerId, feature, resolution) => {
  const properties = feature?.getProperties() || {};
  const geometry = feature?.getGeometry();
  
  if (!geometry) return null;
  
  const geomType = geometry.getType();
  
  switch (layerId) {
    case 'major_roads':
      // Style for line features (roads)
      if (geomType === 'LineString' || geomType === 'MultiLineString') {
        return new Style({
          stroke: new Stroke({
            color: 'rgba(0,124,251,1.0)',
            width: 1.5,
            lineCap: 'square',
            lineJoin: 'bevel',
          }),
        });
      }
      // Fallback for other geometry types
      return new Style({
        stroke: new Stroke({
          color: 'rgba(0,124,251,1.0)',
          width: 1.5,
        }),
      });
      
    case 'flood':
    case 'flood_01_chance':
      return new Style({
        stroke: new Stroke({
          color: 'rgba(0,145,255,1.0)',
          width: 0.988,
          lineCap: 'butt',
          lineJoin: 'miter',
        }),
        fill: new Fill({
          color: 'rgba(0,140,255,0.45)',
        }),
      });
      
    case 'lrt_lines':
      return new Style({
        stroke: new Stroke({
          color: 'rgba(255,0,0,1.0)',
          width: 2,
        }),
      });
      
    case 'lrt_stops':
      return new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: 'rgba(255,0,0,1.0)' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      });
      
    case 'parks':
      // Style for polygon features (parks)
      if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
        return new Style({
          stroke: new Stroke({
            color: 'rgba(34,139,34,1.0)',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(34,139,34,0.4)',
          }),
        });
      }
      // Fallback for point features
      return new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: 'rgba(34,139,34,0.8)' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      });
      
    case 'traffic_incidents':
      // Use warning triangle icon for incidents
      const incidentIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" fill="#FF6B35" stroke="#fff" stroke-width="1.5"/><path d="M12 9v5M12 17h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
      return new Style({
        image: new Icon({
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(incidentIconSvg),
          scale: 0.8,
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
        }),
      });
      
    case 'traffic_signals':
      // Use traffic light icon for signals - make it more prominent
      const signalIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><rect x="6" y="2" width="12" height="28" rx="2" fill="#1a1a1a" stroke="#fff" stroke-width="2"/><circle cx="12" cy="10" r="4" fill="#FF0000" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="18" r="4" fill="#FFA500" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="26" r="4" fill="#00FF00" stroke="#fff" stroke-width="1.5"/></svg>';
      return new Style({
        image: new Icon({
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(signalIconSvg),
          scale: 1.2, // Increased from 0.9 to make more prominent
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
        }),
      });
      
    case 'flood':
      // Style for flood risk areas
      if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
        return new Style({
          stroke: new Stroke({
            color: 'rgba(0,145,255,1.0)',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(0,140,255,0.3)',
          }),
        });
      }
      return new Style({
        stroke: new Stroke({
          color: 'rgba(0,145,255,1.0)',
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(0,140,255,0.3)',
        }),
      });
      
    case 'community_borders':
      // Default style for community borders
      return new Style({
        stroke: new Stroke({
          color: 'rgba(128,128,128,1.0)',
          width: 1,
        }),
        fill: new Fill({
          color: 'rgba(128,128,128,0.1)',
        }),
      });
      
    default:
      return new Style({
        stroke: new Stroke({
          color: 'rgba(59,130,246,1.0)',
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(59,130,246,0.2)',
        }),
      });
  }
};

