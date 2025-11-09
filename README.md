# 🌆 Urban Insight  

### **Empowering Smarter, Safer, and More Sustainable Cities**  

---

## 🧭 Overview  

**Urban Insight** is a **GIS-powered web application** that visualizes sustainability, accessibility, and environmental data to support data-driven urban decision-making.  
By combining **geomatics analysis**, **remote sensing data**, and **open city datasets**, it helps planners, researchers, and citizens understand complex urban issues through clear, interactive maps.  

---

## 🌍 What It Does  

- **Maps critical urban factors** such as **flood risk zones**, **crime patterns**, and **emission levels** across Calgary.  
- Uses **high-accuracy (<1m)** georeferenced data in **EPSG:3778 (NAD83 / Alberta 3TM)** projection.  
- Integrates **remote sensing data** from **NASA** and **ESA** satellites, leveraging spectral band sensors to detect environmental indicators like **NO₂** and **CO**.  
- Displays all data through a **modern, interactive web interface**, making insights accessible to both experts and the general public.  

---

## 💡 Why It Matters  

- **For Governments:** Identify infrastructure vulnerabilities and plan resilient, data-informed interventions.  
- **For Residents:** Understand how environmental and accessibility factors impact their communities.  
- **For Researchers:** Leverage validated GIS and remote sensing data for sustainability and risk studies.  

---

## 🧱 Tech Stack  

| Layer | Technology | Description |
|-------|-------------|--------------|
| **Frontend** | React + Vite | Fast and modular development environment |
| **Styling** | Tailwind CSS + HTML | Modern, responsive UI framework |
| **Mapping** | OpenLayers | Handles GIS visualization and geospatial interactions |
| **Data Format** | GeoJSON | Efficient structure for storing and rendering spatial data |
| **Projection** | EPSG:3778 (NAD83 / Alberta 3TM) | Ensures <1m geolocation accuracy for Calgary and Alberta |
| **Data Sources** | NASA & ESA Satellite Feeds, City of Calgary Open Data | Remote sensing and civic data integration |

---

## 🚀 Running the Project Locally  

### **Prerequisites**
- Node.js **v16+**
- npm (bundled with Node)

### **Setup**

1. **Install dependencies**
   ```bash
   npm install

2. **Start the development server**
   ```bash
   npm run dev

Runs a local Vite server and opens the app in your browser.
