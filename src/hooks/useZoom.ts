import { useState } from 'react'
import { useMapEvents } from 'react-leaflet'

export function useZoom() {
  const map = useMapEvents({ zoomend: () => setZ(map.getZoom()) })
  const [z, setZ] = useState(map.getZoom())
  return z
}
