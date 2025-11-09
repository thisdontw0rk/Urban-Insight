import { loadGeoJSON } from './loadGeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Point, Polygon, MultiPolygon } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';

// Cache for loaded data
let dataCache = {
  communities: null,
  trafficIncidents: null,
  parks: null,
  trafficSignals: null,
  lrtStops: null,
  lrtLines: null,
  floodZones: null,
  majorRoads: null,
};

const geoJsonFormat = new GeoJSON();

/**
 * Load all data files (cached)
 */
/**
 * Load only communities (lightweight for search)
 */
export const loadCommunitiesOnly = async () => {
  if (dataCache.communities) {
    return dataCache.communities;
  }

  try {
    const communities = await loadGeoJSON('/data/community-borders.json');
    dataCache.communities = communities;
    return communities;
  } catch (error) {
    console.error('Error loading communities:', error);
    return null;
  }
};

/**
 * Load specific data file (lazy loading)
 */
const loadDataFile = async (filePath, cacheKey) => {
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  try {
    const data = await loadGeoJSON(filePath);
    dataCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error(`Error loading ${cacheKey}:`, error);
    return null;
  }
};

/**
 * Load all data files (cached) - only when needed for stats
 */
export const loadAllData = async (requiredFiles = []) => {
  try {
    // Always load communities first (needed for search)
    if (!dataCache.communities) {
      dataCache.communities = await loadGeoJSON('/data/community-borders.json');
    }

    // Load other files only if needed
    if (requiredFiles.includes('lrtStops') && !dataCache.lrtStops) {
      dataCache.lrtStops = await loadDataFile('/data/lrt-stops.json', 'lrtStops');
    }
    if (requiredFiles.includes('lrtLines') && !dataCache.lrtLines) {
      const lrtLinesData = await loadDataFile('/data/lrt-lines.json', 'lrtLines');
      dataCache.lrtLines = lrtLinesData;
    }
    if (requiredFiles.includes('parks') && !dataCache.parks) {
      dataCache.parks = await loadDataFile('/data/parks.json', 'parks');
    }
    if (requiredFiles.includes('trafficIncidents') && !dataCache.trafficIncidents) {
      dataCache.trafficIncidents = await loadDataFile('/data/traffic-incidents.json', 'trafficIncidents');
    }
    if (requiredFiles.includes('trafficSignals') && !dataCache.trafficSignals) {
      dataCache.trafficSignals = await loadDataFile('/data/traffic-signals.json', 'trafficSignals');
    }
    if (requiredFiles.includes('floodZones') && !dataCache.floodZones) {
      dataCache.floodZones = await loadDataFile('/data/flood-01-chance.json', 'floodZones');
    }
    if (requiredFiles.includes('majorRoads') && !dataCache.majorRoads) {
      dataCache.majorRoads = await loadDataFile('/data/major-roads.json', 'majorRoads');
    }

    return dataCache;
  } catch (error) {
    console.error('Error loading data for statistics:', error);
    return dataCache;
  }
};

/**
 * Check if a line intersects or passes through a community polygon
 */
const isLineInCommunity = (lineCoords, communityGeometry) => {
  if (!lineCoords || !communityGeometry) return false;
  
  try {
    // Convert community geometry to OpenLayers format
    const communityGeom = geoJsonFormat.readGeometry(communityGeometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });

    if (!communityGeom) return false;

    // Check if any point along the line is in the community
    // For performance, check first, middle, and last points
    const pointsToCheck = [];
    
    if (Array.isArray(lineCoords[0]) && typeof lineCoords[0][0] === 'number') {
      // LineString: array of [lon, lat] pairs
      if (lineCoords.length > 0) {
        pointsToCheck.push(lineCoords[0]);
        if (lineCoords.length > 2) {
          pointsToCheck.push(lineCoords[Math.floor(lineCoords.length / 2)]);
        }
        pointsToCheck.push(lineCoords[lineCoords.length - 1]);
      }
    } else if (Array.isArray(lineCoords[0]) && Array.isArray(lineCoords[0][0])) {
      // MultiLineString: array of arrays of [lon, lat] pairs
      lineCoords.forEach(lineString => {
        if (lineString && lineString.length > 0) {
          pointsToCheck.push(lineString[0]);
          if (lineString.length > 2) {
            pointsToCheck.push(lineString[Math.floor(lineString.length / 2)]);
          }
          pointsToCheck.push(lineString[lineString.length - 1]);
        }
      });
    }

    // Check if any point is in the community
    return pointsToCheck.some(point => {
      if (!point || point.length < 2) return false;
      const [lon, lat] = point;
      if (typeof lon !== 'number' || typeof lat !== 'number') return false;
      
      const pointCoord = fromLonLat([lon, lat]);
      
      if (communityGeom.getType() === 'Polygon') {
        return communityGeom.intersectsCoordinate(pointCoord);
      } else if (communityGeom.getType() === 'MultiPolygon') {
        const polygons = communityGeom.getPolygons();
        return polygons.some(poly => poly.intersectsCoordinate(pointCoord));
      }
      
      return false;
    });
  } catch (error) {
    // Fallback: check if first point is in community
    try {
      if (lineCoords && lineCoords.length > 0) {
        const firstPoint = Array.isArray(lineCoords[0]) && typeof lineCoords[0][0] === 'number'
          ? lineCoords[0]
          : (Array.isArray(lineCoords[0]) && Array.isArray(lineCoords[0][0]) ? lineCoords[0][0] : null);
        
        if (firstPoint && firstPoint.length >= 2) {
          return isPointInCommunity(firstPoint, communityGeometry);
        }
      }
    } catch (fallbackError) {
      return false;
    }
    return false;
  }
};

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
const calculateDistance = (point1, point2) => {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  if (typeof lon1 !== 'number' || typeof lat1 !== 'number' ||
      typeof lon2 !== 'number' || typeof lat2 !== 'number') {
    return Infinity;
  }
  
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get community centroid (center point) from geometry
 */
const getCommunityCentroid = (communityGeometry) => {
  if (!communityGeometry || !communityGeometry.coordinates) return null;
  
  try {
    // Convert to OpenLayers geometry to get extent/center
    const communityGeom = geoJsonFormat.readGeometry(communityGeometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
    
    if (communityGeom) {
      const extent = communityGeom.getExtent();
      const centerX = (extent[0] + extent[2]) / 2;
      const centerY = (extent[1] + extent[3]) / 2;
      
      // Convert back to lon/lat
      const [lon, lat] = toLonLat([centerX, centerY]);
      return [lon, lat];
    }
  } catch (error) {
    // Fallback: use first coordinate
    try {
      if (communityGeometry.type === 'Polygon' && communityGeometry.coordinates?.[0]?.[0]) {
        return communityGeometry.coordinates[0][0];
      } else if (communityGeometry.type === 'MultiPolygon' && communityGeometry.coordinates?.[0]?.[0]?.[0]) {
        return communityGeometry.coordinates[0][0][0];
      }
    } catch (e) {
      // Ignore
    }
  }
  
  return null;
};

/**
 * Check if a point is inside a community polygon using OpenLayers geometry
 */
const isPointInCommunity = (point, communityGeometry) => {
  if (!point || !communityGeometry) return false;
  
  try {
    const [lon, lat] = point;
    if (typeof lon !== 'number' || typeof lat !== 'number') return false;
    
    const pointCoord = fromLonLat([lon, lat]);
    
    // Convert community geometry to OpenLayers format
    const communityGeom = geoJsonFormat.readGeometry(communityGeometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });

    if (!communityGeom) return false;

    // For Polygon, check if point is inside
    if (communityGeom.getType() === 'Polygon') {
      return communityGeom.intersectsCoordinate(pointCoord);
    }
    // For MultiPolygon, check each polygon
    else if (communityGeom.getType() === 'MultiPolygon') {
      const polygons = communityGeom.getPolygons();
      return polygons.some(poly => poly.intersectsCoordinate(pointCoord));
    }

    return false;
  } catch (error) {
    // Fallback to simple coordinate check
    try {
      if (!communityGeometry || !communityGeometry.coordinates) return false;

      const [x, y] = point;
      let inside = false;

      const checkRing = (ring) => {
        if (!ring || ring.length < 3) return;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i] || [];
          const [xj, yj] = ring[j] || [];
          if (typeof xi !== 'number' || typeof yi !== 'number') continue;
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
      };

      if (communityGeometry.type === 'Polygon' && communityGeometry.coordinates?.[0]) {
        checkRing(communityGeometry.coordinates[0]);
      } else if (communityGeometry.type === 'MultiPolygon' && communityGeometry.coordinates?.[0]?.[0]) {
        communityGeometry.coordinates.forEach(poly => {
          if (poly?.[0]) checkRing(poly[0]);
        });
      }

      return inside;
    } catch (fallbackError) {
      // Silently fail - don't break the app
      return false;
    }
  }
};

/**
 * Calculate statistics for all communities
 */
export const calculateCommunityStats = async () => {
  try {
    const data = await loadAllData();
    
    if (!data || !data.communities || !data.communities.features) {
      console.warn('No community data available');
      return [];
    }

  // Initialize community stats
  const communityStats = data.communities.features.map(community => ({
    id: community.properties.id,
    name: community.properties.name || '',
    code: community.properties.comm_code || '',
    sector: community.properties.sector || '',
    crime: community.properties.crime_by_community_total_crime || 0,
    trafficIncidents: 0,
    parks: 0,
    trafficSignals: 0,
    lrtStops: 0,
    floodRisk: false,
    geometry: community.geometry,
  }));

  // Count traffic incidents per community (with chunking to prevent blocking)
  if (data.trafficIncidents && data.trafficIncidents.features) {
    const incidents = data.trafficIncidents.features;
    const chunkSize = 100; // Process 100 incidents at a time
    
    for (let i = 0; i < incidents.length; i += chunkSize) {
      const chunk = incidents.slice(i, i + chunkSize);
      
      // Yield to browser between chunks
      await new Promise(resolve => setTimeout(resolve, 0));
      
      chunk.forEach(incident => {
        const coords = incident.geometry?.coordinates; // [lon, lat]
        if (coords && coords.length >= 2) {
          communityStats.forEach(community => {
            // Find the original community feature to get full geometry
            const communityFeature = data.communities.features.find(c => c.properties.id === community.id);
            if (communityFeature && isPointInCommunity(coords, communityFeature.geometry)) {
              community.trafficIncidents++;
            }
          });
        }
      });
    }
  }

  // Count parks per community (with chunking)
  if (data.parks && data.parks.features) {
    const parks = data.parks.features;
    const chunkSize = 50; // Smaller chunks for parks (they're larger files)
    
    for (let i = 0; i < parks.length; i += chunkSize) {
      const chunk = parks.slice(i, i + chunkSize);
      
      // Yield to browser between chunks
      await new Promise(resolve => setTimeout(resolve, 0));
      
      chunk.forEach(park => {
        const coords = park.geometry?.coordinates;
        if (coords && coords.length >= 2) {
          // Handle different geometry types
          let points = [];
          if (park.geometry.type === 'Point') {
            points = [coords];
          } else if (park.geometry.type === 'Polygon' || park.geometry.type === 'MultiPolygon') {
            // Use centroid or first coordinate
            if (park.geometry.type === 'Polygon' && park.geometry.coordinates?.[0]) {
              points = [park.geometry.coordinates[0][0]]; // First point of outer ring
            }
          }

          points.forEach(point => {
            communityStats.forEach(community => {
              const communityFeature = data.communities.features.find(c => c.properties.id === community.id);
              if (communityFeature && isPointInCommunity(point, communityFeature.geometry)) {
                community.parks++;
              }
            });
          });
        }
      });
    }
  }

  // Count traffic signals per community (with chunking)
  if (data.trafficSignals && data.trafficSignals.features) {
    const signals = data.trafficSignals.features;
    const chunkSize = 200;
    
    for (let i = 0; i < signals.length; i += chunkSize) {
      const chunk = signals.slice(i, i + chunkSize);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      chunk.forEach(signal => {
        const coords = signal.geometry?.coordinates;
        if (coords && coords.length >= 2) {
          communityStats.forEach(community => {
            const communityFeature = data.communities.features.find(c => c.properties.id === community.id);
            if (communityFeature && isPointInCommunity(coords, communityFeature.geometry)) {
              community.trafficSignals++;
            }
          });
        }
      });
    }
  }

  // Count LRT stops per community (with chunking)
  if (data.lrtStops && data.lrtStops.features) {
    const stops = data.lrtStops.features;
    const chunkSize = 200;
    
    for (let i = 0; i < stops.length; i += chunkSize) {
      const chunk = stops.slice(i, i + chunkSize);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      chunk.forEach(stop => {
        const coords = stop.geometry?.coordinates;
        if (coords && coords.length >= 2) {
          communityStats.forEach(community => {
            const communityFeature = data.communities.features.find(c => c.properties.id === community.id);
            if (communityFeature && isPointInCommunity(coords, communityFeature.geometry)) {
              community.lrtStops++;
            }
          });
        }
      });
    }
  }

  // Check flood risk
  if (data.floodZones && data.floodZones.features) {
    data.floodZones.features.forEach(floodZone => {
      // Check if community overlaps with flood zone
      // Simplified: check if any community point is in flood zone
      if (floodZone.geometry && floodZone.geometry.coordinates) {
        communityStats.forEach(community => {
          // Simple check: if community has coordinates that overlap
          // This is a simplified check - could be enhanced
          if (community.geometry && community.geometry.coordinates) {
            // Check first coordinate point
            let testPoint = null;
            if (community.geometry.type === 'Polygon' && community.geometry.coordinates[0]) {
              testPoint = community.geometry.coordinates[0][0];
            } else if (community.geometry.type === 'MultiPolygon' && community.geometry.coordinates[0]) {
              testPoint = community.geometry.coordinates[0][0][0];
            }
            
            if (testPoint && isPointInCommunity(testPoint, { geometry: floodZone.geometry })) {
              community.floodRisk = true;
            }
          }
        });
      }
    });
  }

    return communityStats;
  } catch (error) {
    console.error('Error calculating community stats:', error);
    return [];
  }
};

/**
 * Calculate rankings for communities
 */
export const calculateRankings = (communityStats) => {
  const sorted = {
    trafficIncidents: [...communityStats].sort((a, b) => b.trafficIncidents - a.trafficIncidents),
    parks: [...communityStats].sort((a, b) => b.parks - a.parks),
    trafficSignals: [...communityStats].sort((a, b) => b.trafficSignals - a.trafficSignals),
    lrtStops: [...communityStats].sort((a, b) => b.lrtStops - a.lrtStops),
    crime: [...communityStats].sort((a, b) => b.crime - a.crime),
  };

  // Create ranking map
  const rankings = {};
  communityStats.forEach(community => {
    rankings[community.name] = {
      trafficIncidents: sorted.trafficIncidents.findIndex(c => c.name === community.name) + 1,
      parks: sorted.parks.findIndex(c => c.name === community.name) + 1,
      trafficSignals: sorted.trafficSignals.findIndex(c => c.name === community.name) + 1,
      lrtStops: sorted.lrtStops.findIndex(c => c.name === community.name) + 1,
      crime: sorted.crime.findIndex(c => c.name === community.name) + 1,
    };
  });

  return rankings;
};

/**
 * Calculate layer-specific stats for a community (lightweight, on-demand)
 */
const calculateLayerSpecificStats = async (communityFeature, activeLayer) => {
  const stats = {
    lrtStops: 0,
    lrtLines: 0,
    parks: 0,
    trafficIncidents: 0,
    trafficSignals: 0,
    floodRisk: false,
    majorRoads: 0,
  };

  try {
    // Determine which files we need based on activeLayer
    const requiredFiles = [];
    if (activeLayer === 'lrt' || activeLayer === 'lrt_lines' || activeLayer === 'lrt_stops') {
      requiredFiles.push('lrtStops', 'lrtLines');
    } else if (activeLayer === 'parks') {
      requiredFiles.push('parks');
    } else if (activeLayer === 'traffic' || activeLayer === 'traffic_incidents') {
      requiredFiles.push('trafficIncidents', 'trafficSignals');
    } else if (activeLayer === 'traffic_signals') {
      requiredFiles.push('trafficSignals');
    } else if (activeLayer === 'flood_01_chance' || activeLayer === 'flood') {
      requiredFiles.push('floodZones');
    } else if (activeLayer === 'major_roads') {
      requiredFiles.push('majorRoads');
    }

    const data = await loadAllData(requiredFiles);
    
    // LRT-specific stats
    if (activeLayer === 'lrt' || activeLayer === 'lrt_lines' || activeLayer === 'lrt_stops') {
      // Count LRT stops in this community
      if (data.lrtStops && data.lrtStops.features) {
        const stopsInCommunity = data.lrtStops.features.filter(stop => {
          const coords = stop.geometry?.coordinates;
          return coords && isPointInCommunity(coords, communityFeature.geometry);
        });
        stats.lrtStops = stopsInCommunity.length;
      }

      // Count LRT lines passing through (check multiple points along the line)
      if (data.lrtLines && data.lrtLines.features) {
        const linesInCommunity = data.lrtLines.features.filter(line => {
          // Check if any coordinate of the line is in the community
          if (line.geometry?.coordinates) {
            const coords = line.geometry.coordinates;
            // For LineString, check multiple points along the line
            if (Array.isArray(coords[0]) && coords[0].length >= 2) {
              // Check first, middle, and last points
              const pointsToCheck = [
                coords[0],
                coords[Math.floor(coords.length / 2)],
                coords[coords.length - 1]
              ];
              return pointsToCheck.some(point => 
                point && point.length >= 2 && isPointInCommunity(point, communityFeature.geometry)
              );
            }
          }
          return false;
        });
        stats.lrtLines = linesInCommunity.length;
      }
    }

    // Parks stats - only count parks that are actually inside the community boundary
    if (activeLayer === 'parks') {
      if (data.parks && data.parks.features) {
        const parksInCommunity = data.parks.features.filter(park => {
          const coords = park.geometry?.coordinates;
          if (!coords) return false;
          
          // For Point parks, check if the point is inside the community
          if (park.geometry.type === 'Point') {
            return isPointInCommunity(coords, communityFeature.geometry);
          }
          
          // For Polygon parks, check if any significant part of the park is inside the community
          // We'll check multiple points along the polygon boundary
          if (park.geometry.type === 'Polygon' && park.geometry.coordinates?.[0]) {
            const ring = park.geometry.coordinates[0];
            if (ring && ring.length > 0) {
              // Check several points: first, middle, last, and centroid
              const pointsToCheck = [
                ring[0],
                ring[Math.floor(ring.length / 2)],
                ring[ring.length - 1]
              ];
              
              // Also calculate centroid
              let sumLon = 0, sumLat = 0, count = 0;
              ring.forEach(coord => {
                if (coord && coord.length >= 2) {
                  sumLon += coord[0];
                  sumLat += coord[1];
                  count++;
                }
              });
              if (count > 0) {
                pointsToCheck.push([sumLon / count, sumLat / count]);
              }
              
              // Park is considered "in community" if at least one point is inside
              return pointsToCheck.some(point => 
                point && point.length >= 2 && isPointInCommunity(point, communityFeature.geometry)
              );
            }
          }
          
          // For MultiPolygon, check first polygon
          if (park.geometry.type === 'MultiPolygon' && park.geometry.coordinates?.[0]?.[0]?.[0]) {
            const firstPoint = park.geometry.coordinates[0][0][0];
            return isPointInCommunity(firstPoint, communityFeature.geometry);
          }
          
          return false;
        });
        
        stats.parks = parksInCommunity.length;
      }
    }

    // Traffic incidents and signals stats (combined for traffic layer)
    if (activeLayer === 'traffic' || activeLayer === 'traffic_incidents') {
      if (data.trafficIncidents && data.trafficIncidents.features) {
        const incidentsInCommunity = data.trafficIncidents.features.filter(incident => {
          const coords = incident.geometry?.coordinates;
          return coords && isPointInCommunity(coords, communityFeature.geometry);
        });
        stats.trafficIncidents = incidentsInCommunity.length;
      }
    }

    // Traffic signals stats (also for combined traffic layer)
    if (activeLayer === 'traffic' || activeLayer === 'traffic_signals') {
      if (data.trafficSignals && data.trafficSignals.features) {
        const signalsInCommunity = data.trafficSignals.features.filter(signal => {
          const coords = signal.geometry?.coordinates;
          return coords && isPointInCommunity(coords, communityFeature.geometry);
        });
        stats.trafficSignals = signalsInCommunity.length;
      }
    }

    // Flood risk - check if community overlaps with flood zones that have flow_rate
    if (activeLayer === 'flood_01_chance' || activeLayer === 'flood') {
      if (data.floodZones && data.floodZones.features) {
        const communityGeom = communityFeature.geometry;
        if (communityGeom && communityGeom.coordinates) {
          // Filter flood zones that have flow_rate (these are the ones at risk)
          const riskFloodZones = data.floodZones.features.filter(floodZone => {
            const props = floodZone.properties || {};
            // Any flood zone with a flow_rate > 0 is considered at risk
            return props.flow_rate !== null && props.flow_rate !== undefined && props.flow_rate > 0;
          });
          
          if (riskFloodZones.length === 0) {
            stats.floodRisk = false;
          } else {
            // Use OpenLayers to check if community geometry intersects with flood zones
            try {
              // Convert community geometry to OpenLayers format
              const communityOlGeom = geoJsonFormat.readGeometry(communityGeom, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
              });
              
              if (communityOlGeom) {
                // Check if any flood zone intersects with the community
                stats.floodRisk = riskFloodZones.some(floodZone => {
                  if (!floodZone.geometry) return false;
                  
                  try {
                    // Convert flood zone geometry to OpenLayers format
                    const floodOlGeom = geoJsonFormat.readGeometry(floodZone.geometry, {
                      dataProjection: 'EPSG:4326',
                      featureProjection: 'EPSG:3857',
                    });
                    
                    if (!floodOlGeom) return false;
                    
                    // Check if extents overlap (quick check)
                    const communityExtent = communityOlGeom.getExtent();
                    const floodExtent = floodOlGeom.getExtent();
                    
                    // Check if extents intersect
                    const extentsOverlap = !(
                      communityExtent[2] < floodExtent[0] || // community is to the left
                      communityExtent[0] > floodExtent[2] || // community is to the right
                      communityExtent[3] < floodExtent[1] || // community is below
                      communityExtent[1] > floodExtent[3]    // community is above
                    );
                    
                    if (!extentsOverlap) return false;
                    
                    // If extents overlap, check multiple points in community
                    // Sample points from community boundary and centroid
                    let testPoints = [];
                    
                    if (communityGeom.type === 'Polygon' && communityGeom.coordinates[0]) {
                      const ring = communityGeom.coordinates[0];
                      // Sample more points (every 5th point for better coverage)
                      const step = Math.max(1, Math.floor(ring.length / 5));
                      for (let i = 0; i < ring.length; i += step) {
                        testPoints.push(ring[i]);
                      }
                      // Always include last point
                      if (ring.length > 1 && testPoints[testPoints.length - 1] !== ring[ring.length - 1]) {
                        testPoints.push(ring[ring.length - 1]);
                      }
                    }
                    
                    // Add centroid
                    const centroid = getCommunityCentroid(communityGeom);
                    if (centroid) {
                      testPoints.push(centroid);
                    }
                    
                    // Check if any point is inside the flood zone
                    return testPoints.some(point => {
                      if (!point || point.length < 2) return false;
                      return isPointInCommunity(point, floodZone.geometry);
                    });
                  } catch (error) {
                    console.warn('Error checking flood zone intersection:', error);
                    // Fallback: check centroid
                    const centroid = getCommunityCentroid(communityGeom);
                    if (centroid && floodZone.geometry) {
                      return isPointInCommunity(centroid, floodZone.geometry);
                    }
                    return false;
                  }
                });
              } else {
                // Fallback: use point-based checking
                const centroid = getCommunityCentroid(communityGeom);
                if (centroid) {
                  stats.floodRisk = riskFloodZones.some(floodZone => {
                    if (!floodZone.geometry) return false;
                    return isPointInCommunity(centroid, floodZone.geometry);
                  });
                } else {
                  stats.floodRisk = false;
                }
              }
            } catch (error) {
              console.warn('Error checking flood risk with OpenLayers:', error);
              // Fallback: check if community centroid is in any flood zone
              const centroid = getCommunityCentroid(communityGeom);
              if (centroid) {
                stats.floodRisk = riskFloodZones.some(floodZone => {
                  if (!floodZone.geometry) return false;
                  return isPointInCommunity(centroid, floodZone.geometry);
                });
              } else {
                stats.floodRisk = false;
              }
            }
          }
        }
      }
    }

    // Major roads access
    if (activeLayer === 'major_roads') {
      if (data.majorRoads && data.majorRoads.features) {
        const roadsInCommunity = data.majorRoads.features.filter(road => {
          const coords = road.geometry?.coordinates;
          if (!coords) return false;
          
          // Check if the road line passes through the community
          return isLineInCommunity(coords, communityFeature.geometry);
        });
        stats.majorRoads = roadsInCommunity.length;
      }
    }
  } catch (error) {
    console.warn('Error calculating layer-specific stats:', error);
  }

  return stats;
};

/**
 * Search communities by name with layer-specific stats
 */
export const searchCommunities = async (searchTerm, activeLayer = null) => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  try {
    // Only load communities - lightweight and fast
    const communities = await loadCommunitiesOnly();
    
    if (!communities || !communities.features) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    const filtered = communities.features
      .filter(community => {
        const name = (community.properties?.name || '').toLowerCase();
        const code = (community.properties?.comm_code || '').toLowerCase();
        return name.includes(term) || code.includes(term);
      })
      .slice(0, 10); // Limit to 10 results

    // Calculate layer-specific stats for each community
    const results = await Promise.all(
      filtered.map(async (community) => {
        const baseData = {
          id: community.properties.id,
          name: community.properties.name || '',
          code: community.properties.comm_code || '',
          sector: community.properties.sector || '',
          crime: community.properties.crime_by_community_total_crime || 0,
          geometry: community.geometry,
        };

        // Calculate layer-specific stats if activeLayer is provided
        if (activeLayer) {
          const layerStats = await calculateLayerSpecificStats(community, activeLayer);
          return {
            ...baseData,
            ...layerStats,
            rankings: {}, // Can be calculated later if needed
          };
        }

        return {
          ...baseData,
          trafficIncidents: 0,
          parks: 0,
          trafficSignals: 0,
          lrtStops: 0,
          lrtLines: 0,
          floodRisk: false,
          majorRoads: 0,
          rankings: {},
        };
      })
    );

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

/**
 * Get community statistics by name
 */
export const getCommunityStats = async (communityName) => {
  const stats = await calculateCommunityStats();
  const rankings = calculateRankings(stats);
  
  const community = stats.find(c => 
    c.name.toLowerCase() === communityName.toLowerCase()
  );

  if (!community) return null;

  return {
    ...community,
    rankings: rankings[community.name] || {},
  };
};

