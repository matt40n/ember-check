import type { Jurisdiction } from '../types'
import type { BoundaryFC } from '../api/boundaries'
import { haversineKm, pointInGeometry } from './geo'
import { DISTRICT_OVERRIDES } from '../data/restrictions'

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
  /** false when the user cycled to an order beneath the one that actually governs this spot */
  governing?: boolean
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

/** Names of every polygon actually loaded, so an entry whose polygon is missing can fall back to its radius. */
const namesCache = new WeakMap<object, Set<string>>()
function polygonNames(b: BoundarySets): Set<string> {
  const key = b.usfs ?? b.blm ?? b.nps ?? {}
  const hit = namesCache.get(key)
  if (hit && (namesCache as WeakMap<object, Set<string>> & { last?: BoundarySets }).last === b) return hit
  const s = new Set<string>()
  for (const [fc, field] of [[b.usfs, 'forestname'], [b.blm, 'ADMU_NAME'], [b.nps, 'UNIT_NAME']] as const) for (const f of fc?.features ?? []) s.add(String((f.properties as Record<string, unknown>)?.[field]))
  namesCache.set(key, s); (namesCache as WeakMap<object, Set<string>> & { last?: BoundarySets }).last = b
  return s
}

export function matchUnit(all: Jurisdiction[], source: 'usfs' | 'blm' | 'nps', name: string | null) {
  if (!name) return null
  return all.find((j) => j.boundary?.source === source && j.boundary.match === name) ?? null
}

/** Every tracked order whose area contains the point, most specific first: park → forest → BLM field office → radius-only units. */
export function jurisdictionsAt(lat: number, lng: number, all: Jurisdiction[], b: BoundarySets): Jurisdiction[] {
  const nps = matchUnit(all, 'nps', findName(b.nps, lng, lat, 'UNIT_NAME'))
  const forestName = findName(b.usfs, lng, lat, 'forestname')
  const district = findName(b.districts, lng, lat, 'districtname')
  // Several entries can share one forest polygon (Humboldt-Toiyabe's Carson and Bridgeport districts): prefer the district's own
  const forestEntries = all.filter((j) => j.boundary?.source === 'usfs' && j.boundary.match === forestName)
  const override = district && DISTRICT_OVERRIDES[district] ? all.find((j) => j.id === DISTRICT_OVERRIDES[district]) : null
  const usfs = override ?? (district && forestEntries.find((j) => j.name.toLowerCase().includes(district.toLowerCase().replace(/ ranger district$/, '')))) ?? forestEntries[0] ?? null
  const blm = matchUnit(all, 'blm', findName(b.blm, lng, lat, 'ADMU_NAME'))
  const loaded = polygonNames(b)
  const radius = all.filter((j) => (!j.boundary || !loaded.has(j.boundary.match)) && haversineKm(lat, lng, j.lat, j.lng) <= j.radiusKm).sort((a, c) => (a.agency === 'CAL FIRE' ? 1 : 0) - (c.agency === 'CAL FIRE' ? 1 : 0))
  const out: Jurisdiction[] = []
  for (const j of [nps, usfs, ...forestEntries, blm, ...radius]) if (j && !out.includes(j)) out.push(j)
  return out
}

export function resolveProbe(lat: number, lng: number, all: Jurisdiction[], b: BoundarySets): ProbeResult {
  const nps = findName(b.nps, lng, lat, 'UNIT_NAME')
  const usfs = findName(b.usfs, lng, lat, 'forestname')
  const blm = findName(b.blm, lng, lat, 'ADMU_NAME')
  const district = findName(b.districts, lng, lat, 'districtname')
  const wilderness = findName(b.wilderness, lng, lat, 'wildernessname')
  const jurisdiction = jurisdictionsAt(lat, lng, all, b)[0] ?? null
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
