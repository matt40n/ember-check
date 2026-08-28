export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Ray-cast point-in-polygon for GeoJSON Polygon/MultiPolygon coordinates ([lng, lat]). */
export function pointInGeometry(lng: number, lat: number, geom: GeoJSON.Geometry | null | undefined): boolean {
  if (!geom) return false
  if (geom.type === 'Polygon') return inPolygon(lng, lat, geom.coordinates)
  if (geom.type === 'MultiPolygon') return geom.coordinates.some((p) => inPolygon(lng, lat, p))
  return false
}

function inPolygon(x: number, y: number, rings: GeoJSON.Position[][]) {
  if (!inRing(x, y, rings[0])) return false
  for (let i = 1; i < rings.length; i++) if (inRing(x, y, rings[i])) return false
  return true
}

function inRing(x: number, y: number, ring: GeoJSON.Position[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
