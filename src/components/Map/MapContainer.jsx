import React from 'react';
import { MapPin } from 'lucide-react';

const MapContainer = ({ activeLayer }) => {
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900">
      {/* Map placeholder - Leaflet will go here later */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl">
          <MapPin size={64} className="text-blue-400 mx-auto animate-pulse" />
          <div>
            <h3 className="text-xl font-bold mb-2">Interactive Map Area</h3>
            <p className="text-gray-400 text-sm">Map visualization will render here</p>
            <p className="text-gray-500 text-xs mt-2">Active Layer: {activeLayer}</p>
          </div>
        </div>
      </div>

      {/* Simulated layer effects */}
      {activeLayer === 'flood' && (
        <>
          <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '300ms' }} />
        </>
      )}
      {activeLayer === 'accessibility' && (
        <>
          <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-36 h-36 bg-green-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }} />
        </>
      )}
      {activeLayer === 'safety' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      )}
      {activeLayer === 'sustainability' && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 animate-pulse" style={{ animationDelay: '200ms' }} />
      )}
    </div>
  );
};

export default MapContainer;