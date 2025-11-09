# Debugging White Screen Issue

## Common Causes:

1. **OpenLayers CSS not loading** - Check browser console for CSS errors
2. **JavaScript error** - Check browser console for JS errors
3. **Map container height** - Ensure parent containers have height
4. **Import errors** - Check if all OpenLayers imports are correct

## Quick Fixes:

1. **Check browser console** (F12) for errors
2. **Verify OpenLayers CSS is loading** - Should see `.ol-viewport` class in DOM
3. **Check if map div has dimensions** - Inspect element, should have width/height

## Test Steps:

1. Open browser console (F12)
2. Look for any red errors
3. Check if `Map initialized successfully` appears in console
4. Inspect the map container div - should have dimensions

## If still white screen:

Try switching back to Leaflet temporarily:
- Change `MapContainerOL` to `MapContainer` in App.jsx
- This will help isolate if it's an OpenLayers-specific issue

