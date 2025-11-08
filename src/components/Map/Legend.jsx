import React from 'react';

const Legend = ({ activeLayerName }) => {
  return (
    <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl shadow-2xl max-w-xs">
      <h4 className="font-bold mb-2 text-sm">Legend - {activeLayerName}</h4>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>High Risk / Low Coverage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Medium Risk / Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Low Risk / High Coverage</span>
        </div>
      </div>
    </div>
  );
};

export default Legend;