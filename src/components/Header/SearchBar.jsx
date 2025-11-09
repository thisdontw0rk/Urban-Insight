import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, TrendingUp, AlertCircle, TreePine, Circle, Train, Map } from 'lucide-react';
import { searchCommunities } from '../../utils/communityStats';

// Calculate transit score based on LRT stops and lines
const calculateTransitScore = (stops, lines) => {
  // Weight stops more heavily (stops are more valuable for accessibility)
  // Score formula: (stops * 3 + lines * 1) / 4
  // This gives a score from 0 to potentially high, but normalized
  const score = (stops * 3 + lines * 1) / 4;
  return score;
};

const SearchBar = ({ onCommunitySelect, mapInstance, activeLayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Safety check - don't break if searchCommunities fails
  if (typeof searchCommunities !== 'function') {
    console.warn('searchCommunities function not available');
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      try {
        if (typeof searchCommunities === 'function') {
          // Use requestIdleCallback to perform search when browser is idle
          const searchIdle = (deadline) => {
            const searchPromise = searchCommunities(searchTerm, activeLayer);
            
            searchPromise.then(searchResults => {
              setResults(searchResults || []);
              setIsLoading(false);
            }).catch(error => {
              console.error('Search error:', error);
              setResults([]);
              setIsLoading(false);
            });
          };

          // Use requestIdleCallback if available, otherwise setTimeout
          if (window.requestIdleCallback) {
            window.requestIdleCallback(searchIdle, { timeout: 1000 });
          } else {
            setTimeout(() => {
              searchCommunities(searchTerm, activeLayer).then(searchResults => {
                setResults(searchResults || []);
                setIsLoading(false);
              }).catch(error => {
                console.error('Search error:', error);
                setResults([]);
                setIsLoading(false);
              });
            }, 0);
          }
        } else {
          setResults([]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setIsLoading(false);
      }
    };

    // Shorter debounce for faster response
    const debounceTimer = setTimeout(performSearch, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, activeLayer]);

  const handleSelect = (community) => {
    setSearchTerm(community.name);
    setIsOpen(false);
    if (onCommunitySelect) {
      onCommunitySelect(community);
    }
  };

  const formatRank = (rank) => {
    if (!rank) return 'N/A';
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
    return `${rank}${suffix}`;
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="hidden md:flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 gap-2">
        <Search size={18} className="text-white" />
        <input
          type="text"
          placeholder="Search communities (e.g., Panorama Hills)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          className="bg-transparent border-none outline-none text-white placeholder-blue-200 w-80"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setIsOpen(false);
            }}
            className="text-white/70 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div
          ref={resultsRef}
          className="absolute top-full right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p>No communities found</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((community) => (
                <button
                  key={community.id}
                  onClick={() => handleSelect(community)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1">{community.name}</div>
                      <div className="text-xs text-gray-400 mb-2">{community.sector}</div>
                      
                      {/* Statistics - Show layer-specific data */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {/* LRT Stats */}
                        {(activeLayer === 'lrt' || activeLayer === 'lrt_lines' || activeLayer === 'lrt_stops') && (
                          <>
                            {community.lrtStops > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Train size={12} className="text-red-400" />
                                <span className="text-gray-300">
                                  {community.lrtStops} LRT {community.lrtStops === 1 ? 'stop' : 'stops'}
                                </span>
                              </div>
                            )}
                            {community.lrtLines > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Train size={12} className="text-red-400" />
                                <span className="text-gray-300">
                                  {community.lrtLines} LRT {community.lrtLines === 1 ? 'line' : 'lines'}
                                </span>
                              </div>
                            )}
                            {/* Always show Transit Score when on LRT layer */}
                            <div className="flex items-center gap-1 text-xs col-span-2 mt-1">
                              <span className="text-blue-400 font-semibold">
                                Transit Score: {calculateTransitScore(community.lrtStops || 0, community.lrtLines || 0).toFixed(1)}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Parks Stats */}
                        {activeLayer === 'parks' && community.parks !== undefined && (
                          <div className="flex items-center gap-1 text-xs col-span-2">
                            <TreePine size={12} className="text-green-400" />
                            <span className="text-gray-300">
                              Walkable to {community.parks} {community.parks === 1 ? 'park' : 'parks'}
                            </span>
                          </div>
                        )}

                        {/* Traffic Stats (combined incidents and signals) */}
                        {(activeLayer === 'traffic' || activeLayer === 'traffic_incidents') && (
                          <>
                            {community.trafficIncidents > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <AlertCircle size={12} className="text-orange-400" />
                                <span className="text-gray-300">
                                  {community.trafficIncidents} {community.trafficIncidents === 1 ? 'incident' : 'incidents'}
                                </span>
                              </div>
                            )}
                            {community.trafficSignals > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Circle size={12} className="text-yellow-400" />
                                <span className="text-gray-300">
                                  {community.trafficSignals} {community.trafficSignals === 1 ? 'signal' : 'signals'}
                                </span>
                              </div>
                            )}
                            {(community.trafficIncidents > 0 || community.trafficSignals > 0) && (
                              <div className="flex items-center gap-1 text-xs col-span-2 mt-1">
                                <span className="text-orange-400 font-semibold">
                                  Traffic Score: {((community.trafficIncidents || 0) + (community.trafficSignals || 0) * 2).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Traffic Signals Stats (standalone) */}
                        {activeLayer === 'traffic_signals' && community.trafficSignals > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Circle size={12} className="text-yellow-400" />
                            <span className="text-gray-300">
                              {community.trafficSignals} {community.trafficSignals === 1 ? 'signal' : 'signals'}
                            </span>
                          </div>
                        )}

                        {/* Flood Risk */}
                        {(activeLayer === 'flood_01_chance' || activeLayer === 'flood') && (
                          <div className="flex items-center gap-1 text-xs col-span-2">
                            {community.floodRisk ? (
                              <span className="text-cyan-400 font-semibold">⚠️ At Flood Risk (1% chance)</span>
                            ) : (
                              <span className="text-gray-500">No flood risk detected</span>
                            )}
                          </div>
                        )}

                        {/* Major Roads Access */}
                        {activeLayer === 'major_roads' && community.majorRoads !== undefined && (
                          <div className="flex items-center gap-1 text-xs col-span-2">
                            <Map size={12} className="text-blue-400" />
                            <span className="text-gray-300">
                              {community.majorRoads} {community.majorRoads === 1 ? 'major road' : 'major roads'} access
                            </span>
                          </div>
                        )}

                        {/* Crime (always show if available) */}
                        {community.crime > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingUp size={12} className="text-purple-400" />
                            <span className="text-gray-300">
                              Crime: {community.crime}
                            </span>
                          </div>
                        )}

                        {/* Default message if no layer-specific stats */}
                        {!activeLayer && (
                          <div className="text-xs text-gray-500 italic col-span-2">
                            Click to view on map
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

