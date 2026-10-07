# Plan for a Date (trip window) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor pick the dates of a trip (arrival + nights) and see every fill, pin, card and panel as it will be on those dates, from announced facts only, with honest "not announced" states.

**Architecture:** A pure module `src/lib/plan.ts` turns the raw restriction entries into the state on the arrival day (via the existing `applyScheduled`) and tags each entry with what changes or ends during the stay; a second pure function decides a campground's open/closed/opens/closes/unknown status for the stay from its Recreation.gov season window and sign-reported dates. A tiny React context (`usePlanWindow`) holds the window, mirrors it to the page address, and replaces every `pacificToday()` call in components. Live layers are today-only and switch off while planning.

**Tech Stack:** TypeScript, React 19, Vite, Leaflet via react-leaflet, Tailwind 4, Bun test (`bun test` runs first in `bun run build`), date-fns (already a dependency).

**Spec:** `docs/superpowers/specs/2026-10-07-plan-for-a-date-design.md`

## Global Constraints

- All dates are `YYYY-MM-DD` strings on the Pacific calendar; compare them lexically, never through `new Date(iso)` (UTC-midnight trap noted in `src/lib/season.ts`).
- Arrival is limited to today through 365 days out; nights 1–14; anything else falls back to Today silently.
- "Today" (`{ arrive: today, nights: 1 }`) must produce output identical to the current build: no banner, no grouping, live layers on, every entry byte-for-byte equal to `applyScheduled(raw, today)`.
- Nothing predicted: an order past its printed end is `unknown` with the wording `Order <n> ends <date>. Rules after that are not announced.`; a campground beyond its released calendar is `unknown`.
- `scripts/*`, `verify-orders`, `status.json` and the data pipeline are not modified. `src/data/restrictions.ts` changes only to add `siteDates` to `usfs-lassen`.
- Every `verifiedOn`/`id: '...'` text contract in `restrictions.ts` stays intact (the verify bot rewrites that file by regex anchored on `id: '<id>',`).
- Copy: dates render through `formatUpcomingDate` ("Fri, Oct 9", year only when not this year). The Recreation.gov suffix is exactly ` (Recreation.gov calendar)`.
- Tests use real code, no mocks; new modules are pure and import nothing from React or Leaflet.

## Review Focus

1. A stay that starts today but spans a scheduled change (arrive today, 2 nights, change tomorrow): today's rules must show, with "Changes Sat, Oct 10" on the panel and card. Test added in Task 2.
2. A link with a past or malformed `arrive` (`?arrive=2026-01-01`, `?arrive=banana&nights=3`): the planner must open on Today, not crash or show a stale date. Test added in Task 1.
3. A campground whose calendar ends inside the stay but whose USFS page still says "open" today: the card must say it closes, with the night number, and the pin must stay visible (it is open on arrival). Test added in Task 3.
4. A campground with no calendar and a month range like "Mid-May - October" (not two plain month names): must be `unknown` with the text shown verbatim, never parsed into a date. Test added in Task 3.
5. The year boundary: "Next weekend" chosen on Mon Dec 28, 2026 must land on Fri Jan 8, 2027, and dates in 2027 must carry the year in copy. Test added in Task 1.

---

### Task 1: Trip window types, presets and address format

**Files:**
- Create: `src/lib/plan.ts`
- Test: `src/lib/plan.test.ts`

**Interfaces:**
- Consumes: nothing new (`pacificToday` from `src/lib/scheduled.ts` is only used by callers, not here).
- Produces:
  ```ts
  export type TripWindow = { arrive: string; nights: number }
  export const MAX_NIGHTS = 14
  export const MAX_DAYS_AHEAD = 365
  export function addDays(iso: string, n: number): string
  export function lastNight(w: TripWindow): string            // arrive + nights - 1
  export function todayWindow(today: string): TripWindow       // { arrive: today, nights: 1 }
  export function isTodayWindow(w: TripWindow, today: string): boolean
  export function thisWeekend(today: string): TripWindow
  export function nextWeekend(today: string): TripWindow
  export function parseWindow(search: string, today: string): TripWindow   // falls back to todayWindow(today)
  export function formatWindow(w: TripWindow, today: string): string       // '' for Today, else '?arrive=YYYY-MM-DD&nights=N'
  export function describeWindow(w: TripWindow, today: string): string     // 'Fri, Oct 9 – Sun, Oct 11' ; 'Fri, Oct 9 (1 night)' for one night
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/plan.test.ts
import { describe, expect, test } from 'bun:test'
import { addDays, describeWindow, formatWindow, isTodayWindow, lastNight, nextWeekend, parseWindow, thisWeekend, todayWindow } from './plan'

const TODAY = '2026-10-07' // a Wednesday

describe('day arithmetic', () => {
  test('addDays crosses month and year ends as plain calendar days', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09') // DST day: still one calendar day
  })
  test('lastNight is arrive plus nights minus one', () => {
    expect(lastNight({ arrive: '2026-10-09', nights: 2 })).toBe('2026-10-10')
    expect(lastNight({ arrive: '2026-10-09', nights: 1 })).toBe('2026-10-09')
  })
  test('todayWindow is one night starting today and nothing else counts as Today', () => {
    expect(todayWindow(TODAY)).toEqual({ arrive: TODAY, nights: 1 })
    expect(isTodayWindow({ arrive: TODAY, nights: 1 }, TODAY)).toBe(true)
    expect(isTodayWindow({ arrive: TODAY, nights: 2 }, TODAY)).toBe(false)
    expect(isTodayWindow({ arrive: '2026-10-08', nights: 1 }, TODAY)).toBe(false)
  })
})

describe('weekend presets (Pacific calendar)', () => {
  test('midweek: this weekend is the coming Friday, two nights; next weekend the Friday after', () => {
    expect(thisWeekend('2026-10-07')).toEqual({ arrive: '2026-10-09', nights: 2 })
    expect(nextWeekend('2026-10-07')).toEqual({ arrive: '2026-10-16', nights: 2 })
  })
  test('Friday: this weekend starts today', () => {
    expect(thisWeekend('2026-10-09')).toEqual({ arrive: '2026-10-09', nights: 2 })
    expect(nextWeekend('2026-10-09')).toEqual({ arrive: '2026-10-16', nights: 2 })
  })
  test('Saturday and Sunday: this weekend is what is left of it', () => {
    expect(thisWeekend('2026-10-10')).toEqual({ arrive: '2026-10-10', nights: 1 })
    expect(thisWeekend('2026-10-11')).toEqual({ arrive: '2026-10-11', nights: 1 })
    expect(nextWeekend('2026-10-11')).toEqual({ arrive: '2026-10-16', nights: 2 })
  })
  test('next weekend from the last Monday of the year lands in January', () => {
    expect(nextWeekend('2026-12-28')).toEqual({ arrive: '2027-01-08', nights: 2 })
  })
})

describe('address round trip', () => {
  test('Today formats to nothing; a window formats to arrive and nights', () => {
    expect(formatWindow(todayWindow(TODAY), TODAY)).toBe('')
    expect(formatWindow({ arrive: '2026-10-09', nights: 2 }, TODAY)).toBe('?arrive=2026-10-09&nights=2')
  })
  test('parses its own output', () => {
    expect(parseWindow('?arrive=2026-10-09&nights=2', TODAY)).toEqual({ arrive: '2026-10-09', nights: 2 })
  })
  test('a past date, garbage, too many nights or too far ahead all fall back to Today', () => {
    expect(parseWindow('?arrive=2026-01-01&nights=2', TODAY)).toEqual(todayWindow(TODAY))
    expect(parseWindow('?arrive=banana&nights=3', TODAY)).toEqual(todayWindow(TODAY))
    expect(parseWindow('?arrive=2026-10-09&nights=40', TODAY)).toEqual(todayWindow(TODAY))
    expect(parseWindow('?arrive=2027-10-20&nights=2', TODAY)).toEqual(todayWindow(TODAY))
    expect(parseWindow('', TODAY)).toEqual(todayWindow(TODAY))
  })
  test('missing nights means one night', () => {
    expect(parseWindow('?arrive=2026-10-09', TODAY)).toEqual({ arrive: '2026-10-09', nights: 1 })
  })
})

describe('describeWindow', () => {
  test('names both ends, with the year only when it is not this year', () => {
    expect(describeWindow({ arrive: '2026-10-09', nights: 2 }, TODAY)).toBe('Fri, Oct 9 – Sun, Oct 11')
    expect(describeWindow({ arrive: '2026-10-09', nights: 1 }, TODAY)).toBe('Fri, Oct 9 (1 night)')
    expect(describeWindow({ arrive: '2027-01-08', nights: 2 }, TODAY)).toBe('Fri, Jan 8, 2027 – Sun, Jan 10, 2027')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test src/lib/plan.test.ts`
Expected: FAIL with `Cannot find module './plan'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/plan.ts
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
```

Note: `describeWindow` ends on the morning of departure (`arrive + nights`), which is the "Sun, Oct 11" a visitor expects for a two-night stay from Friday.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test src/lib/plan.test.ts`
Expected: PASS, 12 tests. Also run `./node_modules/.bin/tsc -p .` → no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/plan.ts src/lib/plan.test.ts
git commit -m "plan: trip window type, weekend presets and address round trip"
```

---

### Task 2: Resolve fire rules for a window

**Files:**
- Modify: `src/lib/plan.ts`
- Modify: `src/types.ts` (add `plan?: PlanMeta` next to `stale?`)
- Test: `src/lib/plan.test.ts`

**Interfaces:**
- Consumes: `applyScheduled(all, date)` from `src/lib/scheduled.ts`; `TripWindow`, `lastNight` from Task 1.
- Produces:
  ```ts
  // src/types.ts
  export type PlanMeta = {
    /** A scheduled change that took effect between today and arrival (so the card can say why it differs from today) */
    applied?: { on: string; summary: string }
    /** A scheduled change that lands after arrival, on or before the last night */
    changesDuring?: { on: string; summary: string }
    /** The order's printed end date falls inside the stay (after arrival, before the last night) */
    endsDuring?: string
    /** The order ran out before arrival; the entry has been set to unknown */
    ended?: { expires: string; orderNumber?: string; reason: string }
  }
  // Jurisdiction gets:  plan?: PlanMeta
  // src/lib/plan.ts
  export function planJurisdictions(raw: Jurisdiction[], w: TripWindow, today: string): Jurisdiction[]
  ```

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/plan.test.ts`:

```ts
import { planJurisdictions } from './plan'
import type { Jurisdiction } from '../types'

const base: Jurisdiction = { id: 'usfs-x', name: 'X NF', agency: 'USFS', lat: 0, lng: 0, radiusKm: 10, stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited', effective: '2026-07-01', expires: '2026-10-31', orderNumber: '17-26-15', sourceUrl: 'https://example.gov', verifiedOn: TODAY }
const lifting: Jurisdiction = { ...base, id: 'usfs-lift', expires: '2026-12-31', scheduled: { on: '2026-10-10', summary: 'Fire restrictions lift', change: { stage: 'none', campfiresDispersed: 'allowed_with_permit', smoking: 'allowed', expires: 'until_rescinded', orderNumber: undefined } } }

describe('planJurisdictions', () => {
  test('Today is exactly applyScheduled: no plan metadata on any entry', () => {
    const out = planJurisdictions([base, lifting], { arrive: TODAY, nights: 1 }, TODAY)
    expect(out.map((j) => j.plan)).toEqual([undefined, undefined])
    expect(out[1].stage).toBe('stage1')
  })
  test('a change that lands during the stay keeps arrival-day rules and is flagged with its date', () => {
    const [, j] = planJurisdictions([base, lifting], { arrive: '2026-10-09', nights: 2 }, TODAY)
    expect(j.stage).toBe('stage1')
    expect(j.plan).toEqual({ changesDuring: { on: '2026-10-10', summary: 'Fire restrictions lift' } })
  })
  test('a stay starting today that spans the change is flagged the same way', () => {
    const [, j] = planJurisdictions([base, lifting], { arrive: '2026-10-09', nights: 3 }, '2026-10-09')
    expect(j.plan?.changesDuring?.on).toBe('2026-10-10')
  })
  test('a change already in effect by arrival is applied and remembered as applied', () => {
    const [, j] = planJurisdictions([base, lifting], { arrive: '2026-10-16', nights: 2 }, TODAY)
    expect(j.stage).toBe('none')
    expect(j.scheduled).toBeUndefined()
    expect(j.plan).toEqual({ applied: { on: '2026-10-10', summary: 'Fire restrictions lift' } })
  })
  test('an order whose end falls inside the stay is flagged, rules unchanged', () => {
    const [j] = planJurisdictions([base], { arrive: '2026-10-30', nights: 3 }, TODAY)
    expect(j.stage).toBe('stage1')
    expect(j.plan).toEqual({ endsDuring: '2026-10-31' })
  })
  test('an order that ran out before arrival becomes unknown with the not-announced wording', () => {
    const [j] = planJurisdictions([base], { arrive: '2026-11-07', nights: 2 }, TODAY)
    expect(j.stage).toBe('unknown')
    expect([j.campfiresDeveloped, j.campfiresDispersed, j.stoves, j.smoking]).toEqual(['unknown', 'unknown', 'unknown', 'unknown'])
    expect(j.wildernessExempt).toBeUndefined()
    expect(j.plan).toEqual({ ended: { expires: '2026-10-31', orderNumber: '17-26-15', reason: 'Order 17-26-15 ends Oct 31. Rules after that are not announced.' } })
  })
  test('an order with no end date, or already lifted, is never marked ended', () => {
    const open = { ...base, expires: 'until_rescinded' as const }
    const none = { ...base, stage: 'none' as const, expires: '2026-10-31' }
    const out = planJurisdictions([open, none], { arrive: '2026-11-07', nights: 2 }, TODAY)
    expect(out.map((j) => j.plan)).toEqual([undefined, undefined])
  })
  test('the end date lands on the last night: the whole stay is under the order, no flag', () => {
    const [j] = planJurisdictions([base], { arrive: '2026-10-30', nights: 2 }, TODAY)
    expect(j.plan).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test src/lib/plan.test.ts`
Expected: FAIL with `planJurisdictions is not a function` (or not exported)

- [ ] **Step 3: Add the type and the implementation**

In `src/types.ts`, before `export interface Jurisdiction {`:

```ts
/** What the trip planner found for an entry on the chosen dates; set at runtime by planJurisdictions(), never stored. */
export type PlanMeta = {
  /** A scheduled change that took effect between today and arrival (so a card can say why it differs from today) */
  applied?: { on: string; summary: string }
  /** A scheduled change that lands after arrival, on or before the last night */
  changesDuring?: { on: string; summary: string }
  /** The order's printed end date falls inside the stay (after arrival, before the last night) */
  endsDuring?: string
  /** The order ran out before arrival; the entry has been set to unknown */
  ended?: { expires: string; orderNumber?: string; reason: string }
}
```

In `Jurisdiction`, after the `stale?` line:

```ts
  /** Set by planJurisdictions() when a trip window other than Today is active */
  plan?: PlanMeta
```

In `src/lib/plan.ts`, add the import `import type { Jurisdiction, PlanMeta } from '../types'` and `import { applyScheduled } from './scheduled'`, then:

```ts
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
```

An end date on the last night gets no flag: `j.expires < last` is false when they are equal, and `ended` needs `< arrive`. The spec's `endsDuring` is "on or after arrival and before the last night"; a printed end on the last night means every night of the stay is under the order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test src/lib/plan.test.ts && ./node_modules/.bin/tsc -p .`
Expected: PASS, 20 tests; tsc silent.

- [ ] **Step 5: Commit**

```bash
git add src/lib/plan.ts src/lib/plan.test.ts src/types.ts
git commit -m "plan: resolve fire rules on the arrival day and tag what changes or ends during the stay"
```

---

### Task 3: Campground status for a window

**Files:**
- Modify: `src/lib/plan.ts`
- Test: `src/lib/plan.test.ts`

**Interfaces:**
- Consumes: `SeasonDates` from `src/lib/upcoming.ts` (`{ firstOpen?, seasonEnd?, seasonEndKnown?, nextOpen? }`); `TripWindow`, `lastNight`, `addDays`.
- Produces:
  ```ts
  export type SiteSeason = SeasonDates & { season?: string | null; signClose?: string | null; signOpen?: string | null; signSource?: string | null }
  export type SiteStatus =
    | { kind: 'open'; text: string }
    | { kind: 'closes'; date: string; night: number; text: string }
    | { kind: 'opens'; date: string; text: string }
    | { kind: 'closed'; reopens?: string; text: string }
    | { kind: 'unknown'; hint?: string; text: string }
  export function siteStatusForPlan(s: SiteSeason, w: TripWindow, today: string): SiteStatus
  export function monthRange(season: string | null | undefined): { start: number; end: number } | null  // 1-based months, only for "April – October" style text
  ```

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/plan.test.ts`:

```ts
import { monthRange, siteStatusForPlan } from './plan'

const hatCreek = { firstOpen: '2026-09-04', seasonEnd: '2026-10-10', seasonEndKnown: true, nextOpen: '2027-04-23' }

describe('siteStatusForPlan', () => {
  test('every night inside the calendar window is open', () => {
    expect(siteStatusForPlan(hatCreek, { arrive: '2026-10-08', nights: 2 }, TODAY)).toEqual({ kind: 'open', text: 'Open both nights (Recreation.gov calendar)' })
    expect(siteStatusForPlan(hatCreek, { arrive: '2026-10-07', nights: 3 }, TODAY).text).toBe('Open all 3 nights (Recreation.gov calendar)')
    expect(siteStatusForPlan(hatCreek, { arrive: '2026-10-10', nights: 1 }, TODAY).text).toBe('Open (Recreation.gov calendar)')
  })
  test('a calendar that ends inside the stay closes, naming the night', () => {
    expect(siteStatusForPlan(hatCreek, { arrive: '2026-10-09', nights: 3 }, TODAY)).toEqual({ kind: 'closes', date: '2026-10-10', night: 2, text: 'Closed for the season after Sat, Oct 10 — your second night (Recreation.gov calendar)' })
  })
  test('a stay after the season is closed, with the reopening when posted', () => {
    expect(siteStatusForPlan(hatCreek, { arrive: '2026-10-16', nights: 2 }, TODAY)).toEqual({ kind: 'closed', reopens: '2027-04-23', text: 'Closed for the season; reopens Fri, Apr 23, 2027 (Recreation.gov calendar)' })
    expect(siteStatusForPlan({ ...hatCreek, nextOpen: null }, { arrive: '2026-10-16', nights: 2 }, TODAY).text).toBe('Closed for the season; next season not posted yet (Recreation.gov calendar)')
  })
  test('arriving before it opens, with the opening inside the stay, is opens', () => {
    expect(siteStatusForPlan(hatCreek, { arrive: '2027-04-22', nights: 3 }, TODAY)).toEqual({ kind: 'opens', date: '2027-04-23', text: 'Opens Fri, Apr 23, 2027 — your second night (Recreation.gov calendar)' })
  })
  test('a stay past the last released day with the end unconfirmed is unknown, not open', () => {
    const s = { firstOpen: '2026-09-04', seasonEnd: '2026-10-10', seasonEndKnown: false, nextOpen: null }
    expect(siteStatusForPlan(s, { arrive: '2026-10-09', nights: 3 }, TODAY)).toEqual({ kind: 'unknown', text: 'Calendar released through Sat, Oct 10 only; later nights not posted yet (Recreation.gov calendar)' })
  })
  test('no calendar and a plain month range gives unknown with the range as a hint', () => {
    expect(siteStatusForPlan({ season: 'April – October' }, { arrive: '2026-11-07', nights: 2 }, TODAY)).toEqual({ kind: 'unknown', hint: 'Season listed as April – October; your dates fall outside it', text: 'Season not posted; the forest lists April – October (your dates fall outside it)' })
    expect(siteStatusForPlan({ season: 'April – October' }, { arrive: '2026-10-09', nights: 2 }, TODAY).text).toBe('Season not posted; the forest lists April – October')
  })
  test('a month range that is not two plain month names is shown verbatim and never parsed', () => {
    expect(monthRange('Mid-May - October')).toBeNull()
    expect(siteStatusForPlan({ season: 'Mid-May - October' }, { arrive: '2026-11-07', nights: 2 }, TODAY)).toEqual({ kind: 'unknown', text: 'Season not posted; the forest lists Mid-May - October' })
  })
  test('nothing at all is unknown', () => {
    expect(siteStatusForPlan({}, { arrive: '2026-10-09', nights: 2 }, TODAY)).toEqual({ kind: 'unknown', text: 'No season dates posted' })
  })
  test('a sign that says "closes Oct 13" means Oct 13 is the first closed day; it is a confirmed end and names its source', () => {
    const bigPine = { season: 'May – October', signClose: '2026-10-13', signSource: 'notice posted at the campground, late Sep 2026' }
    expect(siteStatusForPlan(bigPine, { arrive: '2026-10-12', nights: 2 }, TODAY)).toEqual({ kind: 'closes', date: '2026-10-13', night: 2, text: 'Closes for the season Tue, Oct 13 — your second night (notice posted at the campground, late Sep 2026)' })
    expect(siteStatusForPlan(bigPine, { arrive: '2026-10-16', nights: 2 }, TODAY).kind).toBe('closed')
    expect(siteStatusForPlan(bigPine, { arrive: '2026-10-11', nights: 2 }, TODAY)).toEqual({ kind: 'open', text: 'Open both nights (notice posted at the campground, late Sep 2026)' })
  })
  test('a Recreation.gov calendar beats a sign when both exist', () => {
    const both = { ...hatCreek, signClose: '2026-10-13', signSource: 'sign' }
    expect(siteStatusForPlan(both, { arrive: '2026-10-09', nights: 3 }, TODAY).date).toBe('2026-10-10')
  })
})

describe('monthRange', () => {
  test('parses two plain month names in either dash style', () => {
    expect(monthRange('April – October')).toEqual({ start: 4, end: 10 })
    expect(monthRange('May - October')).toEqual({ start: 5, end: 10 })
    expect(monthRange('Year-round')).toBeNull()
    expect(monthRange(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test src/lib/plan.test.ts`
Expected: FAIL with `siteStatusForPlan is not a function`

- [ ] **Step 3: Write the implementation**

Append to `src/lib/plan.ts` (add `import { formatUpcomingDate, type SeasonDates } from './upcoming'` at the top, replacing the earlier import of `formatUpcomingDate`):

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test src/lib/plan.test.ts && ./node_modules/.bin/tsc -p .`
Expected: PASS (all plan tests); tsc silent. If a wording assertion fails, fix the code to match the test, not the other way round — the texts are the copy the spec asks for.

- [ ] **Step 5: Commit**

```bash
git add src/lib/plan.ts src/lib/plan.test.ts
git commit -m "plan: campground open/closes/opens/closed/unknown for a stay"
```

---

### Task 4: Sign-reported season dates as data, and the Upcoming list grouped by the window

**Files:**
- Modify: `src/types.ts` (add `siteDates?`)
- Modify: `src/lib/upcoming.ts`
- Modify: `src/data/restrictions.ts` (the `usfs-lassen` entry only)
- Test: `src/lib/upcoming.test.ts`

**Interfaces:**
- Consumes: `namesMatch(a, b)` from `src/lib/siteFire.ts`; `PlanMeta` from `src/types.ts`.
- Produces:
  ```ts
  // src/types.ts, on Jurisdiction:
  //   siteDates?: Record<string, { closes?: string; opens?: string; source: string }>
  // src/lib/upcoming.ts
  export function signDatesFor(j: Jurisdiction | null | undefined, siteName: string): { signClose: string | null; signOpen: string | null; signSource: string | null }
  export function upcomingForSignDates(j: Jurisdiction | null | undefined, siteName: string, today: string): UpcomingItem[]
  export function upcomingForPlan(j: Jurisdiction, today: string, opts?: { includeExpiry?: boolean }): UpcomingItem[]   // like upcomingForJurisdiction, plus plan.applied / plan.ended items
  export type UpcomingGroups = { byArrival: UpcomingItem[]; during: UpcomingItem[]; later: UpcomingItem[] }
  export function groupUpcoming(items: UpcomingItem[], arrive: string, last: string): UpcomingGroups   // last = lastNight(window); callers compute it
  ```
  `upcoming.ts` must not import from `plan.ts` (plan.ts already imports `formatUpcomingDate` and `SeasonDates` from it), which is why the window is passed as two strings.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/upcoming.test.ts`:

```ts
import { groupUpcoming, signDatesFor, upcomingForPlan, upcomingForSignDates } from './upcoming'

const lassen: Jurisdiction = { ...stage1, id: 'usfs-lassen', name: 'Lassen NF', stage: 'none', expires: 'until_rescinded', siteDates: { 'Big Pine Campground': { closes: '2026-10-13', source: 'notice posted at the campground, late Sep 2026' } } }

describe('sign-reported dates', () => {
  test('are found by the same loose name match as siteNotes', () => {
    expect(signDatesFor(lassen, 'Big Pine Campground')).toEqual({ signClose: '2026-10-13', signOpen: null, signSource: 'notice posted at the campground, late Sep 2026' })
    expect(signDatesFor(lassen, 'Cave Campground')).toEqual({ signClose: null, signOpen: null, signSource: null })
    expect(signDatesFor(null, 'Big Pine Campground').signClose).toBeNull()
  })
  test('appear in the Upcoming list once, naming the source, and only while ahead', () => {
    expect(upcomingForSignDates(lassen, 'Big Pine Campground', TODAY)).toEqual([{ date: '2026-10-13', text: 'Closes for the season (notice posted at the campground, late Sep 2026)' }])
    expect(upcomingForSignDates(lassen, 'Big Pine Campground', '2026-10-14')).toEqual([])
  })
})

describe('upcomingForPlan', () => {
  test('is upcomingForJurisdiction when there is no plan metadata', () => {
    expect(upcomingForPlan(stage1, TODAY)).toEqual([{ date: '2026-10-31', text: 'Fire order 17-26-15 ends, unless lifted earlier or renewed' }])
  })
  test('a change applied by arrival is listed on its date so the reader sees why the card differs from today', () => {
    const j: Jurisdiction = { ...stage1, stage: 'none', plan: { applied: { on: '2026-10-10', summary: 'Fire restrictions lift' } } }
    expect(upcomingForPlan(j, TODAY)).toEqual([{ date: '2026-10-10', text: 'Fire restrictions lift' }])
  })
  test('an order that ended before arrival is listed on its end date with the not-announced wording', () => {
    const j: Jurisdiction = { ...stage1, stage: 'unknown', plan: { ended: { expires: '2026-10-31', orderNumber: '17-26-15', reason: 'Order 17-26-15 ends Oct 31. Rules after that are not announced.' } } }
    expect(upcomingForPlan(j, TODAY)).toEqual([{ date: '2026-10-31', text: 'Order 17-26-15 ends Oct 31. Rules after that are not announced.' }])
  })
})

describe('groupUpcoming', () => {
  const items = [{ date: '2026-10-08', text: 'a' }, { date: '2026-10-09', text: 'b' }, { date: '2026-10-10', text: 'c' }, { date: '2026-10-31', text: 'd' }]
  test('splits by arrival and last night', () => {
    expect(groupUpcoming(items, '2026-10-09', '2026-10-10')).toEqual({ byArrival: [items[0], items[1]], during: [items[2]], later: [items[3]] })
  })
  test('Today puts everything in later (items are always after today)', () => {
    expect(groupUpcoming(items, '2026-10-07', '2026-10-07')).toEqual({ byArrival: [], during: [], later: items })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test src/lib/upcoming.test.ts`
Expected: FAIL: `groupUpcoming is not a function` (and a type error on `siteDates` only under tsc, which is fine at this step).

- [ ] **Step 3: Implement**

`src/types.ts`, after `siteNotes?`:

```ts
  /** Season dates reported by a sign or ranger for a named site (no online source), keyed like siteNotes. A
   *  Recreation.gov calendar beats these; they count only where no calendar exists. */
  siteDates?: Record<string, { closes?: string; opens?: string; source: string }>
```

`src/lib/upcoming.ts`, add the import `import { namesMatch } from './siteFire'` and append:

```ts
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
```

For the Today window (arrive = last = today) every item lands in `later`: items are always `>= today`, and an expiry item dated today is a corner the Today branch never renders grouped anyway (Today shows the flat list).

`src/data/restrictions.ts` — in the `usfs-lassen` entry, replace the two long site notes with short ones and add `siteDates` right after `siteNotes`:

```ts
siteNotes: { 'Big Pine Campground': 'Closes for the season Oct 13, 2026 per the notice posted at the campground; nothing online carries a date (first-come, first-served, no Recreation.gov calendar).', 'Cave Campground': 'Closes for the season Oct 13, 2026 per the notice posted at the campground; nothing online carries a date (first-come, first-served, no Recreation.gov calendar).' }, siteDates: { 'Big Pine Campground': { closes: '2026-10-13', source: 'notice posted at the campground, late Sep 2026' }, 'Cave Campground': { closes: '2026-10-13', source: 'notice posted at the campground, late Sep 2026' } },
```

Do this with a scripted exact-string replacement (the entry is one long line); do not touch `verifiedOn` or the `id: 'usfs-lassen',` text.

- [ ] **Step 4: Run the tests and the build**

Run: `bun test && ./node_modules/.bin/tsc -p . && bun run build`
Expected: all tests pass (previous 39 + the new ones); build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/lib/upcoming.ts src/lib/upcoming.test.ts src/data/restrictions.ts
git commit -m "plan: sign-reported season dates as data; Upcoming items for applied and ended orders; grouping by window"
```

---

### Task 5: The window context and address sync

**Files:**
- Create: `src/hooks/usePlanWindow.tsx`
- Modify: `src/main.tsx` (wrap the app in the provider) — read the file first; it mounts `<App />` inside `PersistQueryClientProvider`.

**Interfaces:**
- Consumes: `parseWindow`, `formatWindow`, `isTodayWindow`, `TripWindow` from `src/lib/plan.ts`; `pacificToday` from `src/lib/scheduled.ts`.
- Produces:
  ```ts
  export function PlanWindowProvider({ children }: { children: React.ReactNode }): JSX.Element
  export function usePlanWindow(): { window: TripWindow; today: string; isToday: boolean; set: (w: TripWindow) => void; reset: () => void }
  ```

- [ ] **Step 1: Write the hook**

```tsx
// src/hooks/usePlanWindow.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { formatWindow, isTodayWindow, parseWindow, todayWindow, type TripWindow } from '../lib/plan'
import { pacificToday } from '../lib/scheduled'

type Ctx = { window: TripWindow; today: string; isToday: boolean; set: (w: TripWindow) => void; reset: () => void }
const PlanWindowContext = createContext<Ctx | null>(null)

/** Holds the trip window, reads it from the address on load and mirrors changes back without a reload. */
export function PlanWindowProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(pacificToday)
  const [window_, setWindow] = useState<TripWindow>(() => parseWindow(location.search, pacificToday()))
  // Re-check the Pacific date hourly and when the tab comes back; a window left open past midnight must move on
  useEffect(() => {
    const tick = () => setToday(pacificToday())
    const id = setInterval(tick, 60 * 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [])
  // A window whose arrival has slipped into the past falls back to Today (parseWindow applies the same rule)
  const window = useMemo(() => (window_.arrive < today ? todayWindow(today) : window_), [window_, today])
  const set = useCallback((w: TripWindow) => {
    const next = parseWindow(formatWindow(w, today), today)
    setWindow(next)
    history.replaceState(null, '', `${location.pathname}${formatWindow(next, today)}${location.hash}`)
  }, [today])
  const reset = useCallback(() => set(todayWindow(today)), [set, today])
  const value = useMemo<Ctx>(() => ({ window, today, isToday: isTodayWindow(window, today), set, reset }), [window, today, set, reset])
  return <PlanWindowContext.Provider value={value}>{children}</PlanWindowContext.Provider>
}

export function usePlanWindow(): Ctx {
  const ctx = useContext(PlanWindowContext)
  if (!ctx) throw new Error('usePlanWindow outside PlanWindowProvider')
  return ctx
}
```

- [ ] **Step 2: Mount the provider**

In `src/main.tsx`, import `{ PlanWindowProvider } from './hooks/usePlanWindow'` and wrap `<App />`:

```tsx
<PlanWindowProvider><App /></PlanWindowProvider>
```

(keep it inside the existing `PersistQueryClientProvider`).

- [ ] **Step 3: Type-check and run the app**

Run: `./node_modules/.bin/tsc -p . && bun test`
Expected: silent tsc; tests still pass. Start the dev server (`.claude/launch.json` has `vite-dev-alt` on port 5183) and load `http://localhost:5183/?arrive=2026-10-09&nights=2`: the page must load with no console error (the window is held but nothing reads it yet).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePlanWindow.tsx src/main.tsx
git commit -m "plan: trip window context, read from and mirrored to the page address"
```

---

### Task 6: Resolve the map through the window; today-only live layers

**Files:**
- Modify: `src/App.tsx:43-54` (day state and `JURISDICTIONS` memo), `:58-61` (`layers`), `:240` (CampgroundLayer), `:289` and `:295` (red flag use), `:320-323` (live toggles), and the `<LiveLayers …>` render
- Modify: `src/components/Toggle.tsx` (add `disabled?`)

**Interfaces:**
- Consumes: `usePlanWindow()` from Task 5; `planJurisdictions` from Task 2.
- Produces: `JURISDICTIONS` resolved for the window; `const { window: plan, today, isToday } = usePlanWindow()` available in `App`; `LIVE_OFF` layer override.

- [ ] **Step 1: Resolve through the window**

In `App.tsx` replace the `day`/`JURISDICTIONS` block:

```tsx
  const { window: plan, today: planToday, isToday } = usePlanWindow()
  // Local day drives staleness (applyFreshness); the Pacific day and the trip window drive which rules apply
  const [day, setDay] = useState(() => new Date().toDateString())
  useEffect(() => {
    const tick = () => setDay(new Date().toDateString())
    const id = window.setInterval(tick, 60 * 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [])
  /** Entries as they stand on the arrival day (Today: exactly applyScheduled), then stale ones downgraded to Unverified */
  const JURISDICTIONS = useMemo(() => applyFreshness(planJurisdictions(RAW, plan, planToday)), [day, plan, planToday])
```

Remove the now-unused `applyScheduled`/`pacificToday` imports from `App.tsx` and add `import { planJurisdictions } from './lib/plan'` and `import { usePlanWindow } from './hooks/usePlanWindow'`. The context's `window` field is destructured under the alias `plan` so the global `window.setInterval` keeps working.

- [ ] **Step 2: Live layers off while planning**

Add near `layers`:

```tsx
  /** Red Flag Warnings, wildfires, perimeters and fire danger describe today; they are off and disabled for any other window */
  const effectiveLayers = isToday ? layers : { ...layers, redFlag: false, fires: false, perimeters: false, danger: false }
```

Use `effectiveLayers` wherever `layers` is passed to `<LiveLayers>`; pass `redFlagZones={isToday ? redFlagZones : null}` to `<CampgroundLayer>` (it already accepts `null`). Replace both `redFlag.active` uses (lines 289 and 295) with `redFlag.active && isToday`. Give the four live `<Toggle>`s `disabled={!isToday}` and, when `!isToday`, hint `"today only"`.

`src/components/Toggle.tsx`:

```tsx
export function Toggle({ label, on, onChange, hint, disabled = false }: { label: string; on: boolean; onChange: (v: boolean) => void; hint?: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-3 py-1 text-sm ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
```

and pass `disabled={disabled}` to the underlying `<input type="checkbox">` (read the file to find it).

- [ ] **Step 3: Regression test for Today**

Append to `src/lib/plan.test.ts`:

```ts
import { JURISDICTIONS as RAW } from '../data/restrictions'
import { applyScheduled } from './scheduled'

test('with the Today window the real data resolves exactly as before', () => {
  const t = '2026-10-07'
  expect(planJurisdictions(RAW, { arrive: t, nights: 1 }, t)).toEqual(applyScheduled(RAW, t))
})
```

Run: `bun test && ./node_modules/.bin/tsc -p .` → PASS, silent.

- [ ] **Step 4: Run the app**

Dev server on 5183. Load `/` → map identical to before (fills, pins, live layers on). Load `/?arrive=2026-11-07&nights=2` → Tahoe NF (order ends Oct 31) fills grey; the live toggles are greyed out; console has no new errors (the pre-existing duplicate-key warning for "Site 4" is known).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/Toggle.tsx src/lib/plan.test.ts
git commit -m "plan: resolve the map through the trip window; live layers are today-only"
```

---

### Task 7: Picker chip and planning banner

**Files:**
- Create: `src/components/PlanPicker.tsx`
- Create: `src/components/PlanBanner.tsx`
- Modify: `src/App.tsx:244-262` (header)

**Interfaces:**
- Consumes: `usePlanWindow()`; `thisWeekend`, `nextWeekend`, `todayWindow`, `describeWindow`, `addDays`, `MAX_NIGHTS`, `MAX_DAYS_AHEAD` from `src/lib/plan.ts`; `formatUpcomingDate` from `src/lib/upcoming.ts`.
- Produces: `<PlanPicker />` (self-contained, reads and sets the context) and `<PlanBanner />` (renders nothing on Today).

- [ ] **Step 1: Write the picker**

```tsx
// src/components/PlanPicker.tsx
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { usePlanWindow } from '../hooks/usePlanWindow'
import { addDays, describeWindow, MAX_DAYS_AHEAD, MAX_NIGHTS, nextWeekend, thisWeekend, todayWindow } from '../lib/plan'

/** "Today ▾" chip in the header: presets and a date + nights picker for the trip window */
export function PlanPicker() {
  const { window: w, today, isToday, set } = usePlanWindow()
  const [open, setOpen] = useState(false)
  const [arrive, setArrive] = useState(w.arrive)
  const [nights, setNights] = useState(w.nights)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { setArrive(w.arrive); setNights(w.nights) }, [w])
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])
  const choose = (next: typeof w) => { set(next); setOpen(false) }
  const preset = (label: string, next: typeof w) => (
    <button key={label} onClick={() => choose(next)} className={`rounded-full border px-2.5 py-0.5 text-xs ${w.arrive === next.arrive && w.nights === next.nights ? 'border-signgold bg-signgold text-pine-900' : 'border-pine-600 text-cream hover:border-signgold'}`}>
      {label}
    </button>
  )
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog" className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${isToday ? 'border-pine-600 text-cream-dim hover:border-signgold' : 'border-signgold bg-signgold/15 text-signgold'}`}>
        <CalendarDays size={11} /> {isToday ? 'Today' : describeWindow(w, today)} <ChevronDown size={11} />
      </button>
      {open && (
        <div role="dialog" aria-label="Plan for a date" className="absolute left-0 top-full z-[1200] mt-1 w-[300px] rounded border border-pine-600 bg-pine-900 p-3 text-xs shadow-lg">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-signgold">Plan for a date</p>
          <p className="mt-0.5 text-cream-dim">Shows the map as it will be then, from changes agencies have announced. Nothing is predicted.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {preset('Today', todayWindow(today))}
            {preset('This weekend', thisWeekend(today))}
            {preset('Next weekend', nextWeekend(today))}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-2">
            <label className="block">
              <span className="text-cream-dim">Arrive</span>
              <input type="date" value={arrive} min={today} max={addDays(today, MAX_DAYS_AHEAD)} onChange={(e) => setArrive(e.target.value)} className="mt-0.5 w-full rounded border border-pine-600 bg-pine-800 px-2 py-1 text-cream" />
            </label>
            <label className="block w-[72px]">
              <span className="text-cream-dim">Nights</span>
              <input type="number" value={nights} min={1} max={MAX_NIGHTS} onChange={(e) => setNights(Math.max(1, Math.min(MAX_NIGHTS, Number(e.target.value) || 1)))} className="mt-0.5 w-full rounded border border-pine-600 bg-pine-800 px-2 py-1 text-cream" />
            </label>
          </div>
          <button onClick={() => choose({ arrive, nights })} className="mt-3 w-full rounded bg-signgold py-1.5 font-semibold text-pine-900 hover:bg-signgold/90">
            Show the map for these dates
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the banner**

```tsx
// src/components/PlanBanner.tsx
import { CalendarClock } from 'lucide-react'
import { usePlanWindow } from '../hooks/usePlanWindow'
import { describeWindow } from '../lib/plan'
import { formatUpcomingDate } from '../lib/upcoming'

/** Under the header while a window other than Today is active */
export function PlanBanner() {
  const { window: w, today, isToday, reset } = usePlanWindow()
  if (isToday) return null
  return (
    <div role="status" className="pointer-events-auto flex flex-wrap items-center gap-x-2 gap-y-1 rounded border border-signgold/60 bg-pine-900/95 px-3 py-2 text-xs text-cream backdrop-blur md:w-[380px]">
      <CalendarClock size={13} className="shrink-0 text-signgold" />
      <span><b className="text-signgold">Planning {describeWindow(w, today)}</b> · from changes announced as of {formatUpcomingDate(today, today)}</span>
      <span className="text-cream-dim">Red Flag Warnings and wildfires are shown for today only.</span>
      <button onClick={reset} className="ml-auto rounded border border-signgold/60 px-2 py-0.5 font-semibold text-signgold hover:bg-signgold/15">Back to today</button>
    </div>
  )
}
```

- [ ] **Step 3: Mount both**

In `App.tsx` header, under the `verified {LATEST_VERIFIED}` line inside the title block, add `<div className="mt-1"><PlanPicker /></div>`; directly after the `</header>` add `<PlanBanner />` (same `pointer-events-auto md:w-[380px]` column as the SearchBox). Import both components.

- [ ] **Step 4: Visual check**

Dev server, desktop: open the chip, choose "Next weekend": banner appears with the dates, the address bar gains `?arrive=…&nights=2`, the chip shows the dates. "Back to today" clears both. Phone preset (375×812): the popover fits inside the viewport without horizontal scroll; the banner wraps. Fix any overflow before committing.

- [ ] **Step 5: Commit**

```bash
git add src/components/PlanPicker.tsx src/components/PlanBanner.tsx src/App.tsx
git commit -m "plan: picker chip with weekend presets and a planning banner"
```

---

### Task 8: Spot panel, list rows and tooltips speak for the arrival day

**Files:**
- Modify: `src/components/SignPanel.tsx:64-66` and the headline/countdown block
- Modify: `src/components/JurisdictionList.tsx:9,23-24`
- Modify: `src/components/JurisdictionFills.tsx:74-77`

**Interfaces:**
- Consumes: `usePlanWindow()`; `upcomingForPlan`, `groupUpcoming` from `src/lib/upcoming.ts`; `formatUpcomingDate`; `lastNight` from `src/lib/plan.ts`.
- Produces: no new exports.

- [ ] **Step 1: SignPanel**

Replace `const today = pacificToday()` and the `upcoming` line with:

```tsx
  const { window: plan, today, isToday } = usePlanWindow()
  const upcoming = upcomingForPlan(j, today, { includeExpiry: !isToday })
  const groups = groupUpcoming(upcoming, plan.arrive, lastNight(plan))
```
(import `lastNight` from `../lib/plan`)

Headline: prefix the stage with the arrival day when planning:

```tsx
      {!isToday && <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-signgold/75">On {formatUpcomingDate(plan.arrive, today)}</p>}
```

immediately above the existing `<p className="mt-1 font-display text-4xl …">` headline.

Plan lines, right after the headline (before the governing-order notice):

```tsx
      {j.plan?.ended && <p className="mt-2 rounded border border-unknown bg-pine-950/40 p-2 text-xs text-cream"><b>Not announced.</b> {j.plan.ended.reason}</p>}
      {j.plan?.changesDuring && <p className="mt-2 rounded border border-signgold/60 bg-signgold/10 p-2 text-xs text-cream"><b>Changes {formatUpcomingDate(j.plan.changesDuring.on, today)}:</b> {j.plan.changesDuring.summary}</p>}
      {j.plan?.endsDuring && <p className="mt-2 rounded border border-signgold/60 bg-signgold/10 p-2 text-xs text-cream"><b>Order{j.orderNumber ? ` ${j.orderNumber}` : ''} ends {formatUpcomingDate(j.plan.endsDuring, today)}.</b> Rules after that are not announced.</p>}
```

Upcoming: on Today keep `<Upcoming items={upcoming} today={today} variant="sign" />` as now. When planning render three blocks with titles, skipping empty ones — extend `Upcoming` with an optional `title` prop (default `'Upcoming'`):

```tsx
      {isToday ? <Upcoming items={upcoming} today={today} variant="sign" /> : (<>
        <Upcoming title="By your arrival" items={groups.byArrival} today={today} variant="sign" />
        <Upcoming title="During your trip" items={groups.during} today={today} variant="sign" />
        <Upcoming title="Later" items={groups.later} today={today} variant="sign" />
      </>)}
```

In `src/components/Upcoming.tsx` add `title = 'Upcoming'` to the props and render `{title}` in the heading. Remove the `pacificToday` import from SignPanel.

- [ ] **Step 2: JurisdictionList and JurisdictionFills**

Both: replace `const today = pacificToday()` with `const { window: plan, today } = usePlanWindow()` and compute `pending` against `plan.arrive` instead of `today`:

```ts
const pending = j.scheduled && j.scheduled.on > plan.arrive ? j.scheduled : null
```

In the list row, when `j.plan?.ended`, show `not announced after ${formatUpcomingDate(j.plan.ended.expires, today)}` instead of the countdown. In the fills tooltip (`JurisdictionFills.tsx`), `usePlanWindow()` must be called at the component top, not inside `onEachFeature`; pass `plan` and `today` through the existing refs pattern used for `onPick`/`onMiss` (read the file: it stores callbacks in refs so the GeoJSON layer is not rebuilt). Add a `planRef` the same way.

- [ ] **Step 3: Type-check, tests, visual check**

Run: `./node_modules/.bin/tsc -p . && bun test`. Dev server: click a Tahoe NF spot with "Next weekend" → headline `On Fri, Oct 16` / `Stage 1`; with `?arrive=2026-11-07` → grey, "Not announced. Order 17-26-15 ends Oct 31…". Open the orders list → Tahoe row reads "not announced after Sat, Oct 31" for the November window.

- [ ] **Step 4: Commit**

```bash
git add src/components/SignPanel.tsx src/components/JurisdictionList.tsx src/components/JurisdictionFills.tsx src/components/Upcoming.tsx
git commit -m "plan: panel, list rows and tooltips describe the arrival day and the stay"
```

---

### Task 9: Campground cards and pins for the stay

**Files:**
- Modify: `src/lib/mergeSites.ts` (`DETAIL_FIELDS`, `SiteDetail`, `splitSites`): the four season-window fields move from the lazy detail chunk to the index so pins can use them
- Modify: `src/components/CampgroundLayer.tsx:44-50` (SitePopup) and `:143-170` (pin rows and style)
- Test: `src/lib/mergeSites.test.ts`

**Interfaces:**
- Consumes: `siteStatusForPlan`, `SiteSeason`, `lastNight` from `src/lib/plan.ts`; `signDatesFor`, `upcomingForSignDates`, `upcomingForPlan`, `upcomingForSite`, `groupUpcoming`; `usePlanWindow()`.
- Produces: `RecSite` index records carry `firstOpen`, `seasonEnd`, `seasonEndKnown`, `nextOpen`.

- [ ] **Step 1: Failing test — season window fields are in the index, not the detail chunk**

Append to `src/lib/mergeSites.test.ts`:

```ts
import { splitSites } from './mergeSites'

test('season window dates stay on the index record so pins can judge a stay without loading detail', () => {
  const sites = buildSites(edwHatCreek, {}, [ridbHatCreek], { '232248': extra }, [], [])
  const { index, chunks } = splitSites(sites)
  expect(index[0].seasonEnd).toBe('2026-10-10')
  expect(index[0].seasonEndKnown).toBe(true)
  expect(chunks[0][0]?.season).toBe(CALENDAR)
  expect((chunks[0][0] as Record<string, unknown>)?.seasonEnd).toBeUndefined()
})
```

Run: `bun test src/lib/mergeSites.test.ts` → FAIL (`index[0].seasonEnd` is undefined).

- [ ] **Step 2: Move the fields**

In `src/lib/mergeSites.ts` remove `'firstOpen' | 'seasonEnd' | 'seasonEndKnown' | 'nextOpen'` from the `SiteDetail` Pick, remove them from `DETAIL_FIELDS`, and from the destructuring/`detail` object in `splitSites`. Move their declarations in `RecSite` above the `// ---- detail` comment with the doc line `/** Dated season window from Recreation.gov's calendar; on the index so pins can judge a stay (src/lib/plan.ts) */`. Run the test → PASS. Run `bun run scripts/build-sites.ts` and confirm `sites-index.json` grew by well under 150 KB (it was 1053 KB).

- [ ] **Step 3: SitePopup**

Replace the `today`/`upcoming` lines in `SitePopup` with:

```tsx
  const { window: plan, today, isToday } = usePlanWindow()
  const sign = signDatesFor(v.jurisdiction, s.name)
  const seasonFacts: SiteSeason = { firstOpen: s.firstOpen, seasonEnd: s.seasonEnd, seasonEndKnown: s.seasonEndKnown, nextOpen: s.nextOpen, season: s.season, ...sign }
  const stay = isToday ? null : siteStatusForPlan(seasonFacts, plan, today)
  // 'unknown' means the tracked order does not govern this site (a state park inside a forest), so its dates don't belong here
  const upcoming = [
    ...(v.jurisdiction && v.kind !== 'unknown' ? upcomingForPlan(v.jurisdiction, today) : []),
    ...upcomingForSite(s, today),
    ...(s.firstOpen || s.seasonEnd ? [] : upcomingForSignDates(v.jurisdiction, s.name, today)),
  ].sort((a, b) => a.date.localeCompare(b.date))
  const groups = groupUpcoming(upcoming, plan.arrive, lastNight(plan))
```

Directly under the verdict box, before `<Upcoming …>`:

```tsx
      {stay && (
        <p className={`mt-2 flex items-start gap-1.5 rounded border p-2 ${stay.kind === 'open' ? 'border-ok bg-ok/15' : stay.kind === 'unknown' ? 'border-pine-600 bg-pine-700/60 text-cream-dim' : 'border-ember/60 bg-ember/10'}`}>
          <CalendarDays size={13} className="mt-0.5 shrink-0" /> <span>{stay.text}</span>
        </p>
      )}
      {!isToday && showOpen && <p className="mt-1 text-[11px] text-cream-dim/80">USFS page status above is as of today, not your dates.</p>}
```

Replace the single `<Upcoming items={upcoming} …>` with the same Today / grouped branch as the panel (titles "By your arrival", "During your trip", "Later"; variant `card`).

- [ ] **Step 4: Pins**

In `CampgroundLayerInner`, read `const { window: plan, today, isToday } = usePlanWindow()` and compute per site:

```ts
const closedForStay = (s: RecSite) => !isToday && siteStatusForPlan({ firstOpen: s.firstOpen, seasonEnd: s.seasonEnd, seasonEndKnown: s.seasonEndKnown, nextOpen: s.nextOpen, season: s.season }, plan, today).kind === 'closed'
```

Use it in the `sites` filter (`showClosed || (s.open !== false && !closedForStay(s))` on Today the second term is always true) and in `pathOptions.fillColor` (`s.open === false || closedForStay(s) ? '#8A8F8B' : KIND_COLOR[s.kind]`). Add `plan`, `today`, `isToday` to the `useMemo` dependency arrays that build `sites` and `rows`. Pins do not see sign dates (they live on the jurisdiction, which the pin resolves only inside `siteFireVerdict`); that is acceptable: the card does.

- [ ] **Step 5: Type-check, tests, visual check**

Run: `./node_modules/.bin/tsc -p . && bun test && bun run build`. Dev server, "Next weekend" (Oct 16–18): Hat Creek pin is grey and hidden until "Show closed sites"; its card says "Closed for the season; next season not posted yet (Recreation.gov calendar)" with "USFS page status above is as of today". Big Pine with `?arrive=2026-10-12&nights=2` reads "Closed for the season after Tue, Oct 13 — your second night (notice posted at the campground, late Sep 2026)". Phone width: no overflow.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mergeSites.ts src/lib/mergeSites.test.ts src/components/CampgroundLayer.tsx
git commit -m "plan: campground cards state the stay; pins closed for every night go grey"
```

---

### Task 10: Legend wording, docs, final verification

**Files:**
- Modify: `src/components/Legend.tsx` (the Unverified swatch label)
- Modify: `README.md`, `docs/runbooks/weekly.md`

- [ ] **Step 1: Legend**

Give `Legend` a `planning?: boolean` prop (App passes `!isToday`) and render the Unverified swatch label as `Unverified / not announced` when planning, `Unverified` otherwise. Both states use the existing grey; the planner introduces no new colour.

- [ ] **Step 2: Docs**

README, in the features paragraph that mentions the Upcoming list: add one sentence — "Pick dates with the **Today ▾** chip to see the map for a trip (arrival + nights): announced changes applied, orders past their printed end shown as not announced, campgrounds judged for every night from the Recreation.gov calendar; shareable as `?arrive=YYYY-MM-DD&nights=N`."

Runbook `docs/runbooks/weekly.md`, under the scheduled-change section: "Sign-reported season dates go in `siteDates` (structured, feeds the planner), with a short `siteNotes` line for the card. The planner reads `scheduled` and `expires`; nothing else is needed for it to work."

- [ ] **Step 3: Full verification**

Run: `bun test && bun run build && bun run verify` (verify must still be 41 pass or explain any WARN). Visual pass at desktop and 375×812: Today identical to production; "This weekend", "Next weekend", a custom November window; shared link opens on the window; "Back to today" clears everything; console shows no new errors.

- [ ] **Step 4: Commit and push**

```bash
git add src/components/Legend.tsx src/App.tsx README.md docs/runbooks/weekly.md
git commit -m "plan: legend wording while planning; docs for the trip window and siteDates"
git pull --rebase origin main && git push origin main
```

Watch the Pages deploy (`gh run list`), then load the live site with `?arrive=…` to confirm.
