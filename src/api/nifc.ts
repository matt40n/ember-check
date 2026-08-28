import { useQuery } from '@tanstack/react-query'
import { fetchJson, NORCAL_BBOX } from './fetchJson'

const BASE = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services'
const bbox = `geometry=${NORCAL_BBOX}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects`

export interface Incident {
  name: string
  acres: number | null
  contained: number | null
  discovered: number | null
  type: string
  cause: string | null
  lat: number
  lng: number
}

export function useIncidents() {
  return useQuery({
    queryKey: ['wfigs-incidents'],
    refetchInterval: 60 * 60_000, staleTime: 60 * 60_000,
    queryFn: async () => {
      const url = `${BASE}/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&${bbox}&outFields=IncidentName,IncidentSize,PercentContained,FireDiscoveryDateTime,IncidentTypeCategory,FireCauseGeneral&outSR=4326&f=geojson`
      const fc = await fetchJson<GeoJSON.FeatureCollection<GeoJSON.Point>>(url)
      return fc.features
        .filter((f) => f.geometry)
        .map((f): Incident => {
          const p = f.properties as Record<string, unknown>
          return {
            name: String(p.IncidentName ?? 'Unnamed'),
            acres: (p.IncidentSize as number) ?? null,
            contained: (p.PercentContained as number) ?? null,
            discovered: (p.FireDiscoveryDateTime as number) ?? null,
            type: String(p.IncidentTypeCategory ?? 'WF'),
            cause: (p.FireCauseGeneral as string) ?? null,
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          }
        })
    },
  })
}

export function usePerimeters() {
  return useQuery({
    queryKey: ['wfigs-perimeters'],
    refetchInterval: 60 * 60_000, staleTime: 60 * 60_000,
    queryFn: () =>
      fetchJson<GeoJSON.FeatureCollection>(
        `${BASE}/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&${bbox}&outFields=poly_IncidentName,poly_GISAcres,attr_PercentContained&outSR=4326&geometryPrecision=4&maxAllowableOffset=0.0005&f=geojson`,
      ),
  })
}

/** NFDRS 3.0 predictive service areas for the Northern California GACC — ERC percentile is what GACCs use to bin fire danger. */
export function useFireDanger(enabled = true) {
  return useQuery({
    queryKey: ['ca-nfdrs-psa'],
    enabled,
    refetchInterval: 24 * 60 * 60_000, staleTime: 24 * 60 * 60_000,
    queryFn: () =>
      fetchJson<GeoJSON.FeatureCollection>(
        `${BASE}/CA_NFDRS/FeatureServer/1/query?where=GACCUnitID%3D%27ONCC_CA%27&outFields=PSAName,PSANationalCode,Avg_ERC,Avg_ERC_Pct,Avg_BI,Avg_ERC_Trend,EditDate&outSR=4326&geometryPrecision=3&maxAllowableOffset=0.002&f=geojson`,
      ),
  })
}
