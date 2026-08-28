import { formatDistanceToNowStrict } from 'date-fns'
import { useFireAlerts } from '../api/nws'
import { useIncidents, usePerimeters } from '../api/nifc'

/**
 * One line describing whether the hourly live layers are actually live. A silently missing Red Flag
 * layer is the worst failure this app can have, so an upstream outage is said out loud.
 */
export function useLiveStatus(): { problem: string | null } {
  const alerts = useFireAlerts()
  const incidents = useIncidents()
  const perims = usePerimeters()
  const failing = [
    { q: alerts, name: 'Red Flag Warnings' },
    { q: incidents, name: 'active fires' },
    { q: perims, name: 'fire perimeters' },
  ].filter(({ q }) => q.isError)
  if (!failing.length) return { problem: null }
  const names = failing.map((f) => f.name).join(', ')
  const last = Math.max(...failing.map((f) => f.q.dataUpdatedAt))
  return {
    problem: last
      ? `Live ${names} unavailable — showing data from ${formatDistanceToNowStrict(last)} ago. Check weather.gov before lighting anything.`
      : `Live ${names} unavailable right now. Check weather.gov for Red Flag Warnings before lighting anything.`,
  }
}
