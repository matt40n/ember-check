import { useQuery } from '@tanstack/react-query'
import { fetchJson } from './fetchJson'
import { stripHtml } from '../lib/text'

/** Wider bbox than NORCAL so Sierra/Inyo/Bishop polygons come through whole. */
const BBOX = '-124.5,36.5,-118,42.1'
const ENV = `geometry=${BBOX}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`
const DAY = 24 * 60 * 60_000
const STATIC = { staleTime: DAY, gcTime: DAY, refetchOnWindowFocus: false } as const

export type BoundaryFC = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>

export function useBlmFieldOffices() {
  return useQuery({
    queryKey: ['blm-field-offices-ca'],
    ...STATIC,
    queryFn: () =>
      fetchJson<BoundaryFC>(
        `https://gis.blm.gov/arcgis/rest/services/admin_boundaries/BLM_Natl_AdminUnit_Generalized/MapServer/3/query?where=ADMIN_ST%3D%27CA%27&outFields=ADMU_NAME&geometryPrecision=4&${ENV}`,
      ),
  })
}

export function useNpsUnits() {
  return useQuery({
    queryKey: ['nps-units-ca'],
    ...STATIC,
    queryFn: () =>
      fetchJson<BoundaryFC>(
        `https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2/query?where=STATE%3D%27CA%27&outFields=UNIT_NAME,UNIT_CODE,UNIT_TYPE&geometryPrecision=4&${ENV}`,
      ),
  })
}

export function useWilderness() {
  return useQuery({
    queryKey: ['usfs-wilderness'],
    ...STATIC,
    queryFn: () =>
      fetchJson<BoundaryFC>(
        `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_Wilderness_01/MapServer/0/query?where=1%3D1&outFields=wildernessname,gis_acres&geometryPrecision=4&${ENV}`,
      ),
  })
}

export function useRangerDistricts() {
  return useQuery({
    queryKey: ['usfs-ranger-districts-r5'],
    ...STATIC,
    queryFn: () =>
      fetchJson<BoundaryFC>(
        `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RangerDistricts_01/MapServer/0/query?where=region%20IN%20(%2705%27,%2704%27)&outFields=districtname,forestname&geometryPrecision=4&${ENV}`,
      ),
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
      const fc = await fetchJson<GeoJSON.FeatureCollection<GeoJSON.Point>>(
        `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecreationOpportunities_01/MapServer/0/query?where=markeractivity%20IN%20(%27Campground%20Camping%27,%27Dispersed%20Camping%27,%27Group%20Camping%27)&outFields=recareaname,forestname,markeractivity,openstatus,recareaurl,restrictions,open_season_start,open_season_end,feedescription,recareadescription,reservation_info,operational_hours&${ENV}`,
      )
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
