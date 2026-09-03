import { useMemo } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { Jurisdiction } from '../types'
import { exemptWildernessIndex } from '../lib/probe'
import type { BoundaryFC } from '../api/boundaries'

/** Wilderness boundaries, colored by whether the enclosing order exempts them from the backcountry-fire ban. */
export function WildernessLayer({ fc, all, onClick }: { fc: BoundaryFC | undefined; all: Jurisdiction[]; onClick: (lat: number, lng: number) => void }) {
  const index = useMemo(() => exemptWildernessIndex(all), [all])
  if (!fc) return null
  return (
    <GeoJSON
      pane="wilderness"
      data={fc}
      style={(f) => {
        const exempt = index.has(String(f?.properties.wildernessname))
        return exempt
          ? { color: '#9BE7A0', weight: 2.5, fillColor: '#4CAF50', fillOpacity: 0.35, dashArray: undefined }
          : { color: '#F3EBD8', weight: 1.5, fillColor: '#10170F', fillOpacity: 0.25, dashArray: '2 4' }
      }}
      onEachFeature={(f, l) => {
        const name = String(f.properties.wildernessname)
        const by = index.get(name)
        l.bindTooltip(
          by
            ? `<b>${name}</b><br/>Campfires allowed with a CA Campfire Permit<br/><small>exemption in ${by.map((j) => `${j.name} order${j.orderNumber ? ` ${j.orderNumber}` : ''}`).join('; ')}${by[0].wildernessNote ? `<br/>${by[0].wildernessNote}` : ''}</small>`
            : `<b>${name}</b><br/>No campfire exemption — enclosing order applies`,
          { sticky: true, direction: 'top', opacity: 0.95 },
        )
        l.on('click', (ev) => {
          const { lat, lng } = (ev as L.LeafletMouseEvent).latlng
          onClick(lat, lng)
        })
      }}
    />
  )
}
