/**
 * Trip window: the dates a visitor is planning for. Everything here is pure and works on Pacific calendar-day
 * strings (YYYY-MM-DD), compared lexically. See docs/superpowers/specs/2026-10-07-plan-for-a-date-design.md.
 */
import type { Jurisdiction, PlanMeta } from '../types'
import { applyScheduled } from './scheduled'
import { formatUpcomingDate, type SeasonDates } from './upcoming'

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

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortDate = (iso: string) => `${MONTH[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}`

/**
 * The entries as they stand on the arrival day, tagged with what changes or ends during the stay. Today's window
 * is exactly applyScheduled(raw, today) with no tags, so the ordinary map is unchanged.
 */
export function planJurisdictions(raw: Jurisdiction[], w: TripWindow, today: string): Jurisdiction[] {
  const resolved = applyScheduled(raw, w.arrive)
  if (isTodayWindow(w, today)) return resolved
  const last = lastNight(w)
  return resolved.map((j, i) => {
    const before = raw[i]
    const plan: PlanMeta = {}
    const sch = before.scheduled
    if (sch && sch.on > today && sch.on <= w.arrive) plan.applied = { on: sch.on, summary: sch.summary }
    if (sch && sch.on > w.arrive && sch.on <= last) plan.changesDuring = { on: sch.on, summary: sch.summary }
    const restricted = j.stage !== 'none' && j.stage !== 'unknown'
    if (restricted && j.expires !== 'until_rescinded') {
      if (j.expires < w.arrive) {
        plan.ended = { expires: j.expires, orderNumber: j.orderNumber, reason: `Order${j.orderNumber ? ` ${j.orderNumber}` : ''} ends ${shortDate(j.expires)}. Rules after that are not announced.` }
        return { ...j, stage: 'unknown', campfiresDeveloped: 'unknown', campfiresDispersed: 'unknown', stoves: 'unknown', smoking: 'unknown', wildernessExempt: undefined, plan }
      }
      if (j.expires >= w.arrive && j.expires < last) plan.endsDuring = j.expires
    }
    return Object.keys(plan).length ? { ...j, plan } : j
  })
}

export type SiteSeason = SeasonDates & { season?: string | null; signClose?: string | null; signOpen?: string | null; signSource?: string | null }
export type SiteStatus =
  | { kind: 'open'; text: string }
  | { kind: 'closes'; date: string; night: number; text: string }
  | { kind: 'opens'; date: string; text: string }
  | { kind: 'closed'; reopens?: string; text: string }
  | { kind: 'unknown'; hint?: string; text: string }

const CAL = ' (Recreation.gov calendar)'
const MONTHS_FULL = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth']

/** "April – October" → { start: 4, end: 10 }; anything but two plain month names → null (shown verbatim instead) */
export function monthRange(season: string | null | undefined): { start: number; end: number } | null {
  const m = season?.trim().match(/^([A-Za-z]+)\s*[–-]\s*([A-Za-z]+)$/)
  if (!m) return null
  const start = MONTHS_FULL.indexOf(m[1].toLowerCase()) + 1, end = MONTHS_FULL.indexOf(m[2].toLowerCase()) + 1
  return start && end ? { start, end } : null
}

const nightsText = (n: number) => (n === 1 ? '' : n === 2 ? ' both nights' : ` all ${n} nights`)
const nightOf = (date: string, w: TripWindow) => toDayNumber(date) - toDayNumber(w.arrive) + 1

/**
 * Open / closes / opens / closed / unknown for the whole stay. A Recreation.gov calendar wins; a sign-reported date
 * fills in when there is no calendar; the forest's month range is only ever a hint.
 */
export function siteStatusForPlan(s: SiteSeason, w: TripWindow, today: string): SiteStatus {
  const last = lastNight(w)
  const fmt = (d: string) => formatUpcomingDate(d, today)
  const hasCalendar = !!(s.firstOpen || s.seasonEnd)
  const src = hasCalendar ? CAL : s.signSource ? ` (${s.signSource})` : ''
  // The season window to judge against: the calendar's, else the sign's. Two different conventions meet here:
  // the calendar's seasonEnd is the LAST BOOKABLE NIGHT; a sign's "closes Oct 13" names the FIRST CLOSED DAY.
  // `end` is always the last available night.
  const firstOpen = hasCalendar ? s.firstOpen ?? null : s.signOpen ?? null
  const end = hasCalendar ? s.seasonEnd ?? null : s.signClose ? addDays(s.signClose, -1) : null
  const endKnown = hasCalendar ? !!s.seasonEndKnown : !!s.signClose
  const reopen = hasCalendar ? s.nextOpen ?? null : null
  if (!hasCalendar && !s.signClose && !s.signOpen) {
    const range = monthRange(s.season)
    if (!s.season) return { kind: 'unknown', text: 'No season dates posted' }
    if (range) {
      const inRange = (iso: string) => { const m = +iso.slice(5, 7); return range.start <= range.end ? m >= range.start && m <= range.end : m >= range.start || m <= range.end }
      const outside = !inRange(w.arrive) || !inRange(last)
      return outside
        ? { kind: 'unknown', hint: `Season listed as ${s.season}; your dates fall outside it`, text: `Season not posted; the forest lists ${s.season} (your dates fall outside it)` }
        : { kind: 'unknown', text: `Season not posted; the forest lists ${s.season}` }
    }
    return { kind: 'unknown', text: `Season not posted; the forest lists ${s.season}` }
  }
  // closed: season ended before arrival and nothing reopens by the last night
  if (end && endKnown && end < w.arrive && !(reopen && reopen <= last)) {
    return reopen
      ? { kind: 'closed', reopens: reopen, text: `Closed for the season; reopens ${fmt(reopen)}${src}` }
      : { kind: 'closed', text: `Closed for the season; next season not posted yet${src}` }
  }
  // opens: the first bookable night (this season's or the next) is after arrival but inside the stay
  const opening = end && endKnown && end < w.arrive ? reopen : firstOpen && firstOpen > w.arrive ? firstOpen : null
  if (opening && opening > w.arrive && opening <= last) {
    return { kind: 'opens', date: opening, text: `Opens ${fmt(opening)} — your ${ORDINAL[nightOf(opening, w) - 1]} night${src}` }
  }
  if (firstOpen && firstOpen > last) return { kind: 'closed', reopens: firstOpen, text: `Closed for the season; reopens ${fmt(firstOpen)}${src}` }
  // closes: available on arrival but the confirmed end is before the last night
  if (end && endKnown && end < last) {
    if (hasCalendar) return { kind: 'closes', date: end, night: nightOf(end, w), text: `Closed for the season after ${fmt(end)} — your ${ORDINAL[nightOf(end, w) - 1]} night${src}` }
    const closeDay = addDays(end, 1) // the sign's own date
    return { kind: 'closes', date: closeDay, night: nightOf(closeDay, w), text: `Closes for the season ${fmt(closeDay)} — your ${ORDINAL[nightOf(closeDay, w) - 1]} night${src}` }
  }
  // open: every night is within the released window
  if (end && last <= end) return { kind: 'open', text: `Open${nightsText(w.nights)}${src}` }
  // past the released days with no confirmed end
  if (end && !endKnown && last > end) return { kind: 'unknown', text: `Calendar released through ${fmt(end)} only; later nights not posted yet${CAL}` }
  return { kind: 'unknown', text: 'No season dates posted' }
}
