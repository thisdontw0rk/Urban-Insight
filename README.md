# Urban Insight 🏙️

A GIS-powered web platform that visualizes sustainability, accessibility, and safety metrics across cities — helping planners and citizens make data-driven urban decisions.

## ✨ Features

- **Interactive Map Visualization**: Explore multiple data layers including flood risk, safety index, parks, LRT system, traffic, and major roads
- **Community Search**: Search and analyze specific communities with detailed statistics
- **Real-time Metrics**: View key metrics for each active layer in the sidebar
- **Data-Driven Insights**: Built using real Calgary open data and GIS analysis

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+ recommended)
- npm (bundled with Node)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Urban-Insight
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🗺️ Map Layers

- **Community Borders**: Calgary community boundaries
- **Major Roads**: Major road network
- **LRT System**: Light Rail Transit lines and stations
- **Parks**: Parks and green spaces
- **Traffic**: Traffic incidents and signals
- **Flood Risk**: Areas vulnerable to flooding (1% annual chance)
- **Safety Index**: Crime and safety metrics by community
- **Vancouver NO2 Emission**: Satellite-based nitrogen dioxide visualization

## 🛠️ Tech Stack

- **React** - UI framework
- **OpenLayers** - Map rendering
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **GeoJSON** - Geographic data format

## 📁 Project Structure

```
src/
├── components/
│   ├── Header/        # Header and search bar
│   ├── Map/          # Map components (OpenLayers)
│   └── Sidebar/      # Sidebar with layer controls
├── utils/
│   ├── communityStats.js  # Community statistics calculations
│   ├── layerMetrics.js    # Layer-specific metrics
│   └── loadGeoJSON.js      # GeoJSON loading and styling
└── App.jsx            # Main application component
```

## 📊 Data Sources

- Calgary Open Data Portal
- Community boundaries and statistics
- Flood risk zones
- LRT system data
- Parks and green spaces
- Traffic incidents and signals
- Crime statistics

## 🎯 Use Cases

- **Urban Planning**: Identify areas needing infrastructure improvements
- **Community Analysis**: Understand accessibility and safety metrics
- **Risk Assessment**: Evaluate flood risk and safety concerns
- **Transportation Planning**: Analyze LRT coverage and traffic patterns

## 📝 License

This project is open source and available for hackathon use.

## 👥 Team

Built for hackathon demonstration using real Calgary data and GIS analysis.
