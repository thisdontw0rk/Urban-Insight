const fs = require('fs');
const path = require('path');

// Extract major roads
const majorRoadsPath = '/Users/lidmarka/Downloads/qgis2web_2025_11_08-19_28_48_571715/data/import_major_roads_1.js';
const majorRoadsData = fs.readFileSync(majorRoadsPath, 'utf8');
// Remove the variable declaration and semicolon
const majorRoadsJson = majorRoadsData.replace(/^var json_import_major_roads_1 = /, '').replace(/;?\s*$/, '');
fs.writeFileSync('public/data/major-roads.json', majorRoadsJson);
console.log('✓ Extracted major-roads.json');

// Extract flood data
const floodPath = '/Users/lidmarka/Downloads/qgis2web_2025_11_08-19_28_48_571715/data/import_flood_01_chance_2.js';
const floodData = fs.readFileSync(floodPath, 'utf8');
// Remove the variable declaration and semicolon
const floodJson = floodData.replace(/^var json_import_flood_01_chance_2 = /, '').replace(/;?\s*$/, '');
fs.writeFileSync('public/data/flood-01-chance.json', floodJson);
console.log('✓ Extracted flood-01-chance.json');

// Copy legend images
const legendDir = '/Users/lidmarka/Downloads/qgis2web_2025_11_08-19_28_48_571715/legend';
const publicLegendDir = 'public/legend';

if (!fs.existsSync(publicLegendDir)) {
  fs.mkdirSync(publicLegendDir, { recursive: true });
}

const legendFiles = ['import_major_roads_1.png', 'import_flood_01_chance_2.png'];
legendFiles.forEach(file => {
  const src = path.join(legendDir, file);
  const dest = path.join(publicLegendDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  }
});

console.log('✓ All data extracted successfully!');

