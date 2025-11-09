import React from "react";
import { Menu, X, Search, MapPin } from "lucide-react";

const Header = ({ sidebarOpen, onToggleSidebar }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg z-20">
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Left section: logo + toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <MapPin className="text-white" size={32} />

          <div>
            <h1 className="text-2xl font-bold text-white">Urban Insight</h1>
            <p className="text-xs text-blue-100">Calgary City Analytics</p>
          </div>
        </div>

        {/* Right section: search bar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 gap-2">
            <Search size={18} className="text-white" />
            <input
              type="text"
              placeholder="Search neighborhoods..."
              className="bg-transparent border-none outline-none text-white placeholder-blue-200 w-64"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
