import { useQuery } from '@tanstack/react-query'
import { fetchJson, NORCAL_BBOX } from './fetchJson'

export function useForestBoundaries() {
  return useQuery({
    queryKey: ['usfs-forests-r5'],
    staleTime: 24 * 60 * 60_000,
    queryFn: () =>
      fetchJson<GeoJSON.FeatureCollection>(
        `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0/query?where=REGION%3D%2705%27&geometry=${NORCAL_BBOX}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=forestname&outSR=4326&geometryPrecision=4&f=geojson`,
      ),
  })
}

export const BLM_TILE_URL = 'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/tile/{z}/{y}/{x}'
