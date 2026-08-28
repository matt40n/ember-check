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
  source: 'edw' | 'ridb' | 'csp' | 'osm'
  /** Who runs it (RIDB/CSP/OSM sites): 'NPS', 'State Parks', 'County / regional', 'Private'… */
  operator?: string | null
  website?: string | null
  backcountry?: boolean
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
      const [fc, pages, ridb, extra, csp, osm] = await Promise.all([snapshotOrLive<GeoJSON.FeatureCollection<GeoJSON.Point>>('sites'), sitePages(), local<RidbSite[]>('ridb-sites.json', []), local<Record<string, RidbExtra>>('ridb-extra.json', {}), local<CspSite[]>('csp-sites.json', []), local<OsmSite[]>('osm-sites.json', [])])
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
      return mergeAll(edw, ridb, extra, csp, osm)
    },
  })
}

type RidbSite = { id: string; name: string; agency: string; area: string | null; lat: number; lng: number; reservable: boolean; sites: number | null; fee: string | null; description: string | null; stayLimit: string | null; phone: string | null; updated: string | null }
type RidbExtra = { season: string | null; openMonths: string[]; fee: string | null; checkedOn: string }
type CspSite = { id: string; name: string; park: string | null; type: string | null; subtype: string | null; detail: string | null; lat: number; lng: number }
type OsmSite = { id: string; name: string; operator?: string; kind: string; federalOrState?: boolean; lat: number; lng: number; backcountry?: boolean; groupOnly?: boolean; fee?: string; reservation?: string; seasonal?: string; openingHours?: string; capacity?: number; website?: string; phone?: string; description?: string; drinkingWater?: string; toilets?: string; fireplace?: string }

async function local<T>(file: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/${file}`)
    return r.ok ? await r.json() : fallback
  } catch {
    return fallback
  }
}
const norm = (s: string) => s.toLowerCase().replace(/\b(campground|campgrounds|group|camp|cg|site|sites|recreation|area|day use|picnic|equestrian|horse|lower|upper|loop|family|environmental|primitive|walk-in|boat-in|state park|sp|sra|sb)\b/g, '').replace(/[^a-z]/g, '')
const near = (a: { lat: number; lng: number }, b: { lat: number; lng: number }, km = 1.5) => Math.abs(a.lat - b.lat) * 111 < km && Math.abs(a.lng - b.lng) * 85 < km
const sameName = (a: string, b: string) => { const x = norm(a), y = norm(b); return x.length > 2 && y.length > 2 && (x === y || x.startsWith(y) || y.startsWith(x)) }

/**
 * One pin per campground. Precedence when two sources describe the same place (same-ish name within ~1.5 km):
 * USFS EDW (has the site's own USFS page + status) → Recreation.gov → State Parks → OpenStreetMap.
 * Higher-precedence records still pick up the Recreation.gov reservation link and any OSM website.
 */
function mergeAll(edw: RecSite[], ridb: RidbSite[], extra: Record<string, RidbExtra>, csp: CspSite[], osm: OsmSite[]): RecSite[] {
  const all: RecSite[] = [...edw]
  const findDup = (name: string, pt: { lat: number; lng: number }) => all.find((e) => near(e, pt) && sameName(e.name, name))
  for (const r of ridb) {
    const x = extra[r.id]
    const dup = findDup(r.name, r)
    if (dup) {
      if (r.reservable && !dup.ridbId) { dup.ridbId = r.id; dup.reservable = true }
      if (x?.season && !dup.season) dup.season = x.season
      continue
    }
    all.push({
      name: r.name, forest: [r.agency, r.area].filter(Boolean).join(' · '), source: 'ridb', operator: r.agency, ridbId: r.id, reservable: r.reservable, siteCount: r.sites, stayLimit: r.stayLimit, phone: r.phone,
      kind: 'Campground Camping', open: null, openSource: null, url: null, urlIsSitePage: false, restrictions: null,
      season: x?.season ?? null, fee: x?.fee ?? r.fee, description: r.description,
      reservations: r.reservable ? 'Reservable on Recreation.gov' : 'First-come, first-served (per Recreation.gov)', hours: null, lat: r.lat, lng: r.lng,
    })
  }
  for (const c of csp) {
    if (findDup(c.name, c) || (c.park && findDup(c.park, c))) continue
    all.push({
      name: c.park && !c.name.toLowerCase().includes(c.park.replace(/ (SP|SRA|SB|SHP|SNR|SVRA)$/, '').toLowerCase()) ? `${c.name} — ${c.park}` : c.name,
      forest: ['State Parks', c.park].filter(Boolean).join(' · '), source: 'csp', operator: 'State Parks',
      kind: 'Campground Camping', open: null, openSource: null, url: null, urlIsSitePage: false, restrictions: null, season: null, fee: null,
      description: [c.type, c.subtype, c.detail].filter(Boolean).join(' · ') || null,
      reservations: 'Reserve on ReserveCalifornia', hours: null, lat: c.lat, lng: c.lng,
    })
  }
  for (const o of osm) {
    const dup = findDup(o.name, o)
    if (dup) { if (o.website && !dup.url && dup.source !== 'edw') { dup.url = o.website; dup.website = o.website } ; continue }
    if (o.federalOrState) continue // a federal/state site every other feed missed is usually a duplicate under another name; don't double-pin
    all.push({
      name: o.name, forest: o.kind + (o.operator && o.operator !== o.kind ? ` · ${o.operator}` : ''), source: 'osm', operator: o.kind, website: o.website ?? null, backcountry: !!o.backcountry,
      siteCount: o.capacity ?? null, phone: o.phone ?? null,
      kind: o.backcountry ? 'Dispersed Camping' : 'Campground Camping', open: null, openSource: null, url: o.website ?? null, urlIsSitePage: false, restrictions: null,
      season: o.seasonal ? (o.seasonal === 'yes' ? 'Seasonal' : `Seasonal: ${o.seasonal}`) : o.openingHours ?? null,
      fee: o.fee ?? null,
      description: [o.description, o.groupOnly ? 'Group only' : null, o.drinkingWater ? `Drinking water: ${o.drinkingWater}` : null, o.toilets ? `Toilets: ${o.toilets}` : null, o.fireplace ? `Fire rings/places: ${o.fireplace}` : null].filter(Boolean).join(' · ') || null,
      reservations: o.reservation ? `Reservation: ${o.reservation}` : null, hours: null, lat: o.lat, lng: o.lng,
    })
  }
  return all
}
