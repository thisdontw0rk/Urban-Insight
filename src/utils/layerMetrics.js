import { loadGeoJSON } from './loadGeoJSON';

/**
 * Calculate key metric for a specific layer
 */
export const calculateLayerMetric = async (activeLayer) => {
  try {
    switch (activeLayer) {
      case 'lrt':
      case 'lrt_lines':
      case 'lrt_stops': {
        const [linesData, stopsData] = await Promise.all([
          loadGeoJSON('/data/lrt-lines.json'),
          loadGeoJSON('/data/lrt-stops.json')
        ]);
        
        const stopsCount = stopsData?.features?.length || 0;
        const linesCount = linesData?.features?.length || 0;
        const avgTransitScore = stopsCount > 0 || linesCount > 0 
          ? ((stopsCount * 3 + linesCount * 1) / 4).toFixed(1)
          : '0.0';
        
        return {
          value: avgTransitScore,
          label: 'Average Transit Score',
          unit: '',
          color: 'text-red-400'
        };
      }

      case 'traffic': {
        const [incidentsData, signalsData] = await Promise.all([
          loadGeoJSON('/data/traffic-incidents.json'),
          loadGeoJSON('/data/traffic-signals.json')
        ]);
        
        const incidentsCount = incidentsData?.features?.length || 0;
        const signalsCount = signalsData?.features?.length || 0;
        const totalTraffic = incidentsCount + signalsCount;
        
        return {
          value: totalTraffic.toLocaleString(),
          label: 'Total Traffic Points',
          unit: '',
          color: 'text-orange-400'
        };
      }

      case 'parks': {
        const parksData = await loadGeoJSON('/data/parks.json');
        const parksCount = parksData?.features?.length || 0;
        
        if (parksCount === 0) {
          return {
            value: '0',
            label: 'Total Parks',
            unit: '',
            color: 'text-green-400'
          };
        }
        
        return {
          value: parksCount.toLocaleString(),
          label: 'Total Parks',
          unit: '',
          color: 'text-green-400'
        };
      }

      case 'major_roads': {
        const roadsData = await loadGeoJSON('/data/major-roads.json');
        const roadsCount = roadsData?.features?.length || 0;
        
        // Calculate average road length by summing all segments
        if (roadsCount > 0) {
          // Helper function to calculate distance between two points
          const haversineDistance = (lon1, lat1, lon2, lat2) => {
            const R = 6371; // Earth radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          };
          
          // Calculate length for a single feature
          const calculateFeatureLength = (feature) => {
            const coords = feature.geometry?.coordinates;
            if (!coords || !Array.isArray(coords)) return 0;
            
            // Handle LineString (single array of coordinates)
            if (coords[0] && Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
              let length = 0;
              for (let i = 0; i < coords.length - 1; i++) {
                const [lon1, lat1] = coords[i];
                const [lon2, lat2] = coords[i + 1];
                if (typeof lon1 === 'number' && typeof lat1 === 'number' &&
                    typeof lon2 === 'number' && typeof lat2 === 'number') {
                  length += haversineDistance(lon1, lat1, lon2, lat2);
                }
              }
              return length;
            }
            
            // Handle MultiLineString (array of arrays of coordinates)
            if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
              let totalLength = 0;
              coords.forEach(lineString => {
                if (Array.isArray(lineString) && lineString.length > 1) {
                  for (let i = 0; i < lineString.length - 1; i++) {
                    const [lon1, lat1] = lineString[i];
                    const [lon2, lat2] = lineString[i + 1];
                    if (typeof lon1 === 'number' && typeof lat1 === 'number' &&
                        typeof lon2 === 'number' && typeof lat2 === 'number') {
                      totalLength += haversineDistance(lon1, lat1, lon2, lat2);
                    }
                  }
                }
              });
              return totalLength;
            }
            
            return 0;
          };
          
          // Sample up to 200 features for performance
          const sampleSize = Math.min(200, roadsCount);
          const sample = roadsData.features.slice(0, sampleSize);
          let totalLength = 0;
          let validFeatures = 0;
          
          sample.forEach(feature => {
            const length = calculateFeatureLength(feature);
            if (length > 0) {
              totalLength += length;
              validFeatures++;
            }
          });
          
          const avgLength = validFeatures > 0 ? (totalLength / validFeatures).toFixed(1) : '0.0';
          
          return {
            value: avgLength,
            label: 'Average Road Length',
            unit: ' km',
            color: 'text-blue-400'
          };
        }
        
        return {
          value: '0.0',
          label: 'Average Road Length',
          unit: ' km',
          color: 'text-blue-400'
        };
      }

      case 'community_borders': {
        const communitiesData = await loadGeoJSON('/data/community-borders.json');
        const communitiesCount = communitiesData?.features?.length || 0;
        
        return {
          value: communitiesCount.toLocaleString(),
          label: 'Communities',
          unit: '',
          color: 'text-gray-400'
        };
      }

      case 'flood': {
        const floodData = await loadGeoJSON('/data/flood-01-chance.json');
        const floodZonesCount = floodData?.features?.length || 0;
        
        if (floodZonesCount === 0) {
          return {
            value: '0',
            label: 'Flood Risk Coverage',
            unit: '%',
            color: 'text-cyan-400'
          };
        }
        
        // Calculate percentage of area at risk
        // Get total communities for reference
        const communitiesData = await loadGeoJSON('/data/community-borders.json');
        const communitiesCount = communitiesData?.features?.length || 0;
        
        // Calculate approximate percentage based on zone count vs communities
        // This is a simplified calculation - ideally we'd calculate actual area
        let riskPercentage = '0.0';
        if (communitiesCount > 0) {
          // Estimate: each flood zone affects roughly 1-2 communities on average
          // More accurate would be to calculate actual overlapping area
          const estimatedAffectedCommunities = Math.min(floodZonesCount * 1.5, communitiesCount);
          riskPercentage = ((estimatedAffectedCommunities / communitiesCount) * 100).toFixed(1);
        }
        
        return {
          value: riskPercentage,
          label: 'Flood Risk Coverage',
          unit: '%',
          color: 'text-cyan-400'
        };
      }

      case 'safety': {
        // Calculate total violent crimes across all communities
        const communitiesData = await loadGeoJSON('/data/community-borders.json');
        if (communitiesData?.features) {
          const totalCrime = communitiesData.features.reduce((sum, feature) => {
            return sum + (feature.properties?.crime_by_community_total_crime || 0);
          }, 0);
          
          return {
            value: totalCrime.toLocaleString(),
            label: 'Violent Crimes Reported',
            unit: '',
            color: 'text-purple-400'
          };
        }
        return null;
      }

      case 'no2_vancouver': {
        return {
          value: 'Satellite',
          label: 'NO₂ Visualization',
          unit: '',
          color: 'text-yellow-400'
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error calculating layer metric:', error);
    return null;
  }
};

