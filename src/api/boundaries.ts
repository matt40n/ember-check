import { useQuery } from '@tanstack/react-query'
import { snapshotOrLive } from './snapshot'
import { stripHtml } from '../lib/text'

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

export interface RecSite {
  name: string
  /** Managing unit label: forest name for USFS EDW sites; agency + rec area for Recreation.gov sites */
  forest: string
  source: 'edw' | 'ridb'
  /** Recreation.gov facility id (RIDB sites only) */
  ridbId?: string
  reservable?: boolean
  siteCount?: number | null
  stayLimit?: string | null
  phone?: string | null
  kind: 'Campground Camping' | 'Group Camping' | 'Dispersed Camping'
  open: boolean | null
  /** Where `open` came from: the site's own USFS page (trustworthy, with a check date) or the stale EDW feed */
  openSource: { kind: 'usfs-page'; checkedOn: string; pageUpdated: string | null } | { kind: 'edw' } | null
  /** The site's own page on fs.usda.gov when we could resolve it; otherwise the forest's recreation index */
  url: string | null
  urlIsSitePage: boolean
  restrictions: string | null
  season: string | null
  fee: string | null
  description: string | null
  reservations: string | null
  hours: string | null
  lat: number
  lng: number
}

type SitePage = { url: string; status: 'open' | 'closed' | null; statusText: string | null; updated: string | null; checkedOn: string }
async function sitePages(): Promise<Record<string, SitePage>> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/site-pages.json`)
    return r.ok ? await r.json() : {}
  } catch {
    return {}
  }
}
/** Legacy EDW links (recarea/?recid=…) now 301 to the forest's recreation index — link there honestly instead. */
function forestRecreationUrl(legacy: string | null): string | null {
  const m = legacy?.match(/fs\.usda\.gov\/recarea\/([a-z-]+)\//)
  return m ? `https://www.fs.usda.gov/recarea/${m[1]}/recreation` : legacy
}

export function useRecSites() {
  return useQuery({
    queryKey: ['usfs-rec-sites'],
    ...STATIC,
    queryFn: async () => {
      const [fc, pages, ridb] = await Promise.all([snapshotOrLive<GeoJSON.FeatureCollection<GeoJSON.Point>>('sites'), sitePages(), ridbSites()])
      const edw = fc.features
        .filter((f) => f.geometry)
        .map((f): RecSite => {
          const p = f.properties as Record<string, string | null>
          const page = pages[`${p.forestname}|${p.recareaname}`]
          // EDW's openstatus is unmaintained (it calls most of the region "closed" in August); the site's own page wins.
          const open = page?.status ? page.status === 'open' : p.openstatus === 'open' ? true : p.openstatus === 'closed' ? false : null
          return {
            name: p.recareaname ?? 'Unnamed site',
            forest: p.forestname ?? '',
            kind: (p.markeractivity as RecSite['kind']) ?? 'Campground Camping',
            source: 'edw',
            open,
            openSource: page?.status ? { kind: 'usfs-page', checkedOn: page.checkedOn, pageUpdated: page.updated } : open !== null ? { kind: 'edw' } : null,
            url: page?.url ?? forestRecreationUrl(p.recareaurl),
            urlIsSitePage: !!page,
            restrictions: stripHtml(p.restrictions),
            season: stripHtml([stripHtml(p.open_season_start), stripHtml(p.open_season_end)].filter(Boolean).join(' – ')),
            fee: stripHtml(p.feedescription),
            description: stripHtml(p.recareadescription),
            reservations: stripHtml(p.reservation_info),
            hours: stripHtml(p.operational_hours),
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          }
        })
      return mergeRidb(edw, ridb)
    },
  })
}

type RidbSite = { id: string; name: string; agency: string; area: string | null; lat: number; lng: number; reservable: boolean; sites: number | null; fee: string | null; description: string | null; stayLimit: string | null; phone: string | null; updated: string | null }
async function ridbSites(): Promise<RidbSite[]> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/ridb-sites.json`)
    return r.ok ? await r.json() : []
  } catch {
    return []
  }
}
const norm = (s: string) => s.toLowerCase().replace(/\b(campground|campgrounds|group|camp|cg|site|sites|recreation|area|day use|picnic|equestrian|horse)\b/g, '').replace(/[^a-z]/g, '')
/** Recreation.gov carries many of the same USFS campgrounds as EDW; keep the EDW record (it has the USFS page + status) and add the rest. */
function mergeRidb(edw: RecSite[], ridb: RidbSite[]): RecSite[] {
  const extra: RecSite[] = []
  for (const r of ridb) {
    const key = norm(r.name)
    const dup = edw.some((e) => Math.abs(e.lat - r.lat) < 0.02 && Math.abs(e.lng - r.lng) < 0.025 && (norm(e.name) === key || norm(e.name).startsWith(key) || key.startsWith(norm(e.name))) && key.length > 2)
    if (dup) {
      // Let the EDW record link to Recreation.gov's reservation page too
      const e = edw.find((e) => Math.abs(e.lat - r.lat) < 0.02 && Math.abs(e.lng - r.lng) < 0.025 && (norm(e.name) === key || norm(e.name).startsWith(key) || key.startsWith(norm(e.name))))
      if (e && r.reservable && !e.ridbId) { e.ridbId = r.id; e.reservable = true }
      continue
    }
    extra.push({
      name: r.name,
      forest: [r.agency, r.area].filter(Boolean).join(' · '),
      source: 'ridb',
      ridbId: r.id,
      reservable: r.reservable,
      siteCount: r.sites,
      stayLimit: r.stayLimit,
      phone: r.phone,
      kind: 'Campground Camping',
      open: null,
      openSource: null,
      url: null,
      urlIsSitePage: false,
      restrictions: null,
      season: null,
      fee: r.fee,
      description: r.description,
      reservations: r.reservable ? 'Reservable on Recreation.gov' : 'First-come, first-served (per Recreation.gov)',
      hours: null,
      lat: r.lat,
      lng: r.lng,
    })
  }
  return [...edw, ...extra]
}
