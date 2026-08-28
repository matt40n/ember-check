import { useQuery } from '@tanstack/react-query'
import { fetchJson } from './fetchJson'
import { snapshotOrLive } from './snapshot'

export interface FireAlert {
  id: string
  event: string
  headline: string
  areaDesc: string
  onset: string | null
  ends: string | null
  expires: string
  ugc: string[]
}

const ALERTS_URL =
  'https://api.weather.gov/alerts/active?area=CA&event=Red%20Flag%20Warning,Fire%20Weather%20Watch,Fire%20Warning,Extreme%20Fire%20Danger'

export function useFireAlerts() {
  return useQuery({
    queryKey: ['nws-fire-alerts'],
    refetchInterval: 60 * 60_000, staleTime: 60 * 60_000,
    queryFn: async () => {
      const fc = await fetchJson<GeoJSON.FeatureCollection>(ALERTS_URL, { headers: { Accept: 'application/geo+json' } })
      return fc.features.map((f): FireAlert => {
        const p = f.properties as Record<string, unknown>
        return {
          id: String(p.id ?? f.id),
          event: String(p.event),
          headline: String(p.headline ?? ''),
          areaDesc: String(p.areaDesc ?? ''),
          onset: (p.onset as string) ?? null,
          ends: (p.ends as string) ?? null,
          expires: String(p.expires),
          ugc: ((p.geocode as { UGC?: string[] })?.UGC ?? []),
        }
      })
    },
  })
}

export function useFireZones() {
  return useQuery({
    queryKey: ['nws-fire-zones-ca'],
    staleTime: 24 * 60 * 60_000,
    // Zone polygons rarely change and are 3.5 MB live; the build-time snapshot is ~100 KB gzipped.
    queryFn: () => snapshotOrLive<GeoJSON.FeatureCollection>('zones'),
  })
}
