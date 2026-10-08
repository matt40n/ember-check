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
