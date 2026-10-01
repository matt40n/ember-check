/**
 * A national forest's alerts index (fs.usda.gov/r05/<forest>/alerts) — where a new or returning fire restriction
 * shows up first. scripts/verify-orders.ts reads it for every USFS entry and pages a human when a fire-restriction
 * alert is posted after the order we have on file took effect. Pure so it can be tested against a saved page.
 *
 * The index is a list of cards (markup as of the 2025–26 site redesign):
 *   <li class="usa-card usa-card--flag wfs-alert-flag information">
 *     <h3 class="alert_level--information"><a href="/r05/<forest>/alerts/<slug>"><span>Title</span></a></h3>
 *     … <strong>Alert Start Date:</strong> October 2, 2026 … <strong>Forest Order:</strong> #14-26-07 …
 * The "Alerts Key" legend at the top uses the same cards with no link and no date.
 */
import type { Jurisdiction } from '../types'
import { stripHtml } from './text'

/** `date` is ISO (YYYY-MM-DD); `path` is the alert page's path on fs.usda.gov */
export type Alert = { title: string; date: string; path: string }
type Entry = Pick<Jurisdiction, 'name' | 'sourceUrl' | 'effective'>

/** The alerts index of the forest whose site `sourceUrl` is on — an alert page, a newsroom release, anything under /r0X/<forest>/ */
export function alertsIndexFor(sourceUrl: string): string | null {
  const m = sourceUrl.match(/^(https?:\/\/(?:www\.)?fs\.usda\.gov\/r\d\d\/[a-z0-9-]+)\//)
  return m ? `${m[1]}/alerts` : null
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
/** "October 2, 2026" → "2026-10-02", by lookup: `new Date('October 2, 2026')` is local midnight, so the day it lands on depends on where the check runs */
function isoDate(month: string, day: string, year: string): string | null {
  const m = MONTHS.indexOf(month.toLowerCase()) + 1
  return m ? `${year}-${String(m).padStart(2, '0')}-${day.padStart(2, '0')}` : null
}
const pathOf = (url: string) => url.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase()

/** Every dated alert on a USFS alerts index, in page order. An index that yields none has changed its markup. */
export function alertCards(html: string): Alert[] {
  const out: Alert[] = []
  // One chunk per card, so a card without a start date can't borrow the next card's
  for (const card of html.split(/<li\b[^>]*\bwfs-alert-flag\b[^>]*>/).slice(1)) {
    const link = card.match(/<h3[^>]*>\s*<a[^>]*href="([^"]*\/alerts\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/)
    const start = card.match(/Alert Start Date:\s*(?:<[^>]+>\s*)*([A-Za-z]+)\s+(\d{1,2}),\s*(20\d\d)/)
    const title = link && stripHtml(link[2])?.replace(/\s+/g, ' ')
    const date = start && isoDate(start[1], start[2], start[3])
    if (link && title && date) out.push({ title, date, path: pathOf(link[1]) })
  }
  return out
}

/**
 * Titles about fire restrictions specifically. Most alerts on an index are road, trail and area closures (many of
 * them "<Name> Fire Closure" or "... Closure Order"), which never change whether a campfire is allowed.
 */
const FIRE_RESTRICTION = /campfire|fire restriction|fire ban|\bstage (?:1|2|i|ii)\b|restrictions? (?:(?:are|were|have been|has been) )?(?:lifted|rescinded)/i

/** The fire-restriction alerts on a USFS alerts index. */
export function fireAlerts(html: string): Alert[] {
  return alertCards(html).filter((a) => FIRE_RESTRICTION.test(a.title))
}

/**
 * The alerts worth a human read for this entry: those that start after its effective date. Left out:
 *   - the entry's own source alert, whatever start date the forest gives it
 *   - for an entry that covers one ranger district ("Humboldt-Toiyabe — Carson RD"), alerts whose title names
 *     only other districts or recreation areas — Humboldt-Toiyabe posts one alert per district
 * Dates compare as ISO strings, so the answer is the same on a Pacific laptop and in CI.
 */
export function newerFireAlerts(alerts: Alert[], entry: Entry): Alert[] {
  const { effective } = entry
  if (!effective) return []
  const own = pathOf(entry.sourceUrl)
  const district = entry.name.match(/— (.+) RD$/)?.[1].toLowerCase()
  const elsewhere = (title: string) => !!district && /ranger districts?|national recreation area/i.test(title) && !title.toLowerCase().includes(district)
  return alerts.filter((a) => a.date > effective && a.path !== own && !elsewhere(a.title))
}
