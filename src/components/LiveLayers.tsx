import { useMemo } from 'react'
import L from 'leaflet'
import { GeoJSON, Marker, Popup, TileLayer } from 'react-leaflet'
import { format } from 'date-fns'
import { useFireAlerts, useFireZones } from '../api/nws'
import { useFireDanger, useIncidents, usePerimeters } from '../api/nifc'
import { BLM_TILE_URL } from '../api/usfs'

export interface LayerFlags { redFlag: boolean; fires: boolean; perimeters: boolean; blm: boolean; danger: boolean }

// lucide "flame" glyph, filled ember on a dark halo so it reads as fire, not a campground dot
const FLAME = '<svg viewBox="0 0 24 24" fill="#E4572E" stroke="#10170F" stroke-width="1.2" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>'
const fireIcon = (big: boolean) => {
  const px = big ? 26 : 18
  return L.divIcon({ className: '', html: `<div class="fire-icon${big ? ' big' : ''}">${FLAME}</div>`, iconSize: [px, px], iconAnchor: [px / 2, px] })
}

function ercColor(pct: number | null) {
  if (pct == null) return 'transparent'
  if (pct >= 97) return '#B7360D'
  if (pct >= 90) return '#E4572E'
  if (pct >= 80) return '#E0A100'
  if (pct >= 60) return '#C9B458'
  return '#4CAF50'
}

export function LiveLayers({ layers, onProbe }: { layers: LayerFlags; onProbe: (lat: number, lng: number) => void }) {
  const probeOnClick = (l: L.Layer) => l.on('click', (e) => onProbe((e as L.LeafletMouseEvent).latlng.lat, (e as L.LeafletMouseEvent).latlng.lng))
  const alerts = useFireAlerts()
  const zones = useFireZones()
  const incidents = useIncidents()
  const perims = usePerimeters()
  const danger = useFireDanger(layers.danger)

  const redFlagZones = useMemo(() => {
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

  return (
    <>
      {layers.blm && <TileLayer url={BLM_TILE_URL} opacity={0.45} attribution="BLM" maxNativeZoom={14} maxZoom={19} />}
      {layers.danger && danger.data && (
        <GeoJSON
          key={`danger-${danger.dataUpdatedAt}`}
          data={danger.data}
          style={(f) => ({ color: '#ffffff33', weight: 1, fillColor: ercColor(f?.properties?.Avg_ERC_Pct ?? null), fillOpacity: 0.28 })}
          onEachFeature={(f, l) => {
            probeOnClick(l)
            const p = f.properties
            l.bindPopup(`<b>${p.PSAName}</b> (${p.PSANationalCode})<br/>ERC ${Math.round(p.Avg_ERC ?? 0)} · ${Math.round(p.Avg_ERC_Pct ?? 0)}th percentile · trend ${p.Avg_ERC_Trend ?? '–'}<br/><small>NFDRS 3.0, updated ${p.EditDate ? format(p.EditDate, 'MMM d') : ''}</small>`)
          }}
        />
      )}
      {layers.redFlag && redFlagZones && (
        <GeoJSON
          key={`rfw-${alerts.dataUpdatedAt}`}
          data={redFlagZones}
          style={(f) => ({ color: '#E4572E', weight: 2, fillColor: f?.properties?.event === 'Red Flag Warning' ? '#E4572E' : '#E0A100', fillOpacity: 0.25 })}
          onEachFeature={(f, l) => {
            probeOnClick(l)
            const p = f.properties
            l.bindPopup(`<b>${p.event}</b><br/>${p.name}<br/>${p.ends ? `Ends ${format(new Date(p.ends), 'EEE MMM d, h a')}` : ''}<br/><small>${p.headline}</small>`)
          }}
        />
      )}
      {layers.perimeters && perims.data && (
        <GeoJSON
          key={`perim-${perims.dataUpdatedAt}`}
          data={perims.data}
          style={{ color: '#E4572E', weight: 1.5, fillColor: '#B7360D', fillOpacity: 0.35 }}
          onEachFeature={(f, l) => {
            probeOnClick(l)
            const p = f.properties
            l.bindPopup(`<b>${p.poly_IncidentName}</b><br/>${Math.round(p.poly_GISAcres ?? 0).toLocaleString()} acres · ${p.attr_PercentContained ?? '?'}% contained`)
          }}
        />
      )}
      {layers.fires && incidents.data?.map((i) => (
        <Marker key={`${i.name}-${i.lat}-${i.lng}`} position={[i.lat, i.lng]} icon={fireIcon((i.acres ?? 0) >= 1000)}>
          <Popup>
            <b className="font-display text-base">{i.name}</b> {i.type === 'RX' && <span className="text-xs">(prescribed)</span>}
            <br />
            {i.acres != null ? `${Math.round(i.acres).toLocaleString()} acres` : 'size unknown'} · {i.contained != null ? `${i.contained}% contained` : 'containment n/a'}
            <br />
            {i.discovered && <small>Discovered {format(i.discovered, 'MMM d')}</small>}
            {i.cause && <small> · {i.cause}</small>}
          </Popup>
        </Marker>
      ))}
    </>
  )
}
