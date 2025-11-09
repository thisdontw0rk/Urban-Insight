/**
 * Script to extract GeoJSON from QGIS2web JavaScript export files
 * 
 * Usage: node extract-geojson.js ~/Downloads/qgis2web_2025_11_08-19_28_48_571715/data/import_flood_01_chance_2.js
 */

const fs = require('fs');
const path = require('path');

function extractGeoJSONFromJS(jsFilePath, outputDir) {
  try {
    console.log(`Reading: ${jsFilePath}`);
    const jsContent = fs.readFileSync(jsFilePath, 'utf8');
    
    // Try to find GeoJSON-like structures in the JS file
    // qgis2web typically embeds coordinates in arrays
    // Look for patterns like: var layer = L.geoJSON({...})
    
    // Method 1: Try to find JSON.parse or direct GeoJSON objects
    let geoJsonMatch = jsContent.match(/(\{[\s\S]*"type"\s*:\s*"FeatureCollection"[\s\S]*\})/);
    
    if (!geoJsonMatch) {
      // Method 2: Look for coordinate arrays and try to reconstruct
      console.log('No direct GeoJSON found. Checking for coordinate arrays...');
      
      // This is a simplified approach - for complex files, you may need QGIS to export as GeoJSON directly
      console.log('⚠️  Complex JS file detected. Recommend exporting as GeoJSON from QGIS instead.');
      console.log('\nAlternative: Re-export from QGIS:');
      console.log('1. Open your QGIS project');
      console.log('2. Right-click the layer → Export → Save Features As...');
      console.log('3. Choose "GeoJSON" format');
      console.log('4. Save to your project\'s public/data/ folder');
      return;
    }
    
    const geoJsonStr = geoJsonMatch[1];
    const geoJson = JSON.parse(geoJsonStr);
    
    // Generate output filename
    const basename = path.basename(jsFilePath, '.js');
    const outputPath = path.join(outputDir, `${basename}.geojson`);
    
    // Write GeoJSON file
    fs.writeFileSync(outputPath, JSON.stringify(geoJson, null, 2));
    console.log(`✅ Extracted GeoJSON to: ${outputPath}`);
    console.log(`   Features: ${geoJson.features?.length || 0}`);
    
    return outputPath;
  } catch (error) {
    console.error('Error extracting GeoJSON:', error.message);
    console.log('\n💡 Tip: The QGIS export uses optimized JS files.');
    console.log('   Best solution: Re-export layers as GeoJSON from QGIS:');
    console.log('   1. Right-click layer → Export → Save Features As...');
    console.log('   2. Format: GeoJSON');
    console.log('   3. Save to: public/data/');
  }
}

// Main execution
if (require.main === module) {
  const jsFile = process.argv[2];
  const outputDir = process.argv[3] || './public/data';
  
  if (!jsFile) {
    console.log('Usage: node extract-geojson.js <path-to-js-file> [output-dir]');
    console.log('Example: node extract-geojson.js ~/Downloads/qgis2web_2025_11_08-19_28_48_571715/data/import_flood_01_chance_2.js');
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  extractGeoJSONFromJS(jsFile, outputDir);
}

module.exports = { extractGeoJSONFromJS };

