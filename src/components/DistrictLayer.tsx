import { GeoJSON } from 'react-leaflet'
import type { BoundaryFC } from '../api/boundaries'

/** Ranger district boundaries as thin outlines with a name tooltip. Non-interactive fill so clicks pass through. */
const STYLE = { color: '#F3EBD8', weight: 0.8, opacity: 0.55, fillOpacity: 0, dashArray: '1 3' }
export function DistrictLayer({ fc }: { fc: BoundaryFC | undefined }) {
  if (!fc) return null
  return (
    <GeoJSON
      pane="districts"
      data={fc}
      style={STYLE}
      interactive={false}
    />
  )
}
