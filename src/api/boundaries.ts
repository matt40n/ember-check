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
  url: string | null
  restrictions: string | null
  season: string | null
  fee: string | null
  description: string | null
  reservations: string | null
  hours: string | null
  lat: number
  lng: number
}

export function useRecSites() {
  return useQuery({
    queryKey: ['usfs-rec-sites'],
    ...STATIC,
    queryFn: async () => {
      const fc = await snapshotOrLive<GeoJSON.FeatureCollection<GeoJSON.Point>>('sites')
      return fc.features
        .filter((f) => f.geometry)
        .map((f): RecSite => {
          const p = f.properties as Record<string, string | null>
          return {
            name: p.recareaname ?? 'Unnamed site',
            forest: p.forestname ?? '',
            kind: (p.markeractivity as RecSite['kind']) ?? 'Campground Camping',
            open: p.openstatus === 'open' ? true : p.openstatus === 'closed' ? false : null,
            url: p.recareaurl,
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
