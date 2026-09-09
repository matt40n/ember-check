import { useQuery } from '@tanstack/react-query'
import { snapshotOrLive } from './snapshot'
import { buildSites, type CspSite, type OsmSite, type RecSite, type RidbExtra, type RidbSite, type SitePage } from '../lib/mergeSites'
export type { RecSite } from '../lib/mergeSites'

const DAY = 24 * 60 * 60_000
const STATIC = { staleTime: DAY, gcTime: DAY, refetchOnWindowFocus: false } as const

export type BoundaryFC = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>

export function useBlmFieldOffices() {
  return useQuery({
    queryKey: ['blm-field-offices-ca'],
    ...STATIC,
    queryFn: () => snapshotOrLive<BoundaryFC>('blm'),
  })
}

export function useNpsUnits() {
  return useQuery({
    queryKey: ['nps-units-ca'],
    ...STATIC,
    queryFn: () => snapshotOrLive<BoundaryFC>('nps'),
  })
}

export function useWilderness() {
  return useQuery({
    queryKey: ['usfs-wilderness'],
    ...STATIC,
    queryFn: () => snapshotOrLive<BoundaryFC>('wilderness'),
  })
}

export function useRangerDistricts() {
  return useQuery({
    queryKey: ['usfs-ranger-districts-r5'],
    ...STATIC,
    queryFn: () => snapshotOrLive<BoundaryFC>('districts'),
  })
}

async function local<T>(file: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/${file}`)
    return r.ok ? await r.json() : fallback
  } catch {
    return fallback
  }
}

export function useRecSites() {
  return useQuery({
    queryKey: ['rec-sites-index'],
    ...STATIC,
    queryFn: async () => {
      // Built at deploy time by scripts/build-sites.ts; details come from sites-detail-N.json on demand
      const index = await local<RecSite[] | null>('sites-index.json', null)
      if (index && index.length) return index
      // Fallback (dev without a build, or a broken deploy): merge in the browser from the raw files
      const [fc, pages, ridb, extra, csp, osm] = await Promise.all([snapshotOrLive<GeoJSON.FeatureCollection<GeoJSON.Point>>('sites'), local<Record<string, SitePage>>('site-pages.json', {}), local<RidbSite[]>('ridb-sites.json', []), local<Record<string, RidbExtra>>('ridb-extra.json', {}), local<CspSite[]>('csp-sites.json', []), local<OsmSite[]>('osm-sites.json', [])])
      return buildSites(fc, pages, ridb, extra, csp, osm)
    },
  })
}
