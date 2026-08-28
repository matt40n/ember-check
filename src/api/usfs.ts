import { useQuery } from '@tanstack/react-query'
import { snapshotOrLive } from './snapshot'

export function useForestBoundaries() {
  return useQuery({
    queryKey: ['usfs-forests-r5'],
    staleTime: 24 * 60 * 60_000,
    queryFn: () => snapshotOrLive<GeoJSON.FeatureCollection>('forests'),
  })
}

export const BLM_TILE_URL = 'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/tile/{z}/{y}/{x}'
