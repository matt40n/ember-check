import { MapContainer, TileLayer, LayersControl, useMapEvents, Circle } from 'react-leaflet'
import { useEffect, type MutableRefObject, type ReactNode } from 'react'
import { useMap } from 'react-leaflet'
import type L from 'leaflet'

const NORCAL_CENTER: [number, number] = [40.0, -121.5]

/** Keep site pins above the polygon layers, which re-mount (and would otherwise stack on top) whenever the selection changes. */
function Panes({ mapRef }: { mapRef?: MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => {
    if (mapRef) mapRef.current = map
    // Fixed stacking so smaller areas always sit above the areas that contain them, whatever order the data arrives in
    for (const [name, z] of [['blm', 401], ['forests', 402], ['nps', 403], ['wilderness', 404], ['districts', 405], ['live', 410], ['sites', 450]] as const)
      if (!map.getPane(name)) map.createPane(name).style.zIndex = String(z)
    if (import.meta.env.DEV) (window as unknown as { __emberMap?: L.Map }).__emberMap = map
  }, [map, mapRef])
  return null
}

function ClickCatcher({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) })
  return null
}

export function MapView({ children, onClick, probe, mapRef }: { children: ReactNode; onClick: (lat: number, lng: number) => void; probe: { lat: number; lng: number } | null; mapRef?: MutableRefObject<L.Map | null> }) {
  return (
    <MapContainer center={NORCAL_CENTER} zoom={7} minZoom={4} className="h-full w-full" zoomControl={false} preferCanvas>
      <LayersControl position="bottomright">
        <LayersControl.BaseLayer checked name="Topo">
          <TileLayer
            className="basemap"
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, <a href="https://opentopomap.org">OpenTopoMap</a> · campgrounds: USFS, Recreation.gov, CA State Parks, OSM'
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Streets">
          <TileLayer className="basemap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' />
        </LayersControl.BaseLayer>
      </LayersControl>
      <Panes mapRef={mapRef} />
      <ClickCatcher onClick={onClick} />
      {probe && <Circle center={[probe.lat, probe.lng]} radius={400} pathOptions={{ color: '#F2C94C', weight: 2, fillOpacity: 0.15 }} />}
      {children}
    </MapContainer>
  )
}
