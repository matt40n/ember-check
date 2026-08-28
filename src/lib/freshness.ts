import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Jurisdiction } from '../types'
import type { RecSite } from '../api/boundaries'

/** How long a hand-verified order is trusted before it drops to "Unverified". */
export const ORDER_MAX_AGE_DAYS = 14

export type Freshness =
  | { status: 'current'; note: null }
  | { status: 'undated'; note: string }
  | { status: 'outdated'; note: string }

const YEAR = /\b(20[12]\d)\b/g

/** Newest year mentioned anywhere in the site's free text, or null. */
export function latestYearIn(...fields: (string | null | undefined)[]): number | null {
  let max: number | null = null
  for (const f of fields) for (const m of (f ?? '').matchAll(YEAR)) max = Math.max(max ?? 0, Number(m[1]))
  return max
}

/** Site text that names an older year is stale. Text with no year can't be trusted either — just less loudly. */
export function siteFreshness(s: RecSite, now = new Date()): Freshness {
  const y = latestYearIn(s.season, s.description, s.fee, s.restrictions, s.reservations, s.hours, s.openSource?.kind === 'usfs-page' ? (s.openSource.pageUpdated ?? s.openSource.checkedOn) : null)
  const cur = now.getFullYear()
  if (y === null) return { status: 'undated', note: 'USFS site page carries no date; fire rules above come from the forest order, not this page.' }
  if (y < cur) return { status: 'outdated', note: `USFS site page last dated ${y} — season, status and fees may be stale. Fire rules above come from the forest order, not this page.` }
  return { status: 'current', note: null }
}

/** Why an order entry can no longer be trusted, or null if it's still fresh. */
export function orderStaleReason(j: Jurisdiction, now = new Date()): string | null {
  const age = differenceInCalendarDays(now, parseISO(j.verifiedOn))
  if (age > ORDER_MAX_AGE_DAYS) return `Last verified ${age} days ago (${j.verifiedOn}); orders change faster than that in fire season.`
  if (j.expires !== 'until_rescinded' && differenceInCalendarDays(parseISO(j.expires), now) < 0)
    return `Order ${j.orderNumber ?? ''} expired ${j.expires}; a replacement has probably been issued.`
  return null
}

/**
 * Downgrade stale entries to Unverified so every fill, sign and pin verdict shows grey instead of a
 * confident-but-wrong answer. Original values are kept on `stale.original` for the sign's footnote.
 */
export function applyFreshness(all: Jurisdiction[], now = new Date()): Jurisdiction[] {
  return all.map((j) => {
    const reason = orderStaleReason(j, now)
    if (!reason) return j
    return {
      ...j,
      stage: 'unknown',
      campfiresDeveloped: 'unknown',
      campfiresDispersed: 'unknown',
      stoves: 'unknown',
      smoking: 'unknown',
      wildernessExempt: undefined,
      stale: { reason, original: j },
    }
  })
}
