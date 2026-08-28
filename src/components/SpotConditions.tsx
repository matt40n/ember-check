import { Wind, Thermometer, Cloud } from 'lucide-react'
import { useAirQuality, useSpotWeather } from '../api/openMeteo'

function aqiLabel(aqi: number) {
  if (aqi <= 50) return ['Good', '#4CAF50']
  if (aqi <= 100) return ['Moderate', '#E0A100']
  if (aqi <= 150) return ['Unhealthy for sensitive', '#E4572E']
  return ['Unhealthy', '#B7360D']
}

export function SpotConditions({ pt }: { pt: { lat: number; lng: number } | null }) {
  const aqi = useAirQuality(pt)
  const wx = useSpotWeather(pt)
  if (!pt) return null
  return (
    <section className="mt-3 rounded border border-pine-700 bg-pine-800/70 p-3 text-xs">
      <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream-dim">
        Right here · <span className="font-mono normal-case tracking-normal">{pt.lat.toFixed(3)}, {pt.lng.toFixed(3)}</span>
      </h2>
      <div className="mt-2 space-y-1.5">
        {aqi.data && (
          <p className="flex items-center gap-2">
            <Cloud size={13} />
            AQI <b className="font-mono">{aqi.data.us_aqi}</b>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: aqiLabel(aqi.data.us_aqi)[1] }} />
            {aqiLabel(aqi.data.us_aqi)[0]} · PM2.5 {aqi.data.pm2_5}
          </p>
        )}
        {wx.data?.periods.map((p) => (
          <p key={p.name} className="flex items-center gap-2 text-cream-dim">
            <Thermometer size={13} />
            <span className="text-cream">{p.name}</span> {p.temperature}° · <Wind size={13} /> {p.windSpeed}
            {p.relativeHumidity && ` · RH ${p.relativeHumidity.value}%`} · {p.shortForecast}
          </p>
        ))}
        {(aqi.isLoading || wx.isLoading) && <p className="text-cream-dim">Loading conditions…</p>}
        {(aqi.isError || wx.isError) && <p className="text-ember">Couldn't load conditions for this spot.</p>}
      </div>
    </section>
  )
}
