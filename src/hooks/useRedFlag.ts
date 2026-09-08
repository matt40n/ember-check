import { useMemo } from 'react'
import { useFireAlerts, useFireZones } from '../api/nws'
import { pointInGeometry } from '../lib/geo'

/** Fire-weather zones under an active Red Flag Warning (or Fire Weather Watch), as a FeatureCollection; null until both feeds load. */
export function useRedFlagZones(): GeoJSON.FeatureCollection | null {
  const alerts = useFireAlerts()
  const zones = useFireZones()
  return useMemo(() => {
    if (!alerts.data || !zones.data) return null
    const byUgc = new Map<string, { event: string; headline: string; ends: string | null }>()
    for (const a of alerts.data) for (const u of a.ugc) {
      const prev = byUgc.get(u)
      if (!prev || a.event === 'Red Flag Warning') byUgc.set(u, { event: a.event, headline: a.headline, ends: a.ends })
    }
    const features = zones.data.features
      .filter((f) => byUgc.has(String((f.properties as { state_zone: string }).state_zone)))
      .map((f) => ({ ...f, properties: { ...f.properties, ...byUgc.get(String((f.properties as { state_zone: string }).state_zone)) } }))
    return { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection
  }, [alerts.data, zones.data])
}

/** Is the given point inside any NWS fire-weather zone with an active Red Flag Warning? */
export function useRedFlag(pt: { lat: number; lng: number } | null) {
  const alerts = useFireAlerts()
  const zones = useFireZones()
  return useMemo(() => {
    if (!pt || !alerts.data || !zones.data) return { active: false, headline: null as string | null, watch: false }
    const zone = zones.data.features.find((f) => pointInGeometry(pt.lng, pt.lat, f.geometry))
    if (!zone) return { active: false, headline: null, watch: false }
    const ugc = String((zone.properties as { state_zone: string }).state_zone)
    const hits = alerts.data.filter((a) => a.ugc.includes(ugc))
    const rfw = hits.find((a) => a.event === 'Red Flag Warning')
    const watch = hits.find((a) => a.event === 'Fire Weather Watch')
    return { active: !!rfw, watch: !!watch, headline: (rfw ?? watch)?.headline ?? null }
  }, [pt, alerts.data, zones.data])
}
