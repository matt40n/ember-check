import { fetchJson } from './fetchJson'

/**
 * Slow-moving layers (boundaries, wilderness, districts, rec sites) ship as build-time snapshots in
 * public/data/ (see scripts/snapshot-boundaries.ts, refreshed monthly by CI). Read the snapshot first;
 * fall back to the live ArcGIS query only if the snapshot is missing — that keeps the app up when USFS's
 * servers are slow or down, and keeps traffic off them.
 */
export const SNAPSHOTS = {
  forests: `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0/query?where=REGION%3D%2705%27&geometry=-124.5,36.5,-119.5,42.1&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=forestname&outSR=4326&geometryPrecision=4&f=geojson`,
  blm: `https://gis.blm.gov/arcgis/rest/services/admin_boundaries/BLM_Natl_AdminUnit_Generalized/MapServer/3/query?where=ADMIN_ST%3D%27CA%27&outFields=ADMU_NAME&geometryPrecision=4&geometry=-124.5,36.5,-118,42.1&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`,
  nps: `https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2/query?where=STATE%3D%27CA%27&outFields=UNIT_NAME,UNIT_CODE,UNIT_TYPE&geometryPrecision=4&maxAllowableOffset=0.0004&geometry=-124.5,36.5,-118,42.1&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`,
  wilderness: `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_Wilderness_01/MapServer/0/query?where=1%3D1&outFields=wildernessname,gis_acres&geometryPrecision=4&maxAllowableOffset=0.0004&geometry=-124.5,36.5,-118,42.1&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`,
  districts: `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RangerDistricts_01/MapServer/0/query?where=region%20IN%20(%2705%27,%2704%27)&outFields=districtname,forestname&geometryPrecision=4&geometry=-124.5,36.5,-118,42.1&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`,
  sites: `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecreationOpportunities_01/MapServer/0/query?where=markeractivity%20IN%20(%27Campground%20Camping%27,%27Dispersed%20Camping%27,%27Group%20Camping%27)&outFields=recareaname,forestname,markeractivity,openstatus,recareaurl,restrictions,open_season_start,open_season_end,feedescription,recareadescription,reservation_info,operational_hours&geometry=-124.5,36.5,-118,42.1&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`,
} as const

export type SnapshotName = keyof typeof SNAPSHOTS

export async function snapshotOrLive<T>(name: SnapshotName): Promise<T> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  try {
    const r = await fetch(`${base}/data/${name}.json`)
    if (r.ok) return (await r.json()) as T
  } catch {
    /* fall through to live */
  }
  return fetchJson<T>(SNAPSHOTS[name])
}
