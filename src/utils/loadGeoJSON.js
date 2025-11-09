import { Style, Stroke, Fill, Circle, Icon } from 'ol/style';
import { getArea } from 'ol/sphere';
import { toLonLat } from 'ol/proj';

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
  safety: '/data/community-borders.json', // Safety uses community borders with crime data
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
  let content = '';
  
  // Layer-specific popup content (create content from scratch for each layer)
  if (layerId === 'major_roads') {
    // Major Roads - show road information with more detail
    const roadName = props.full_name || props.name || props.NAME || props.Name || 'Major Road';
    content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px; color: #3b82f6;">${roadName}</b>`;
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
  else if (layerId === 'parks' || (layerId && (layerId.includes('park') || props.park_name || props.park_type || props.area_ha))) {
    // Parks - show park information prominently (similar to flood risk popup)
    // Determine if it's a park or green space
    const parkTypeStr = props.park_type || props.type || '';
    const parkTypeLower = String(parkTypeStr).toLowerCase();
    const nameLower = String(props.park_name || props.name || props.NAME || props.Name || props.full_name || '').toLowerCase();
    
    // Determine if it's a park or green space
    const isPark = parkTypeLower.includes('park') || 
                   nameLower.includes('park') || 
                   parkTypeLower.includes('recreation') ||
                   parkTypeLower.includes('community park') ||
                   parkTypeLower.includes('regional park');
    
    const isGreenSpace = parkTypeLower.includes('green') || 
                         parkTypeLower.includes('natural') ||
                         parkTypeLower.includes('open space') ||
                         parkTypeLower.includes('conservation');
    
    const displayType = isPark ? 'Park' : (isGreenSpace ? 'Green Space' : 'Park/Green Space');
    const parkName = props.park_name || props.name || props.NAME || props.Name || props.full_name || displayType;
    const emoji = isPark ? '🌳' : (isGreenSpace ? '🌿' : '🌳');
    
    content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 18px; color: #22c55e;">${emoji} ${parkName}</b>`;
    
    // Show park type prominently first
    if (props.park_type) {
      const parkType = String(props.park_type).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><br><span style="color: #22c55e; font-size: 16px; font-weight: bold;">Type: ${parkType}</span>`;
    } else if (props.type && !props.type.match(/^(id|ID|Id)$/)) {
      const parkType = String(props.type).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><br><span style="color: #22c55e; font-size: 16px; font-weight: bold;">Type: ${parkType}</span>`;
    }
    
    // Calculate or get area
    let areaHectares = null;
    
    // First try to get area from properties
    if (props.area_ha !== null && props.area_ha !== undefined && props.area_ha !== '' && props.area_ha > 0) {
      areaHectares = typeof props.area_ha === 'number' ? props.area_ha : parseFloat(props.area_ha);
    } else if (props.area_sqm && props.area_sqm > 0) {
      areaHectares = (props.area_sqm / 10000);
    } else if (props.area !== null && props.area !== undefined && props.area !== '' && props.area > 0) {
      // Try to parse area, might be in different units
      const areaNum = typeof props.area === 'number' ? props.area : parseFloat(props.area);
      if (props.area_unit && props.area_unit.toLowerCase().includes('hectare')) {
        areaHectares = areaNum;
      } else if (props.area_unit && props.area_unit.toLowerCase().includes('meter')) {
        areaHectares = areaNum / 10000;
      } else {
        // Assume square meters if no unit specified
        areaHectares = areaNum / 10000;
      }
    } else {
      // Calculate area from geometry if available
      try {
        const geom = feature?.geometry;
        // Handle both OpenLayers geometry objects and GeoJSON geometry
        if (geom) {
          let olGeometry = null;
          
          // If it's an OpenLayers geometry (has getType method)
          if (geom.getType && typeof geom.getType === 'function') {
            olGeometry = geom;
          } 
          // If it's a GeoJSON geometry, we need to convert it
          else if (geom.type && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
            // For GeoJSON, we can calculate area using coordinates
            // This is a simplified calculation - for accurate results, use proper projection
            if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
              // Simple area calculation using shoelace formula (approximate for small areas)
              const coords = geom.coordinates[0];
              let area = 0;
              for (let i = 0; i < coords.length - 1; i++) {
                area += coords[i][0] * coords[i + 1][1];
                area -= coords[i + 1][0] * coords[i][1];
              }
              area = Math.abs(area) / 2;
              // Convert from square degrees to approximate square meters (rough estimate)
              // This is approximate - for accurate results, proper projection is needed
              // Using average latitude for Calgary (~51 degrees)
              const lat = coords[0]?.[1] || 51.0;
              const metersPerDegreeLat = 111320;
              const metersPerDegreeLon = 111320 * Math.cos(lat * Math.PI / 180);
              const areaSqm = area * metersPerDegreeLat * metersPerDegreeLon;
              if (areaSqm > 0) {
                areaHectares = areaSqm / 10000;
              }
            }
          }
          
          // If we have an OpenLayers geometry, use getArea
          if (olGeometry && (olGeometry.getType() === 'Polygon' || olGeometry.getType() === 'MultiPolygon')) {
            const areaSqm = getArea(olGeometry);
            if (areaSqm > 0) {
              areaHectares = areaSqm / 10000;
            }
          }
        }
      } catch (error) {
        console.log('Could not calculate area from geometry:', error);
      }
    }
    
    // Show area prominently
    if (areaHectares !== null && areaHectares > 0) {
      const areaFormatted = areaHectares.toLocaleString('en-US', { maximumFractionDigits: 2 });
      content += `<br><br><span style="color: #22c55e; font-size: 16px; font-weight: bold;">Size: ${areaFormatted} hectares</span>`;
      
      // Also show in acres for reference (1 hectare = 2.471 acres)
      const acres = (areaHectares * 2.471).toLocaleString('en-US', { maximumFractionDigits: 1 });
      content += `<br><span style="color: #666; font-size: 12px;">(${acres} acres)</span>`;
    } else {
      // If no area available, show other useful information
      if (props.ward) {
        content += `<br><br><span style="color: #22c55e; font-size: 16px; font-weight: bold;">Location: Ward ${props.ward}</span>`;
      } else if (props.quadrant) {
        content += `<br><br><span style="color: #22c55e; font-size: 16px; font-weight: bold;">Location: ${props.quadrant} Quadrant</span>`;
      } else if (props.sector) {
        content += `<br><br><span style="color: #22c55e; font-size: 16px; font-weight: bold;">Location: ${props.sector} Sector</span>`;
      } else if (props.description) {
        const desc = String(props.description).substring(0, 80);
        content += `<br><br><span style="color: #22c55e; font-size: 14px; font-weight: bold;">${desc}${String(props.description).length > 80 ? '...' : ''}</span>`;
      } else if (props.facilities || props.amenities) {
        const facilities = props.facilities || props.amenities;
        content += `<br><br><span style="color: #22c55e; font-size: 14px; font-weight: bold;">Features: ${facilities}</span>`;
      } else {
        content += `<br><br><span style="color: #22c55e; font-size: 14px; font-weight: bold;">${displayType}</span>`;
      }
    }
    
    // Additional details
    if (props.ward && (!props.area_ha && !props.area && !props.area_sqm)) {
      // Only show if not already shown above
    } else if (props.ward) {
      content += `<br><br><span style="color: #666;"><strong>Ward:</strong></span> ${props.ward}`;
    }
    if (props.quadrant && (!props.area_ha && !props.area && !props.area_sqm)) {
      // Only show if not already shown above
    } else if (props.quadrant) {
      content += `<br><span style="color: #666;"><strong>Quadrant:</strong></span> ${props.quadrant}`;
    }
    if (props.sector && (!props.area_ha && !props.area && !props.area_sqm)) {
      // Only show if not already shown above
    } else if (props.sector) {
      content += `<br><span style="color: #666;"><strong>Sector:</strong></span> ${props.sector}`;
    }
    if (props.description && (!props.area_ha && !props.area && !props.area_sqm)) {
      // Only show if not already shown above
    } else if (props.description) {
      const desc = String(props.description).substring(0, 150);
      content += `<br><br><span style="color: #666; font-size: 12px;">${desc}${String(props.description).length > 150 ? '...' : ''}</span>`;
    }
    if (props.facilities) {
      content += `<br><span style="color: #666;"><strong>Facilities:</strong></span> ${props.facilities}`;
    }
    if (props.amenities) {
      content += `<br><span style="color: #666;"><strong>Amenities:</strong></span> ${props.amenities}`;
    }
    content += `</div>`;
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
  else if (layerId === 'flood' || layerId === 'flood_01_chance' || 
           (layerId && (layerId.includes('flood') || props.scenario || props.flow_rate))) {
    // Flood Risk - show flow rate and probability prominently
    content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 18px; color: #0066cc;">⚠️ Flood Risk Zone</b>`;
    
    // Show probability of flooding prominently
    let probability = '1%';
    if (props.scenario) {
      // Extract probability from scenario if available (e.g., "1 in 100 Year" = 1%)
      const scenario = String(props.scenario).toLowerCase();
      if (scenario.includes('1 in 100') || scenario.includes('100 year')) {
        probability = '1%';
      } else if (scenario.includes('1 in 1000') || scenario.includes('1000 year')) {
        probability = '0.1%';
      } else if (scenario.includes('1 in 500') || scenario.includes('500 year')) {
        probability = '0.2%';
      } else if (scenario.includes('1 in 50') || scenario.includes('50 year')) {
        probability = '2%';
      }
      content += `<br><br><span style="color: #0066cc; font-size: 16px; font-weight: bold;">Annual Flood Probability: ${probability}</span>`;
      content += `<br><span style="color: #666; font-size: 12px;">(${props.scenario})</span>`;
    } else {
      content += `<br><br><span style="color: #0066cc; font-size: 16px; font-weight: bold;">Annual Flood Probability: ${probability}</span>`;
      content += `<br><span style="color: #666; font-size: 12px;">(1 in 100 Year Event)</span>`;
    }
    
    // Show flow rate prominently
    if (props.flow_rate !== null && props.flow_rate !== undefined && props.flow_rate > 0) {
      const flowRate = typeof props.flow_rate === 'number' ? props.flow_rate.toLocaleString('en-US', { maximumFractionDigits: 2 }) : props.flow_rate;
      content += `<br><br><span style="color: #0066cc; font-size: 16px; font-weight: bold;">Flow Rate: ${flowRate} m³/s</span>`;
    } else {
      content += `<br><br><span style="color: #666; font-size: 14px;">Flow Rate: Not specified</span>`;
    }
    
    // Additional details
    if (props.reach) {
      content += `<br><br><span style="color: #666;"><strong>Reach:</strong></span> ${props.reach}`;
    }
    if (props.type) {
      const floodType = String(props.type).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      content += `<br><span style="color: #666;"><strong>Type:</strong></span> ${floodType}`;
    }
    if (props.id !== null && props.id !== undefined) {
      content += `<br><span style="color: #666;"><strong>Zone ID:</strong></span> ${props.id}`;
    }
    content += `</div>`;
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
    // Only create default content if no layer-specific content was created
    if (!content) {
      content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px;">${name}</b>`;
    }
    
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
  
  // Ensure content always has a closing div
  if (content && !content.includes('</div>')) {
    content += '</div>';
  }
  
  // If content is still empty, create a minimal default
  if (!content || content.trim() === '') {
    content = `<div style="min-width: 200px; max-width: 300px;"><b style="font-size: 16px;">${name}</b></div>`;
  }
  
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
      // Determine line color based on specific routes and direction/quadrant
      const lineProps = properties;
      const route = String(lineProps.route || lineProps.line || '').toUpperCase();
      const quadrant = String(lineProps.quadrant || lineProps.octant || '').toUpperCase();
      const direction = String(lineProps.direction || lineProps.direction_ || '').toUpperCase();
      const leg = String(lineProps.leg || '').toUpperCase();
      
      // Special case: Erlton to Somerset line (Route 201, SW leg, North/South) = RED
      const isErltonToSomerset = (route.includes('201') && leg.includes('SW') && direction.includes('NORTH/SOUTH')) ||
                                  (route.includes('201') && leg.includes('SW'));
      
      // Special case: All West leg lines (Sunalta, Shaganappi Point, Westbrook, 45 Street, Sirocco, 69 Street) = BLUE
      // Check for "WEST" but exclude "NW" and "SW" to avoid false matches
      const isWestLeg = (leg === 'WEST' || leg.includes('WEST')) && 
                        !leg.includes('NW') && 
                        !leg.includes('SW');
      
      // Check if it's NW (northwest) or NE (northeast) - prioritize leg property
      // Only check if not Erlton to Somerset and not West leg
      let isNW = false;
      let isNE = false;
      if (!isErltonToSomerset && !isWestLeg) {
        // Prioritize leg property (most reliable)
        if (leg.includes('NE')) {
          isNE = true;
        } else if (leg.includes('NW')) {
          isNW = true;
        } else {
          // Fallback to other properties
          isNW = quadrant.includes('NW') || 
                  direction.includes('NW') || 
                  direction.includes('WEST');
          isNE = quadrant.includes('NE') || 
                 direction.includes('NE') || 
                 direction.includes('EAST');
        }
      }
      
      // If quadrant/direction not found, check coordinates to determine NW vs NE
      // Calgary center is approximately -114.0719, 51.0447
      let isNWByCoords = false;
      let isNEByCoords = false;
      if (!isErltonToSomerset && !isNW && !isNE && geometry) {
        try {
          const extent = geometry.getExtent();
          if (extent && extent.length === 4) {
            // Get center longitude of the line
            const centerLon = (extent[0] + extent[2]) / 2;
            // Convert from EPSG:3857 to lon/lat if needed, or use directly if already in lon/lat
            // For Calgary, lines west of center (~-114.1) are NW, east are NE
            // But we're in EPSG:3857, so we need to check differently
            // Actually, let's check the actual coordinates
            const coords = geometry.getCoordinates();
            if (coords && coords.length > 0) {
              // Get first coordinate and convert to lon/lat
              const firstCoord = coords[0];
              if (Array.isArray(firstCoord) && firstCoord.length >= 2) {
                const [lon, lat] = toLonLat([firstCoord[0], firstCoord[1]]);
                // Calgary center longitude is approximately -114.07
                // Lines with longitude < -114.07 are more west (NW), > -114.07 are more east (NE)
                if (lon < -114.07) {
                  isNWByCoords = true;
                } else if (lon > -114.07) {
                  isNEByCoords = true;
                }
              }
            }
          }
        } catch (error) {
          console.log('Could not determine line direction from coordinates:', error);
        }
      }
      
      // Erlton to Somerset = Red, West leg = Blue, NE = Blue, NW = Red, default to red
      const lineColor = (isErltonToSomerset || isNW || isNWByCoords) ? 'rgba(239,68,68,1.0)' : 
                        (isWestLeg || isNE || isNEByCoords) ? 'rgba(59,130,246,1.0)' : 
                        'rgba(239,68,68,1.0)'; // Default to red
      
      return new Style({
        stroke: new Stroke({
          color: lineColor,
          width: 2,
        }),
      });
      
    case 'lrt_stops':
      // Determine line color based on specific routes and direction/quadrant
      const stopProps = properties;
      const stopRoute = String(stopProps.route || stopProps.line || '').toUpperCase();
      const stopQuadrant = String(stopProps.quadrant || stopProps.octant || '').toUpperCase();
      const stopDirection = String(stopProps.direction || stopProps.direction_ || '').toUpperCase();
      const stopLeg = String(stopProps.leg || '').toUpperCase();
      const stopName = String(stopProps.stationnam || stopProps.name || stopProps.stop_name || '').toUpperCase();
      
      // Special case: Erlton to Somerset line stops (Route 201, SW leg, North/South) = RED
      const isErltonToSomersetStop = (stopRoute.includes('201') && stopLeg.includes('SW') && stopDirection.includes('NORTH/SOUTH')) ||
                                      (stopRoute.includes('201') && stopLeg.includes('SW'));
      
      // Manually set specific West leg stations to BLUE
      const isWestLegStop = stopName.includes('SUNALTA') ||
                            stopName.includes('SHAGANAPPI POINT') ||
                            stopName.includes('SHAGANAPPI') ||
                            stopName.includes('WESTBROOK') ||
                            stopName.includes('45 STREET') ||
                            stopName.includes('SIROCCO') ||
                            stopName.includes('69 STREET');
      
      // Check if it's NW (northwest) or NE (northeast) - prioritize leg property
      // Only check if not Erlton to Somerset and not West leg
      let isNWStop = false;
      let isNEStop = false;
      if (!isErltonToSomersetStop && !isWestLegStop) {
        // Prioritize leg property (most reliable)
        if (stopLeg.includes('NE')) {
          isNEStop = true;
        } else if (stopLeg.includes('NW')) {
          isNWStop = true;
        } else {
          // Fallback to other properties - but don't use "WEST" direction here as it conflicts with West leg
          isNWStop = stopQuadrant.includes('NW') || 
                      stopDirection.includes('NW');
          isNEStop = stopQuadrant.includes('NE') || 
                     stopDirection.includes('NE') || 
                     stopDirection.includes('EAST');
        }
      }
      
      // If quadrant/direction not found, check coordinates to determine NW vs NE
      let isNWStopByCoords = false;
      let isNEStopByCoords = false;
      if (!isErltonToSomersetStop && !isNWStop && !isNEStop && geometry) {
        try {
          const coords = geometry.getCoordinates();
          if (coords && coords.length >= 2) {
            const [lon, lat] = toLonLat(coords);
            // Calgary center longitude is approximately -114.07
            // Stops with longitude < -114.07 are more west (NW), > -114.07 are more east (NE)
            if (lon < -114.07) {
              isNWStopByCoords = true;
            } else if (lon > -114.07) {
              isNEStopByCoords = true;
            }
          }
        } catch (error) {
          console.log('Could not determine stop direction from coordinates:', error);
        }
      }
      
      // All train icons are black
      const trainColor = '#000000';
      
      // Use minimalist train icon (silhouette style) in black
      const trainIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect x="10" y="6" width="12" height="18" rx="2" fill="${trainColor}"/>
        <line x1="12" y1="8" x2="20" y2="8" stroke="${trainColor}" stroke-width="0.5" opacity="0.2"/>
        <circle cx="13" cy="20" r="1.5" fill="${trainColor}"/>
        <circle cx="19" cy="20" r="1.5" fill="${trainColor}"/>
        <line x1="8" y1="28" x2="13" y2="24" stroke="${trainColor}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="24" y1="28" x2="19" y2="24" stroke="${trainColor}" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
      return new Style({
        image: new Icon({
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(trainIconSvg),
          scale: 1.0,
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
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
      
    case 'safety':
      // Style based on crime count - using 200-crime intervals per class
      // Each class represents 200 crimes (0-200, 200-400, 400-600, etc.)
      const crimeCount = properties.crime_by_community_total_crime || 0;
      const intervalSize = 200; // Each class covers 200 crimes
      const classIndex = Math.floor(crimeCount / intervalSize);
      const positionInClass = (crimeCount % intervalSize) / intervalSize; // 0-1 within the class
      
      // Define many classes (15 classes = up to 3000 crimes) with distinct colors
      const getClassColor = (index) => {
        const classes = [
          { r: 240, g: 255, b: 250, opacity: 0.10 },   // 0-200: Very light cyan-green
          { r: 200, g: 255, b: 220, opacity: 0.15 },   // 200-400: Light green
          { r: 160, g: 255, b: 180, opacity: 0.20 },   // 400-600: Bright green
          { r: 140, g: 255, b: 150, opacity: 0.25 },   // 600-800: Yellow-green
          { r: 220, g: 255, b: 120, opacity: 0.30 },   // 800-1000: Lime
          { r: 255, g: 255, b: 100, opacity: 0.35 },   // 1000-1200: Light yellow
          { r: 255, g: 255, b: 80, opacity: 0.40 },    // 1200-1400: Yellow
          { r: 255, g: 240, b: 60, opacity: 0.45 },    // 1400-1600: Yellow-orange
          { r: 255, g: 220, b: 40, opacity: 0.50 },    // 1600-1800: Light orange
          { r: 255, g: 200, b: 20, opacity: 0.55 },     // 1800-2000: Orange
          { r: 255, g: 170, b: 0, opacity: 0.60 },    // 2000-2200: Deep orange
          { r: 255, g: 140, b: 0, opacity: 0.65 },     // 2200-2400: Red-orange
          { r: 255, g: 100, b: 0, opacity: 0.70 },    // 2400-2600: Bright red
          { r: 220, g: 50, b: 0, opacity: 0.80 },      // 2600-2800: Dark red
          { r: 150, g: 20, b: 0, opacity: 0.90 },     // 2800-3000: Very dark red
          { r: 50, g: 5, b: 0, opacity: 0.98 },        // 3000+: Almost black
        ];
        return classes[Math.min(index, classes.length - 1)];
      };
      
      const currentClass = getClassColor(classIndex);
      const nextClass = getClassColor(classIndex + 1);
      
      // Interpolate within the class
      const r = Math.round(currentClass.r + (nextClass.r - currentClass.r) * positionInClass);
      const g = Math.round(currentClass.g + (nextClass.g - currentClass.g) * positionInClass);
      const b = Math.round(currentClass.b + (nextClass.b - currentClass.b) * positionInClass);
      const opacity = currentClass.opacity + (nextClass.opacity - currentClass.opacity) * positionInClass;
      
      // Normalize for stroke calculation (0-1 scale)
      const normalizedCrime = Math.min(crimeCount / 3000, 1);
      
      // Stroke color - darker for higher crime
      const strokeR = Math.round(140 - (140 - 10) * normalizedCrime);
      const strokeG = Math.round(140 - (140 - 3) * normalizedCrime);
      const strokeB = Math.round(120 - (120 - 2) * normalizedCrime);
      const strokeWidth = 0.5 + normalizedCrime * 4.5; // 0.5px to 5px
      
      if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
        return new Style({
          stroke: new Stroke({
            color: `rgba(${strokeR},${strokeG},${strokeB},${0.3 + 0.7 * normalizedCrime})`,
            width: strokeWidth,
          }),
          fill: new Fill({
            color: `rgba(${r},${g},${b},${opacity})`,
          }),
        });
      }
      // Fallback for point features
      return new Style({
        image: new Circle({
          radius: 4 + normalizedCrime * 12, // 4px to 16px
          fill: new Fill({ 
            color: `rgba(${r},${g},${b},${opacity})` 
          }),
          stroke: new Stroke({ 
            color: `rgba(${strokeR},${strokeG},${strokeB},1)`,
            width: strokeWidth
          }),
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

