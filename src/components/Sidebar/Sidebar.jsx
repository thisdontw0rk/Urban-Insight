import React, { useState, useEffect } from 'react';
import { Layers, Info, TrendingUp } from 'lucide-react';
import LayerControl from './LayerControl';
import { calculateLayerMetric } from '../../utils/layerMetrics';

const Sidebar = ({ 
  sidebarOpen, 
  layers, 
  activeLayer, 
  onLayerChange, 
  stats 
}) => {
  const [layerMetric, setLayerMetric] = useState(null);
  const [isLoadingMetric, setIsLoadingMetric] = useState(false);

  // Calculate key metric for active layer
  useEffect(() => {
    const loadMetric = async () => {
      setIsLoadingMetric(true);
      const metric = await calculateLayerMetric(activeLayer);
      setLayerMetric(metric);
      setIsLoadingMetric(false);
    };

    if (activeLayer) {
      loadMetric();
    }
  }, [activeLayer]);

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

        {/* Key Metric for Active Layer */}
        {layerMetric && (
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-white" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                {layers.find(l => l.id === activeLayer)?.name || 'Layer'} Metric
              </h3>
            </div>
            {isLoadingMetric ? (
              <div className="flex items-center gap-2 text-white">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="text-sm">Calculating...</span>
              </div>
            ) : (
              <div>
                <div className={`text-4xl font-bold text-white mb-1`}>
                  {layerMetric.value}{layerMetric.unit}
                </div>
                <div className="text-sm text-blue-100">{layerMetric.label}</div>
              </div>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4">
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
      </div>
    </aside>
  );
};

export default Sidebar;