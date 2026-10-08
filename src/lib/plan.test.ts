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
    expect((siteStatusForPlan(both, { arrive: '2026-10-09', nights: 3 }, TODAY) as { date: string }).date).toBe('2026-10-10')
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
