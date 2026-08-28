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
  forest: string
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
      const [fc, pages] = await Promise.all([snapshotOrLive<GeoJSON.FeatureCollection<GeoJSON.Point>>('sites'), sitePages()])
      return fc.features
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
    },
  })
}
