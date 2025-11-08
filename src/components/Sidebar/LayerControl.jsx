import React from 'react';

const LayerControl = ({ layers, activeLayer, onLayerChange }) => {
  return (
    <div className="space-y-2">
      {layers.map(layer => {
        const Icon = layer.icon;
        const isActive = activeLayer === layer.id;
        
        return (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            className={`w-full p-4 rounded-xl transition-all ${
              isActive 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg scale-105' 
                : 'bg-gray-700 hover:bg-gray-650'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${layer.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">{layer.name}</div>
                <div className="text-xs text-gray-400">{layer.description}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LayerControl;