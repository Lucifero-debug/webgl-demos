/*
  Geography in plain numbers. No three imports, so page components can use
  these without pulling Three.js into the page's first download.
*/

/**
 * Unit vector for a latitude and longitude (degrees), matching three's
 * SphereGeometry UVs with an equirectangular Earth texture, whose left edge
 * is 180 degrees west. Earth's radius is 1.
 */
export function latLonToArray(lat: number, lon: number): [number, number, number] {
  const phi = ((lon + 180) * Math.PI) / 180;
  const theta = ((90 - lat) * Math.PI) / 180;
  return [
    -Math.cos(phi) * Math.sin(theta),
    Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
  ];
}

/** "35.01° N, 135.77° E" */
export function formatCoordinates(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

/** Great-circle distance in kilometres, the way a flight is measured. */
export function distanceKm(latA: number, lonA: number, latB: number, lonB: number) {
  const rad = Math.PI / 180;
  const dLat = (latB - latA) * rad;
  const dLon = (lonB - lonA) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * rad) * Math.cos(latB * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
