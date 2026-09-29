/**
 * Season dates from Recreation.gov's availability calendar — the one online source with an exact closing date.
 * A campground's bookable days simply stop (Hat Creek ends Oct 10 and resumes Apr 24) or turn "Closed" for the
 * winter; either way the last bookable night is the closing date we show. The forest's own page only says
 * "April – October". Pure, so scripts/enrich-ridb.ts runs it at enrichment time and tests can exercise it.
 *
 * We report the last *bookable* night, which can run a day or three ahead of the physical closure posted at the
 * campground (Hat Creek: calendar ends Oct 10, sign says Oct 13). Erring early is the point: nobody plans a
 * weekend around a campground that turns out to be shut.
 */
export type DayStatus = 'open' | 'closed' | 'nyr' | 'unknown'
export type SeasonWindow = {
  /** First open day of the season in progress, or of the next one if nothing is open today */
  firstOpen: string | null
  /** Last open day of that season */
  seasonEnd: string | null
  /** true when a closed or absent day follows seasonEnd; false when unreleased dates or the 12-month window cut it off */
  seasonEndKnown: boolean
  /** First open day of the season after that, if the calendar already shows it */
  nextOpen: string | null
  /** Last open day of a season that already ended before the check date */
  prevEnd: string | null
}
type MonthResponse = { campsites?: Record<string, { availabilities: Record<string, string> }> } | null

/** A gap of fewer non-open days than this (maintenance, a flooded loop) does not end the season. */
const GAP_DAYS = 7
const P = ' (Recreation.gov calendar)'
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayNumber = (d: string) => Math.round(Date.parse(d + 'T00:00:00Z') / 86_400_000)
const nextDay = (d: string) => new Date((dayNumber(d) + 1) * 86_400_000).toISOString().slice(0, 10)

/**
 * Fold one month's per-campsite statuses into one status per day: open if any site can be used that day
 * ("Available", "Reserved", "Not Reservable" = first-come, first-served), closed if every site is Closed or
 * Not Available, nyr if nothing that day has been released yet.
 */
export function dayStatuses(av: MonthResponse): Record<string, DayStatus> {
  const rank: Record<DayStatus, number> = { open: 3, closed: 2, nyr: 1, unknown: 0 }
  const out: Record<string, DayStatus> = {}
  for (const c of Object.values(av?.campsites ?? {})) {
    for (const [day, st] of Object.entries(c.availabilities)) {
      const d = day.slice(0, 10)
      const s: DayStatus = st === 'NYR' ? 'nyr' : st === 'Closed' || st === 'Not Available' ? 'closed' : 'open'
      if (!out[d] || rank[s] > rank[out[d]]) out[d] = s
    }
  }
  return out
}

/** The open season around the check date: runs of open days, bridging gaps shorter than GAP_DAYS. */
export function seasonWindow(days: Record<string, DayStatus>, asOf: string, windowEnd: string): SeasonWindow {
  const open = Object.keys(days).filter((d) => days[d] === 'open').sort()
  const runs: { first: string; last: string }[] = []
  for (const d of open) {
    const cur = runs[runs.length - 1]
    if (cur && dayNumber(d) - dayNumber(cur.last) <= GAP_DAYS) cur.last = d
    else runs.push({ first: d, last: d })
  }
  const endKnown = (run: { last: string }) => {
    const after = nextDay(run.last)
    if (after > windowEnd) return false
    const st = days[after]
    return st !== 'nyr' && st !== 'unknown'
  }
  const i = runs.findIndex((r) => r.last >= asOf)
  const cur = i >= 0 ? runs[i] : null
  const prev = [...runs].reverse().find((r) => r.last < asOf) ?? null
  return {
    firstOpen: cur?.first ?? null,
    seasonEnd: cur?.last ?? null,
    seasonEndKnown: cur ? endKnown(cur) : false,
    nextOpen: i >= 0 ? (runs[i + 1]?.first ?? null) : null,
    prevEnd: prev?.last ?? null,
  }
}

/** One honest sentence for the card, relative to the check date. */
export function seasonPhrase(w: SeasonWindow, asOf: string, windowEnd: string): string {
  const fmt = (d: string) => `${MONTH[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}${d.slice(0, 4) === asOf.slice(0, 4) ? '' : `, ${d.slice(0, 4)}`}`
  if (!w.firstOpen || !w.seasonEnd) return w.prevEnd ? `Closed since ${fmt(w.prevEnd)}; next season not posted yet${P}` : `Closed for the next 12 months${P}`
  const tail = w.seasonEndKnown ? `through ${fmt(w.seasonEnd)}` : w.seasonEnd === windowEnd ? `through at least ${fmt(w.seasonEnd)}` : `through ${fmt(w.seasonEnd)}; later dates not released yet`
  if (w.firstOpen <= asOf) {
    if (w.seasonEndKnown) return `Open ${tail}; ${w.nextOpen ? `reopens ${fmt(w.nextOpen)}` : 'next season not posted yet'}${P}`
    if (w.seasonEnd === windowEnd && dayNumber(w.seasonEnd) - dayNumber(w.firstOpen) >= 330) return `Open year-round${P}`
    return `Open now, ${tail}${P}`
  }
  if (w.prevEnd) return `Closed since ${fmt(w.prevEnd)}; reopens ${fmt(w.firstOpen)}${P}`
  return `Opens ${fmt(w.firstOpen)}, ${tail}${P}`
}
