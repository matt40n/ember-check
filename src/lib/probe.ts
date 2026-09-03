import type { Jurisdiction } from '../types'
import type { BoundaryFC } from '../api/boundaries'
import { haversineKm, pointInGeometry } from './geo'

export interface ProbeResult {
  jurisdiction: Jurisdiction | null
  /** Name of the boundary polygon that matched (may exist even with no tracked order) */
  unitName: string | null
  district: string | null
  wilderness: string | null
  /** true when the enclosing order lists this wilderness as a campfire exemption */
  wildernessExempt: boolean
  /** true when the user is looking at the wilderness itself (cycle step), not the enclosing order */
  wildernessFocus?: boolean
  /** Surface manager at the point per BLM's SMA layer, once known; 'pending' while the lookup runs */
  surface?: string | 'pending'
}

export interface BoundarySets {
  usfs?: GeoJSON.FeatureCollection
  blm?: BoundaryFC
  nps?: BoundaryFC
  wilderness?: BoundaryFC
  districts?: BoundaryFC
}

function findName(fc: GeoJSON.FeatureCollection | undefined, lng: number, lat: number, field: string) {
  const f = fc?.features.find((f) => pointInGeometry(lng, lat, f.geometry))
  return f ? String((f.properties as Record<string, unknown>)[field]) : null
}

export function matchUnit(all: Jurisdiction[], source: 'usfs' | 'blm' | 'nps', name: string | null) {
  if (!name) return null
  return all.find((j) => j.boundary?.source === source && j.boundary.match === name) ?? null
}

/** Every tracked order whose area contains the point, most specific first: park → forest → BLM field office → radius-only units. */
export function jurisdictionsAt(lat: number, lng: number, all: Jurisdiction[], b: BoundarySets): Jurisdiction[] {
  const nps = matchUnit(all, 'nps', findName(b.nps, lng, lat, 'UNIT_NAME'))
  const usfs = matchUnit(all, 'usfs', findName(b.usfs, lng, lat, 'forestname'))
  const blm = matchUnit(all, 'blm', findName(b.blm, lng, lat, 'ADMU_NAME'))
  const radius = all.filter((j) => !j.boundary && haversineKm(lat, lng, j.lat, j.lng) <= j.radiusKm).sort((a, c) => (a.agency === 'CAL FIRE' ? 1 : 0) - (c.agency === 'CAL FIRE' ? 1 : 0))
  const out: Jurisdiction[] = []
  for (const j of [nps, usfs, blm, ...radius]) if (j && !out.includes(j)) out.push(j)
  return out
}

export function resolveProbe(lat: number, lng: number, all: Jurisdiction[], b: BoundarySets): ProbeResult {
  const nps = findName(b.nps, lng, lat, 'UNIT_NAME')
  const usfs = findName(b.usfs, lng, lat, 'forestname')
  const blm = findName(b.blm, lng, lat, 'ADMU_NAME')
  const district = findName(b.districts, lng, lat, 'districtname')
  const wilderness = findName(b.wilderness, lng, lat, 'wildernessname')

  // Most specific first: park → forest → BLM field office (covers everything incl. private land) → radius fallback
  let jurisdiction = matchUnit(all, 'nps', nps) ?? matchUnit(all, 'usfs', usfs) ?? matchUnit(all, 'blm', blm)
  if (!jurisdiction) {
    jurisdiction =
      all
        .filter((j) => !j.boundary)
        .map((j) => ({ j, d: haversineKm(lat, lng, j.lat, j.lng) }))
        .filter((x) => x.d <= x.j.radiusKm)
        .sort((a, b) => (a.j.agency === 'CAL FIRE' ? 1 : 0) - (b.j.agency === 'CAL FIRE' ? 1 : 0) || a.d - b.d)[0]?.j ?? null
  }
  return {
    jurisdiction,
    unitName: nps ?? usfs ?? blm,
    district,
    wilderness,
    wildernessExempt: !!(wilderness && jurisdiction?.wildernessExempt?.includes(wilderness)),
  }
}

/** Every wilderness name that some tracked order exempts, mapped to the exempting unit. */
export function exemptWildernessIndex(all: Jurisdiction[]) {
  const m = new Map<string, Jurisdiction[]>()
  for (const j of all) for (const w of j.wildernessExempt ?? []) m.set(w, [...(m.get(w) ?? []), j])
  return m
}
