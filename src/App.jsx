import { useState } from 'react';
import Header from './components/Header/Header.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import MapContainerOL from './components/Map/MapContainerOL.jsx';
import Legend from './components/Map/Legend.jsx';
import { fromLonLat } from 'ol/proj';
import { Droplets, Shield, Route, Train, TreePine, AlertCircle, Circle, Map, Wind } from 'lucide-react';

function App() {
  console.log('App: Component rendering');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState('community_borders');
  const [mapInstance, setMapInstance] = useState(null);

  const layers = [
    {
      id: 'community_borders',
      name: 'Community Borders',
      description: 'Calgary community boundaries',
      icon: Map,
      color: 'bg-gray-500/20 text-gray-400'
    },
    {
      id: 'major_roads',
      name: 'Major Roads',
      description: 'Major road network',
      icon: Route,
      color: 'bg-blue-500/20 text-blue-400'
    },
    {
      id: 'lrt',
      name: 'LRT System',
      description: 'Light Rail Transit lines and stations',
      icon: Train,
      color: 'bg-red-500/20 text-red-400'
    },
    {
      id: 'parks',
      name: 'Parks',
      description: 'Parks and green spaces',
      icon: TreePine,
      color: 'bg-green-500/20 text-green-400'
    },
    {
      id: 'traffic',
      name: 'Traffic',
      description: 'Traffic incidents and signals',
      icon: AlertCircle,
      color: 'bg-orange-500/20 text-orange-400'
    },
    {
      id: 'flood',
      name: 'Flood Risk',
      description: 'Areas vulnerable to flooding',
      icon: Droplets,
      color: 'bg-blue-500/20 text-blue-400'
    },
    {
      id: 'safety',
      name: 'Safety Index',
      description: 'Crime and safety metrics',
      icon: Shield,
      color: 'bg-purple-500/20 text-purple-400'
    },
    {
      id: 'no2_vancouver',
      name: 'Vancouver NO2 Emission',
      description: 'Satellite-based nitrogen dioxide visualization',
      icon: Wind,
      color: 'bg-yellow-500/20 text-yellow-400'
    }
  ];

  const neighborhoods = [
    {
      id: 1,
      name: 'Downtown',
      risk: 'High',
      accessibility: 45,
      population: 12500
    },
    {
      id: 2,
      name: 'Beltline',
      risk: 'Medium',
      accessibility: 62,
      population: 18200
    },
    {
      id: 3,
      name: 'Inglewood',
      risk: 'High',
      accessibility: 38,
      population: 3400
    },
    {
      id: 4,
      name: 'Kensington',
      risk: 'Low',
      accessibility: 78,
      population: 5200
    },
    {
      id: 5,
      name: 'Mission',
      risk: 'Medium',
      accessibility: 55,
      population: 2800
    }
  ];

  const stats = [
    { value: '23%', label: 'High Risk Areas', color: 'text-red-400' },
    { value: '67%', label: 'Accessibility Coverage', color: 'text-green-400' },
    { value: '142', label: 'Neighborhoods', color: 'text-blue-400' },
    { value: '1.3M', label: 'Population', color: 'text-purple-400' }
  ];

  const activeLayerName = layers.find(l => l.id === activeLayer)?.name || 'Community Borders';

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
  };

  const handleNeighborhoodClick = (neighborhood) => {
    console.log('Selected neighborhood:', neighborhood);
  };

  const handleMapReady = (map) => {
    setMapInstance(map);
  };

  const handleCommunitySelect = async (community) => {
    if (!mapInstance || !community.geometry) return;

    try {
      // Don't switch layers - keep the current active layer
      // setActiveLayer('community_borders'); // Removed - keep current layer

      // Calculate bounds from geometry
      const geometry = community.geometry;
      let coordinates = [];

      if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates[0]; // Outer ring
      } else if (geometry.type === 'MultiPolygon') {
        // Get coordinates from first polygon
        coordinates = geometry.coordinates[0][0];
      }

      if (coordinates.length > 0) {
        // Convert coordinates to OpenLayers format
        const extent = coordinates.reduce((ext, coord) => {
          const [lon, lat] = coord;
          const point = fromLonLat([lon, lat]);
          return [
            Math.min(ext[0], point[0]),
            Math.min(ext[1], point[1]),
            Math.max(ext[2], point[0]),
            Math.max(ext[3], point[1]),
          ];
        }, [Infinity, Infinity, -Infinity, -Infinity]);

        // Zoom to community bounds
        mapInstance.getView().fit(extent, {
          padding: [100, 100, 100, 100],
          maxZoom: 14,
          duration: 1000,
        });
      }
    } catch (error) {
      console.error('Error zooming to community:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onCommunitySelect={handleCommunitySelect}
        mapInstance={mapInstance}
        activeLayer={activeLayer}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          layers={layers}
          activeLayer={activeLayer}
          onLayerChange={handleLayerChange}
          neighborhoods={neighborhoods}
          onNeighborhoodClick={handleNeighborhoodClick}
          stats={stats}
        />
        <main className="flex-1 relative" style={{ minHeight: 0 }}>
          {activeLayer === 'no2_vancouver' ? (
            <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">Vancouver NO₂ Concentration (Sentinel-5P)</h2>
                <p className="text-gray-400 max-w-2xl">
                  Interactive satellite-based nitrogen dioxide visualization from the European Sentinel-5P mission.
                </p>
              </div>
              <iframe
                src="https://river-psyche-477705-m4.projects.earthengine.app/view/vancouverno2"
                style={{
                  width: '90%',
                  height: '80vh',
                  border: 0,
                  borderRadius: '10px',
                  boxShadow: '0 0 15px rgba(0,0,0,0.15)'
                }}
                allowFullScreen
                loading="lazy"
                title="Vancouver NO2 Concentration Map"
              />
            </div>
          ) : (
            <>
              <MapContainerOL activeLayer={activeLayer} onMapReady={handleMapReady} />
              <Legend activeLayerName={activeLayerName} activeLayer={activeLayer} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
