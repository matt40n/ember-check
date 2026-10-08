/**
 * Trip window: the dates a visitor is planning for. Everything here is pure and works on Pacific calendar-day
 * strings (YYYY-MM-DD), compared lexically. See docs/superpowers/specs/2026-10-07-plan-for-a-date-design.md.
 */
import { formatUpcomingDate } from './upcoming'

export type TripWindow = { arrive: string; nights: number }
export const MAX_NIGHTS = 14
export const MAX_DAYS_AHEAD = 365

const toDayNumber = (iso: string) => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000)
const fromDayNumber = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10)
/** 0 = Sunday … 6 = Saturday, for a calendar date (no timezone involved) */
const weekday = (iso: string) => new Date(iso + 'T12:00:00Z').getUTCDay()
const ISO = /^\d{4}-\d{2}-\d{2}$/

export function addDays(iso: string, n: number): string { return fromDayNumber(toDayNumber(iso) + n) }
export function lastNight(w: TripWindow): string { return addDays(w.arrive, w.nights - 1) }
export function todayWindow(today: string): TripWindow { return { arrive: today, nights: 1 } }
export function isTodayWindow(w: TripWindow, today: string): boolean { return w.arrive === today && w.nights === 1 }

/** Mon–Fri: the coming Friday, two nights. Sat/Sun: what is left of this weekend, one night from today. */
export function thisWeekend(today: string): TripWindow {
  const d = weekday(today)
  if (d === 6 || d === 0) return { arrive: today, nights: 1 }
  return { arrive: addDays(today, (5 - d + 7) % 7), nights: 2 }
}
/** The Friday after this weekend's Friday (or after today's weekend), two nights. */
export function nextWeekend(today: string): TripWindow {
  const d = weekday(today)
  const thisFriday = d === 6 ? addDays(today, -1) : d === 0 ? addDays(today, -2) : addDays(today, (5 - d + 7) % 7)
  return { arrive: addDays(thisFriday, 7), nights: 2 }
}

export function parseWindow(search: string, today: string): TripWindow {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const arrive = q.get('arrive') ?? ''
  const nights = q.has('nights') ? Number(q.get('nights')) : 1
  const valid = ISO.test(arrive) && !isNaN(toDayNumber(arrive)) && fromDayNumber(toDayNumber(arrive)) === arrive
    && arrive >= today && toDayNumber(arrive) - toDayNumber(today) <= MAX_DAYS_AHEAD
    && Number.isInteger(nights) && nights >= 1 && nights <= MAX_NIGHTS
  return valid ? { arrive, nights } : todayWindow(today)
}
export function formatWindow(w: TripWindow, today: string): string {
  return isTodayWindow(w, today) ? '' : `?arrive=${w.arrive}&nights=${w.nights}`
}
export function describeWindow(w: TripWindow, today: string): string {
  const a = formatUpcomingDate(w.arrive, today)
  if (w.nights === 1) return `${a} (1 night)`
  return `${a} – ${formatUpcomingDate(addDays(w.arrive, w.nights), today)}`
}
