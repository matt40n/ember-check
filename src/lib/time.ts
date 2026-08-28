import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export function expiryText(expires: string | 'until_rescinded', now = new Date()) {
  if (expires === 'until_rescinded') return { label: 'Until rescinded', days: null as number | null, past: false }
  const d = parseISO(expires)
  const days = differenceInCalendarDays(d, now)
  return {
    label: format(d, 'MMM d, yyyy'),
    days,
    past: days < 0,
  }
}

export function countdownLabel(days: number | null, past: boolean) {
  if (days === null) return 'no set end date'
  if (past) return `expired ${-days}d ago — likely renewed`
  if (days === 0) return 'expires today'
  if (days === 1) return 'expires tomorrow'
  return `lifts in ${days} days`
}
