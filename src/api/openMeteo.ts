import { useQuery } from '@tanstack/react-query'
import { fetchJson } from './fetchJson'

export function useAirQuality(pt: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ['aqi', pt?.lat.toFixed(2), pt?.lng.toFixed(2)],
    enabled: !!pt,
    queryFn: async () => {
      const d = await fetchJson<{ current: { us_aqi: number; pm2_5: number } }>(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${pt!.lat}&longitude=${pt!.lng}&current=us_aqi,pm2_5`,
      )
      return d.current
    },
  })
}

export function useSpotWeather(pt: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ['wx', pt?.lat.toFixed(2), pt?.lng.toFixed(2)],
    enabled: !!pt,
    queryFn: async () => {
      const p = await fetchJson<{ properties: { forecast: string; fireWeatherZone: string } }>(
        `https://api.weather.gov/points/${pt!.lat.toFixed(4)},${pt!.lng.toFixed(4)}`,
      )
      const f = await fetchJson<{ properties: { periods: { name: string; temperature: number; windSpeed: string; relativeHumidity?: { value: number }; shortForecast: string }[] } }>(
        p.properties.forecast,
      )
      return { zone: p.properties.fireWeatherZone.split('/').pop()!, periods: f.properties.periods.slice(0, 2) }
    },
  })
}
