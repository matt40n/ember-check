/**
 * OpenStreetMap often tags one campsite twice: a multipolygon relation and its outer way both carry
 * tourism=camp_site with the same name, and Overpass's `out center` puts them on the same point. Rows with an
 * identical name and coordinate collapse to one — whichever carries more tags, the earlier row on a tie.
 * Pure, so scripts/import-osm.ts can run it on the Overpass result.
 */
export function collapseIdentical<T extends { name: string; lat: number; lng: number }>(rows: T[]): T[] {
  const filled = (r: T) => Object.values(r as Record<string, unknown>).filter((v) => v !== null && v !== undefined && v !== false).length
  const kept = new Map<string, T>()
  for (const r of rows) {
    const k = `${r.name}|${r.lat}|${r.lng}`
    const prev = kept.get(k)
    if (!prev || filled(r) > filled(prev)) kept.set(k, r)
  }
  return [...kept.values()]
}
