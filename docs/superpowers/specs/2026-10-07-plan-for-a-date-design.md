# Plan for a date — design

Status: draft for review · 2026-10-07 · approach approved in conversation: **trip window** (arrival date plus nights)

## Purpose

People use Ember Check to plan weekends, not only to check the spot they are standing on. Today the map answers
"right now". This adds a trip window so the map answers "on the dates of my trip", built only from facts that are
already announced, and honest about everything that is not.

Success looks like: pick "Next weekend", and every pin, fill, card and panel shows the fire rules and campground
status for those nights, with a line explaining each thing that will have changed by then or changes during the
stay. Choosing "Today" gives exactly today's map, pixel for pixel.

## Scope

In:
- A trip window control with presets and a date picker, shareable in the page link.
- Fire-rule state on the arrival day from scheduled changes, with mid-stay changes called out.
- Orders that run out before the trip shown as "not announced", never as allowed.
- Campground open / closed / opens-later / unknown for the whole stay, from the Recreation.gov calendar window,
  sign-reported dates, and (as a hint only) the forest feed's month range.
- Live layers hidden while planning, with a note.

Out:
- Predicting what an agency will do (no "probably lifted by then").
- Weather, fire-danger forecasts, reservation availability.
- Multi-stop itineraries. One window, applied to the whole map.

## Concepts

- **Trip window**: `{ arrive: 'YYYY-MM-DD', nights: 1–14 }`, dates in Pacific calendar days. Nights are the nights
  slept; the last night is `arrive + nights − 1`. "Today" is `{ arrive: today, nights: 1 }`.
- **Known fact**: a dated change the agency has published — a scheduled change on an entry, an order's printed end
  date, a Recreation.gov bookable window, a sign-reported closing date. Everything the planner shows traces to one.
- **Not announced**: the state after a known fact runs out with nothing published for what follows (an order's end
  date has passed, a calendar window has ended with no reopening posted). Rendered grey, like Unverified today, with
  its own wording.

## What the user sees

**Control.** A chip in the header next to the verified date: `Today ▾`. Opening it shows This weekend, Next weekend,
and Pick dates (arrival date + nights). Weekend presets mean arrive Friday, two nights, computed in Pacific time.
Arrival is limited to today through 365 days out (the calendar data's horizon); nights 1–14.

**Banner.** While a window other than Today is active, a banner under the header reads: `Planning Fri, Oct 9 –
Sun, Oct 11 · from announced changes as of Oct 7 · Red Flag Warnings and wildfires are shown for today only ·
Back to today`.

**Map.** Fills and pin rings take the arrival-day state. A new legend swatch, "Not announced", covers orders that
have run out by the arrival day. Campground pins that are closed for every night of the stay use the existing
closed-pin grey and are hidden unless "Show closed sites" is on, exactly as closed-today pins are.

**Spot panel.** The headline reads `On Fri, Oct 9: Stage 1`. If the order changes during the stay, a line beneath
says so with the date: `Changes Sat, Oct 10: fire restrictions lift`. If the order's end date falls inside the stay:
`Order 17-26-15 ends Sat, Oct 31. Rules after that are not announced.`

**Campground card.** The verdict box is for the arrival day. Below it, a status line for the stay: `Open all three
nights (Recreation.gov calendar)`, `Closed for the season after Sat, Oct 10 — your second night` ,
`Opens Fri, Apr 23, 2027`, or `Season not posted; the forest lists April – October`. The Upcoming list is grouped:
*By your arrival* (changes between today and arrival, so the reader sees why the card differs from today),
*During your trip*, and *Later*.

**Live layers.** Red Flag Warnings, active wildfires, fire perimeters and fire danger are today-only. While planning,
their toggles are disabled and the layers hidden; the banner carries the note.

**Link.** The window lives in the page address as `?arrive=2026-10-09&nights=2`. Loading a link with it opens the
planner on that window. Changing the window updates the address without a reload.

## Logic

All of it pure and unit-tested in `src/lib/plan.ts`; components only read results.

**Resolving orders for a window** — `planJurisdictions(raw, window, today)`:
1. `applyScheduled(raw, window.arrive)` — the existing resolver, pointed at the arrival day.
2. For each entry, derive `plan` metadata (a runtime field like `stale`, never written to data):
   - `changesDuring`: a scheduled change whose date is after arrival and on or before the last night.
   - `endsDuring`: `expires` is a date on or after arrival and before the last night, and the stage is not none.
   - `ended`: `expires` is a date before arrival and the stage is not none → the entry becomes stage `unknown` with
     all allowances `unknown`, `plan.reason = 'Order 17-26-15 ends Oct 31. Rules after that are not announced.'`
3. `applyFreshness` still runs on the result with the real today; staleness is about our data, not the trip.

**Campground status for a window** — `siteStatusForPlan(site, window)` returns one of, checked in this order:
- `closed` — the season ended before arrival (`seasonEndKnown` and `seasonEnd < arrive`) and no reopening is posted
  on or before the last night. Carries `nextOpen` when posted ("reopens Fri, Apr 23, 2027").
- `opens` — the first bookable night (`firstOpen` or `nextOpen`) is after arrival but on or before the last night.
  Carries the date.
- `closes` — bookable on arrival, but `seasonEndKnown` and `seasonEnd` is before the last night. Carries the date
  and which night of the stay it is.
- `open` — every night of the stay is a bookable night in the calendar (`firstOpen ≤ arrive` and
  `lastNight ≤ seasonEnd`). Whether the end is confirmed does not matter here: the nights asked about exist.
- `unknown` — anything else: no calendar at all, or the stay runs past the last released day with the end not
  confirmed. Carries the forest month range as a hint when present, parsed only when it is two plain month names
  ("April – October"); anything else is shown as text.
A sign-reported date (see Data) is treated as a confirmed end or opening, with its source named in the line.

**Presets** — computed on Pacific dates. `thisWeekend(today)`: Monday–Friday → arrive the coming Friday, two
nights; Saturday → arrive today, one night; Sunday → arrive today, one night (the weekend that is left).
`nextWeekend(today)`: the Friday after this weekend's, two nights.

**Address** — `parseWindow(search, today)` / `formatWindow(window)`: invalid or out-of-range values fall back to
Today silently.

## Data

- `Jurisdiction.siteDates?: Record<siteName, { closes?: ISO; opens?: ISO; source: string }>` — sign-reported
  season dates, matched with `namesMatch` like `siteNotes`. Big Pine and Cave move from a free-text note to
  `{ closes: '2026-10-13', source: 'notice posted at the campground, late Sep 2026' }` and keep a shorter note.
  They feed both the Upcoming list and the plan status. Precedence stays as agreed: a Recreation.gov calendar beats
  a sign.
- Nothing else in `restrictions.ts` changes. `scheduled` is already the mechanism for announced rule changes.

## Code shape

- `src/lib/plan.ts` (new, tested): types, `planJurisdictions`, `siteStatusForPlan`, presets, address parse/format.
- `src/hooks/usePlanWindow.tsx` (new): a React context holding the window; `usePlanWindow()` returns
  `{ window, isToday, set }`.
  It replaces every `pacificToday()` call in components (`SignPanel`, `CampgroundLayer`, `JurisdictionList`,
  `JurisdictionFills`). `App.tsx` provides it and resolves `JURISDICTIONS` through `planJurisdictions`.
- `components/PlanPicker.tsx` (new): the chip and its popover/sheet. `components/PlanBanner.tsx` (new).
- `components/Upcoming.tsx`: optional grouping by window. `components/Legend.tsx`: "Not announced" swatch.
- `components/LiveLayers.tsx` and the layer toggles: disabled while planning.
- `src/lib/upcoming.ts`: accepts sign-reported `siteDates` as items.
- Untouched: `scripts/*`, `verify-orders`, `status.json`, data pipeline.

## Edge cases

- Today selected → no banner, no grouping, live layers on, identical output to current build (regression test).
- Arrival inside a scheduled change's date → the change is applied (it takes effect at midnight that day).
- A stay spanning the order's printed end → fills use the arrival state; panel and cards carry the `endsDuring` line.
- Entry already stale (data too old) → stays Unverified regardless of window.
- Campground whose USFS page says closed today but whose calendar reopens before arrival → `opens` wins; the card
  keeps "closed as of today" in small print.
- Red Flag active today → ignored for future windows; today's window unchanged.
- Year boundary and daylight-saving changes → dates are strings compared lexically; presets use Pacific calendar math.

## Testing

- `bun test` for `plan.ts`: resolve before / on / during / after a scheduled change; `ended` and `endsDuring`;
  the campground status matrix (open, closes with night number, opens, closed, unknown with and without hint);
  weekend presets for each weekday, across a year end and a DST change; address parse with bad input.
- `upcoming.ts`: grouping by window; sign-reported dates appear once with their source.
- Visual, desktop and phone: Today unchanged; Next weekend on a Shasta-Trinity campground card, the spot panel, the
  list, the legend, the banner; a closed-for-season campground; a shared link opening on the window.

## Rollout

One change on `main` behind no flag: the default window is Today, so nothing changes for anyone who does not open
the chip. Runbook gains a paragraph on `siteDates` and on how the planner reads `scheduled` and `expires`.
