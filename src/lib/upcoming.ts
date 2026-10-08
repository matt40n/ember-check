/**
 * Everything we know that is about to change at a place: a fire-rule change the agency has announced, the date
 * an order runs out, the last bookable night of a campground's season, the day it reopens. People plan weekends
 * around these, so every surface that shows a place lists them (components/Upcoming.tsx), in date order.
 * A new kind of dated fact belongs here, not in a free-text note.
 */
import type { Jurisdiction } from '../types'
import { namesMatch } from './siteFire'

export type UpcomingItem = { date: string; text: string }
/** The dated part of a campground's Recreation.gov season window (see src/lib/season.ts) */
export type SeasonDates = { firstOpen?: string | null; seasonEnd?: string | null; seasonEndKnown?: boolean; nextOpen?: string | null }

const byDate = (a: UpcomingItem, b: UpcomingItem) => a.date.localeCompare(b.date)
const CAL = ' (Recreation.gov calendar)'
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Fire-rule changes ahead for an order: an announced change, else the order's own end date. */
export function upcomingForJurisdiction(j: Jurisdiction, today: string, { includeExpiry = true }: { includeExpiry?: boolean } = {}): UpcomingItem[] {
  const out: UpcomingItem[] = []
  const pending = j.scheduled && j.scheduled.on > today ? j.scheduled : null
  if (pending) out.push({ date: pending.on, text: pending.summary })
  // With a change already announced the order will not run to its printed end, so that date would mislead
  const restricted = j.stage !== 'none' && j.stage !== 'unknown'
  if (includeExpiry && !pending && restricted && j.expires !== 'until_rescinded' && j.expires >= today) {
    out.push({ date: j.expires, text: `Fire order${j.orderNumber ? ` ${j.orderNumber}` : ''} ends, unless lifted earlier or renewed` })
  }
  return out.sort(byDate)
}

/** Season dates ahead for a campground. Only a closing the calendar confirms is listed; "at least through" is not a date to plan on. */
export function upcomingForSite(s: SeasonDates, today: string): UpcomingItem[] {
  const out: UpcomingItem[] = []
  if (s.firstOpen && s.firstOpen > today) out.push({ date: s.firstOpen, text: `Opens for the season${CAL}` })
  if (s.seasonEnd && s.seasonEndKnown && s.seasonEnd >= today) out.push({ date: s.seasonEnd, text: `Last bookable night of the season${CAL}` })
  if (s.nextOpen && s.nextOpen > today) out.push({ date: s.nextOpen, text: `Reopens${CAL}` })
  return out.sort(byDate)
}

/** "Fri, Oct 2", with the year only when it is not this year. */
export function formatUpcomingDate(date: string, today: string): string {
  const d = new Date(date + 'T12:00:00Z')
  const year = date.slice(0, 4) === today.slice(0, 4) ? '' : `, ${date.slice(0, 4)}`
  return `${WEEKDAY[d.getUTCDay()]}, ${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}${year}`
}

/** Sign-reported dates for one site, matched loosely by name like siteNotes */
export function signDatesFor(j: Jurisdiction | null | undefined, siteName: string): { signClose: string | null; signOpen: string | null; signSource: string | null } {
  const hit = Object.entries(j?.siteDates ?? {}).find(([n]) => namesMatch(n, siteName))?.[1]
  return { signClose: hit?.closes ?? null, signOpen: hit?.opens ?? null, signSource: hit?.source ?? null }
}

export function upcomingForSignDates(j: Jurisdiction | null | undefined, siteName: string, today: string): UpcomingItem[] {
  const d = signDatesFor(j, siteName)
  const out: UpcomingItem[] = []
  if (d.signClose && d.signClose >= today) out.push({ date: d.signClose, text: `Closes for the season (${d.signSource})` })
  if (d.signOpen && d.signOpen > today) out.push({ date: d.signOpen, text: `Opens for the season (${d.signSource})` })
  return out.sort(byDate)
}

/** upcomingForJurisdiction plus what the planner found: a change applied by arrival, or an order that ran out */
export function upcomingForPlan(j: Jurisdiction, today: string, opts: { includeExpiry?: boolean } = {}): UpcomingItem[] {
  const out = upcomingForJurisdiction(j, today, opts)
  if (j.plan?.applied) out.push({ date: j.plan.applied.on, text: j.plan.applied.summary })
  if (j.plan?.ended) out.push({ date: j.plan.ended.expires, text: j.plan.ended.reason })
  return out.sort(byDate)
}

export type UpcomingGroups = { byArrival: UpcomingItem[]; during: UpcomingItem[]; later: UpcomingItem[] }
/** Before the trip (date on or before arrival), during it (through the last night), after. `last` is lastNight(window). */
export function groupUpcoming(items: UpcomingItem[], arrive: string, last: string): UpcomingGroups {
  return {
    byArrival: items.filter((i) => i.date <= arrive),
    during: items.filter((i) => i.date > arrive && i.date <= last),
    later: items.filter((i) => i.date > last),
  }
}
