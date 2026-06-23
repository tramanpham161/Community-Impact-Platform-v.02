// Ray-casting point-in-polygon. Handles Polygon and MultiPolygon GeoJSON
// geometries. Coordinates are [lng, lat] in WGS84 — for Cardiff-scale work
// the small-angle distortion is negligible, so a planar test is fine.

type Ring = Array<[number, number]>;

function pointInRing(point: [number, number], ring: Ring): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonRings(point: [number, number], rings: Ring[]): boolean {
  if (rings.length === 0) return false;
  // First ring is outer; subsequent rings are holes.
  if (!pointInRing(point, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(point, rings[i])) return false;
  }
  return true;
}

export function pointInFeature(
  point: [number, number],
  feature: GeoJSON.Feature
): boolean {
  const g = feature.geometry;
  if (g.type === "Polygon") {
    return pointInPolygonRings(point, g.coordinates as Ring[]);
  }
  if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates as Ring[][]) {
      if (pointInPolygonRings(point, poly)) return true;
    }
    return false;
  }
  return false;
}
