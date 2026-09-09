/**
 * Merge every campground source into one list — pure, so scripts/build-sites.ts can run it at build time and
 * the app only has to load the result. Precedence when two sources describe the same place (same-ish name
 * within ~1.5 km): USFS EDW (own USFS page + status) → Recreation.gov → State Parks → OpenStreetMap.
 */
import { stripHtml, feeVerdict, type FeeVerdict } from './text'
import { latestYearIn } from './freshness'

export interface RecSite {
  /** Position in the merged list; keys the lazy detail chunk */
  idx: number
  name: string
  /** Managing unit label: forest name for USFS EDW sites; agency + rec area for Recreation.gov sites */
  forest: string
  source: 'edw' | 'ridb' | 'csp' | 'osm'
  /** Who runs it (RIDB/CSP/OSM sites): 'NPS', 'State Parks', 'County / regional', 'Private'… */
  operator?: string | null
  backcountry?: boolean
  /** Recreation.gov facility id (RIDB sites only) */
  ridbId?: string
  reservable?: boolean
  siteCount?: number | null
  kind: 'Campground Camping' | 'Group Camping' | 'Dispersed Camping'
  open: boolean | null
  /** Where `open` came from: the site's own USFS page (trustworthy, with a check date) or the stale EDW feed */
  openSource: { kind: 'usfs-page'; checkedOn: string; pageUpdated: string | null } | { kind: 'edw' } | null
  /** The site's own page on fs.usda.gov when we could resolve it; otherwise the forest's recreation index */
  url: string | null
  urlIsSitePage: boolean
  feeKind: FeeVerdict['kind']
  feeHeadline: string
  /** Newest year mentioned in the site's free text (for the outdated-page warning); null if none */
  textYear: number | null
  lat: number
  lng: number
  // ---- detail (only in detail chunks; present on the in-browser fallback path) ----
  restrictions?: string | null
  season?: string | null
  fee?: string | null
  description?: string | null
  reservations?: string | null
  hours?: string | null
  stayLimit?: string | null
  phone?: string | null
  website?: string | null
}
export type SiteDetail = Pick<RecSite, 'restrictions' | 'season' | 'fee' | 'description' | 'reservations' | 'hours' | 'stayLimit' | 'phone' | 'website'>
export const DETAIL_FIELDS = ['restrictions', 'season', 'fee', 'description', 'reservations', 'hours', 'stayLimit', 'phone', 'website'] as const
export const DETAIL_CHUNKS = 24
export const chunkOf = (idx: number) => idx % DETAIL_CHUNKS

export type SitePage = { url: string; status: 'open' | 'closed' | null; statusText: string | null; updated: string | null; checkedOn: string }
export type RidbSite = { id: string; name: string; agency: string; area: string | null; lat: number; lng: number; reservable: boolean; sites: number | null; fee: string | null; description: string | null; stayLimit: string | null; phone: string | null; updated: string | null }
export type RidbExtra = { season: string | null; months: Record<string, string>; firstOpen: string | null; lastOpen: string | null; fee: string | null; checkedOn: string }
export type CspSite = { id: string; name: string; park: string | null; type: string | null; subtype: string | null; detail: string | null; lat: number; lng: number }
export type OsmSite = { id: string; name: string; operator?: string; kind: string; federalOrState?: boolean; lat: number; lng: number; backcountry?: boolean; groupOnly?: boolean; fee?: string; reservation?: string; seasonal?: string; openingHours?: string; capacity?: number; website?: string; phone?: string; description?: string; drinkingWater?: string; toilets?: string; fireplace?: string }

/** Legacy EDW links (recarea/?recid=…) now 301 to the forest's recreation index — link there honestly instead. */
export function forestRecreationUrl(legacy: string | null): string | null {
  const m = legacy?.match(/fs\.usda\.gov\/recarea\/([a-z-]+)\//)
  if (m) return `https://www.fs.usda.gov/recarea/${m[1]}/recreation`
  return legacy && /^https?:\/\//i.test(legacy) ? legacy : null
}

const norm = (s: string) => s.toLowerCase().replace(/\b(campground|campgrounds|group|camp|cg|site|sites|recreation|area|day use|picnic|equestrian|horse|lower|upper|loop|family|environmental|primitive|walk-in|boat-in|state park|sp|sra|sb)\b/g, '').replace(/[^a-z]/g, '')
const near = (a: { lat: number; lng: number }, b: { lat: number; lng: number }, km = 1.5) => Math.abs(a.lat - b.lat) * 111 < km && Math.abs(a.lng - b.lng) * 85 < km
const sameName = (a: string, b: string) => { const x = norm(a), y = norm(b); return x.length > 2 && y.length > 2 && (x === y || x.startsWith(y) || y.startsWith(x)) }
const exactName = (a: string, b: string) => { const x = norm(a); return x.length > 2 && x === norm(b) }

type Draft = Omit<RecSite, 'idx' | 'feeKind' | 'feeHeadline' | 'textYear'>

export function buildSites(fc: GeoJSON.FeatureCollection<GeoJSON.Point>, pages: Record<string, SitePage>, ridb: RidbSite[], extra: Record<string, RidbExtra>, csp: CspSite[], osm: OsmSite[]): RecSite[] {
  const edw: Draft[] = fc.features
    .filter((f) => f.geometry)
    .map((f) => {
      const p = f.properties as Record<string, string | null>
      const page = pages[`${p.forestname}|${p.recareaname}`]
      // EDW's openstatus is unmaintained (it calls most of the region "closed" in August); the site's own page wins.
      const open = page?.status ? page.status === 'open' : p.openstatus === 'open' ? true : p.openstatus === 'closed' ? false : null
      return {
        name: p.recareaname ?? 'Unnamed site',
        forest: p.forestname ?? '',
        kind: (p.markeractivity as RecSite['kind']) ?? 'Campground Camping',
        source: 'edw' as const,
        open,
        openSource: page?.status ? { kind: 'usfs-page' as const, checkedOn: page.checkedOn, pageUpdated: page.updated } : open !== null ? { kind: 'edw' as const } : null,
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
  const all: Draft[] = [...edw]
  const findDup = (name: string, pt: { lat: number; lng: number }) => all.find((e) => near(e, pt) && sameName(e.name, name))
  for (const r of ridb) {
    const x = extra[r.id]
    // Agencies place the same campground differently (RIDB's Mary Smith point was 23 km off before the
    // campsite-median fix); an identical name in the same forest within 25 km is the same campground.
    const dup = findDup(r.name, r) ?? all.find((e) => e.source === 'edw' && r.area === e.forest && exactName(e.name, r.name) && near(e, r, 25))
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
  return all.map((d, idx) => {
    const fee = feeVerdict(d.fee ?? null)
    return { ...d, idx, feeKind: fee.kind, feeHeadline: fee.headline, textYear: latestYearIn(d.season, d.description, d.fee, d.restrictions, d.reservations, d.hours) }
  })
}

/** Split the merged list into a lean index (what pins, tooltips and search need) and detail chunks read on card open. */
export function splitSites(sites: RecSite[]): { index: RecSite[]; chunks: Record<number, SiteDetail>[] } {
  const chunks: Record<number, SiteDetail>[] = Array.from({ length: DETAIL_CHUNKS }, () => ({}))
  const index = sites.map((s) => {
    const { restrictions, season, fee, description, reservations, hours, stayLimit, phone, website, ...lean } = s
    const detail: SiteDetail = { restrictions, season, fee, description, reservations, hours, stayLimit, phone, website }
    chunks[chunkOf(s.idx)][s.idx] = Object.fromEntries(Object.entries(detail).filter(([, v]) => v != null)) as SiteDetail
    return lean as RecSite
  })
  return { index, chunks }
}
