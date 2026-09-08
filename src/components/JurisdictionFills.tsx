import { useCallback, useMemo, useRef } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { Jurisdiction } from '../types'
import { STAGE_COLOR, STAGE_LABEL } from '../lib/stage'
import { matchUnit } from '../lib/probe'
import { countdownLabel, expiryText } from '../lib/time'
import { esc } from '../lib/html'

interface Props {
  fc: GeoJSON.FeatureCollection | undefined
  source: 'usfs' | 'blm' | 'nps'
  nameField: string
  all: Jurisdiction[]
  fillOpacity: number
  /** Draw nothing unless this unit is the current selection (BLM field-office jurisdictions cover whole regions, not BLM land) */
  hiddenUnlessSelected?: boolean
  selectedId: string | null
  onPick: (j: Jurisdiction, lat: number, lng: number) => void
  onMiss: (lat: number, lng: number) => void
}

/** Stage-colored fills over the agency's real boundary polygons. */
export function JurisdictionFills({ fc, source, nameField, all, fillOpacity, hiddenUnlessSelected = false, selectedId, onPick, onMiss }: Props) {
  const joined = useMemo(() => {
    if (!fc) return null
    // Largest polygons first so smaller units inside them are drawn (and clickable) on top
    const area = (g: GeoJSON.Geometry | null) => {
      if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return 0
      const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0])
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const r of rings) for (const [x, y] of r) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
      return (maxX - minX) * (maxY - minY)
    }
    return {
      type: 'FeatureCollection',
      features: fc.features
        .map((f) => {
          const name = String((f.properties as Record<string, unknown>)[nameField])
          const j = matchUnit(all, source, name)
          return { ...f, properties: { name, jid: j?.id ?? null, stage: j?.stage ?? null, area: area(f.geometry) } }
        })
        .sort((a, b) => b.properties.area - a.properties.area),
    } as GeoJSON.FeatureCollection
  }, [fc, all, source, nameField])
  // Latest handlers via refs: react-leaflet only reads onEachFeature at mount, so closures would otherwise go stale
  const onPickRef = useRef(onPick); onPickRef.current = onPick
  const onMissRef = useRef(onMiss); onMissRef.current = onMiss
  const style = useCallback((f?: GeoJSON.Feature) => {
        const stage = (f?.properties?.stage ?? null) as Jurisdiction['stage'] | null
        const sel = !!selectedId && f?.properties?.jid === selectedId
        if (hiddenUnlessSelected && !sel) return { opacity: 0, fillOpacity: 0, weight: 0, interactive: false }
        // The selected unit gets a heavier, brighter outline and a denser fill so it reads at a glance
        return {
          color: sel ? '#F3EBD8' : stage ? STAGE_COLOR[stage] : '#8A8F8B',
          weight: sel ? 5 : 2,
          opacity: sel ? 1 : 0.9,
          dashArray: sel ? undefined : source === 'blm' ? '8 6' : undefined,
          fillColor: stage ? STAGE_COLOR[stage] : '#8A8F8B',
          fillOpacity: sel ? Math.min(0.6, (stage ? fillOpacity : fillOpacity * 0.4) + 0.22) : stage ? fillOpacity : fillOpacity * 0.4,
        }
  }, [selectedId, hiddenUnlessSelected, source, fillOpacity])
  if (!joined) return null
  return (
    <GeoJSON
      key={source}
      pane={source === 'usfs' ? 'forests' : source}
      data={joined}
      style={style}
      onEachFeature={(f, l) => {
        const j = all.find((x) => x.id === f.properties.jid)
        const e = j ? expiryText(j.expires) : null
        l.bindTooltip(
          `<b>${esc(f.properties.name)}</b><br/>${j ? `${STAGE_LABEL[j.stage]} · ${countdownLabel(e!.days, e!.past)}` : 'No tracked order'}`,
          { sticky: true, direction: 'top', opacity: 0.95 },
        )
        l.on('click', (ev) => {
          const { lat, lng } = (ev as L.LeafletMouseEvent).latlng
          j ? onPickRef.current(j, lat, lng) : onMissRef.current(lat, lng)
        })
      }}
    />
  )
}
