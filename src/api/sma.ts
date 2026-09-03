/**
 * Who manages the surface at a point, from BLM's Surface Management Agency service. Used to decide whether a
 * BLM field-office order actually applies where the user clicked (BLM parcels only) or whether the spot is
 * private/state land with no federal order. Live, one small request per click, cached by rounded coordinate.
 */
export type SurfaceManager = 'BLM' | 'USFS' | 'NPS' | 'USFW' | 'USBR' | 'DOD' | 'BIA' | 'State' | 'Local' | 'Private' | 'Undetermined' | 'OtherFederal' | 'unknown'
/** Surface classes that positively rule out a BLM order (a named non-BLM manager). 'Undetermined' does not. */
export const NOT_BLM: SurfaceManager[] = ['USFS', 'NPS', 'USFW', 'USBR', 'DOD', 'BIA', 'State', 'Local', 'Private', 'OtherFederal']
const URL = 'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_LimitedScale/MapServer/1/query'
const cache = new Map<string, Promise<SurfaceManager>>()

export function surfaceManagerAt(lat: number, lng: number): Promise<SurfaceManager> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
  let p = cache.get(key)
  if (!p) {
    p = (async () => {
      try {
        const q = new URLSearchParams({ geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: '4326', spatialRel: 'esriSpatialRelIntersects', outFields: 'ADMIN_AGENCY_CODE,ADMIN_DEPT_CODE', returnGeometry: 'false', f: 'json' })
        const r = await fetch(`${URL}?${q}`, { signal: AbortSignal.timeout(8000) })
        const d = (await r.json()) as { features?: { attributes: { ADMIN_AGENCY_CODE: string | null; ADMIN_DEPT_CODE: string | null } }[] }
        const a = d.features?.[0]?.attributes
        if (!d.features) return 'unknown'
        if (!a) return 'Undetermined' // nothing mapped here
        const code = (a.ADMIN_AGENCY_CODE ?? '').toUpperCase()
        const dept = (a.ADMIN_DEPT_CODE ?? '').toUpperCase()
        if (['BLM', 'USFS', 'NPS', 'USFW', 'USBR', 'DOD', 'BIA'].includes(code)) return code as SurfaceManager
        if (/^(PVT|PRI|PRIVATE)/.test(code)) return 'Private'
        if (/^(UND|UNK)/.test(code) || dept === 'UND') return 'Undetermined' // SMA's catch-all; includes some BLM parcels, so never treated as proof of private land
        if (/STATE|^ST|^CA$|CDPR|CDFW|CALTRANS/.test(code) || dept === 'ST') return 'State'
        if (/LOCAL|COUNTY|CITY|^LG|^CTY|MUNI/.test(code) || dept === 'LG') return 'Local'
        return code ? 'OtherFederal' : 'unknown'
      } catch {
        return 'unknown'
      }
    })()
    cache.set(key, p)
  }
  return p
}
