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
