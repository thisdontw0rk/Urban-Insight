import { useState } from 'react';
import Header from './components/Header/Header.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import MapContainer from './components/Map/MapContainer.jsx';
import Legend from './components/Map/Legend.jsx';
import { Droplets, Accessibility, Shield, Leaf } from 'lucide-react';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState('flood');

  const layers = [
    {
      id: 'flood',
      name: 'Flood Risk',
      description: 'Areas vulnerable to flooding',
      icon: Droplets,
      color: 'bg-blue-500/20 text-blue-400'
    },
    {
      id: 'accessibility',
      name: 'Accessibility',
      description: 'Wheelchair accessibility coverage',
      icon: Accessibility,
      color: 'bg-green-500/20 text-green-400'
    },
    {
      id: 'safety',
      name: 'Safety Index',
      description: 'Crime and safety metrics',
      icon: Shield,
      color: 'bg-purple-500/20 text-purple-400'
    },
    {
      id: 'sustainability',
      name: 'Sustainability',
      description: 'Green infrastructure & resilience',
      icon: Leaf,
      color: 'bg-emerald-500/20 text-emerald-400'
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

  const activeLayerName = layers.find(l => l.id === activeLayer)?.name || 'Flood Risk';

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
  };

  const handleNeighborhoodClick = (neighborhood) => {
    console.log('Selected neighborhood:', neighborhood);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
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
        <main className="flex-1 relative">
          <MapContainer activeLayer={activeLayer} />
          <Legend activeLayerName={activeLayerName} />
        </main>
      </div>
    </div>
  );
}

export default App;
