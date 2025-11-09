import React from 'react';
import { AlertTriangle } from 'lucide-react';

const NeighborhoodList = ({ neighborhoods, onNeighborhoodClick }) => {
  return (
    <div>
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <AlertTriangle size={18} className="text-yellow-400" />
        Priority Areas
      </h3>
      <div className="space-y-2">
        {neighborhoods.map((neighborhood, idx) => (
          <button
            key={idx}
            onClick={() => onNeighborhoodClick(neighborhood)}
            className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors text-left"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold">{neighborhood.name}</div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                neighborhood.risk === 'High' ? 'bg-red-500/20 text-red-400' :
                neighborhood.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {neighborhood.risk} Risk
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Access: {neighborhood.accessibility}%</span>
              <span>Pop: {neighborhood.population.toLocaleString()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NeighborhoodList;