import { useMemo } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { Jurisdiction } from '../types'
import { STAGE_COLOR, STAGE_LABEL } from '../lib/stage'
import { matchUnit } from '../lib/probe'
import { countdownLabel, expiryText } from '../lib/time'

interface Props {
  fc: GeoJSON.FeatureCollection | undefined
  source: 'usfs' | 'blm' | 'nps'
  nameField: string
  all: Jurisdiction[]
  fillOpacity: number
  selectedId: string | null
  onPick: (j: Jurisdiction, lat: number, lng: number) => void
  onMiss: (lat: number, lng: number) => void
}

/** Stage-colored fills over the agency's real boundary polygons. */
export function JurisdictionFills({ fc, source, nameField, all, fillOpacity, selectedId, onPick, onMiss }: Props) {
  const joined = useMemo(() => {
    if (!fc) return null
    return {
      type: 'FeatureCollection',
      features: fc.features.map((f) => {
        const name = String((f.properties as Record<string, unknown>)[nameField])
        const j = matchUnit(all, source, name)
        return { ...f, properties: { name, jid: j?.id ?? null, stage: j?.stage ?? null } }
      }),
    } as GeoJSON.FeatureCollection
  }, [fc, all, source, nameField])
  if (!joined) return null
  return (
    <GeoJSON
      key={`${source}-${selectedId}`}
      data={joined}
      style={(f) => {
        const stage = f?.properties.stage as Jurisdiction['stage'] | null
        const sel = f?.properties.jid === selectedId
        return {
          color: stage ? STAGE_COLOR[stage] : '#8A8F8B',
          weight: sel ? 3.5 : source === 'blm' ? 2 : 2,
          dashArray: source === 'blm' ? '8 6' : undefined,
          fillColor: stage ? STAGE_COLOR[stage] : '#8A8F8B',
          fillOpacity: stage ? fillOpacity : fillOpacity * 0.4,
        }
      }}
      onEachFeature={(f, l) => {
        const j = all.find((x) => x.id === f.properties.jid)
        const e = j ? expiryText(j.expires) : null
        l.bindTooltip(
          `<b>${f.properties.name}</b><br/>${j ? `${STAGE_LABEL[j.stage]} · ${countdownLabel(e!.days, e!.past)}` : 'No tracked order'}`,
          { sticky: true, direction: 'top', opacity: 0.95 },
        )
        l.on('click', (ev) => {
          const { lat, lng } = (ev as L.LeafletMouseEvent).latlng
          j ? onPick(j, lat, lng) : onMiss(lat, lng)
        })
      }}
    />
  )
}
