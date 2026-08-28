import { useMemo } from 'react'
import { useFireAlerts, useFireZones } from '../api/nws'
import { pointInGeometry } from '../lib/geo'

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
