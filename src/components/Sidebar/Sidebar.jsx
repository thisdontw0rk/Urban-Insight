import React from 'react';
import { Layers, Info } from 'lucide-react';
import LayerControl from './LayerControl';
import NeighborhoodList from './NeighborhoodList';

const Sidebar = ({ 
  sidebarOpen, 
  layers, 
  activeLayer, 
  onLayerChange, 
  neighborhoods, 
  onNeighborhoodClick,
  stats 
}) => {
  return (
    <aside className={`${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 fixed lg:relative z-10 w-80 bg-gray-800 shadow-2xl transition-transform duration-300 h-full overflow-y-auto`}>
      <div className="p-6 space-y-6">
        {/* Layer Controls */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold">Map Layers</h2>
          </div>
          <LayerControl 
            layers={layers}
            activeLayer={activeLayer}
            onLayerChange={onLayerChange}
          />
        </div>

        {/* Stats Overview */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-750 rounded-xl p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Info size={18} className="text-blue-400" />
            City Overview
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-3">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Neighborhoods */}
        <NeighborhoodList 
          neighborhoods={neighborhoods}
          onNeighborhoodClick={onNeighborhoodClick}
        />
      </div>
    </aside>
  );
};

export default Sidebar;