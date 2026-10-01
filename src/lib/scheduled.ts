/**
 * Scheduled changes. Agencies usually announce a change a day or two ahead ("fire restrictions lift effective
 * Friday"). An entry keeps today's rules in its own fields and carries the announced change in `scheduled`;
 * this swaps it in on the day, in the visitor's browser, so the map is right at midnight without a deploy and
 * never early. Before the date, src/lib/upcoming.ts lists the change wherever the entry is shown.
 */
import type { Jurisdiction } from '../types'

/** Today's calendar date in California (YYYY-MM-DD). Orders take effect on Pacific dates, wherever the visitor is. */
export function pacificToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** Apply every scheduled change whose date has arrived; a field the change sets to undefined is dropped. */
export function applyScheduled(all: Jurisdiction[], today: string): Jurisdiction[] {
  return all.map((j) => {
    if (!j.scheduled || today < j.scheduled.on) return j
    const { scheduled, ...rest } = j
    return { ...rest, ...scheduled.change }
  })
}
