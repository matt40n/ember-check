import { describe, expect, test } from 'bun:test'
import { dayStatuses, seasonWindow, seasonPhrase, type DayStatus } from './season'

/** Build a day→status map from ranges: each entry is [from, to, status]; days not listed are absent (the calendar simply ends). */
function days(ranges: [string, string, DayStatus][]): Record<string, DayStatus> {
  const out: Record<string, DayStatus> = {}
  for (const [from, to, st] of ranges) {
    for (let d = new Date(from + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) out[d.toISOString().slice(0, 10)] = st
  }
  return out
}
const WINDOW_END = '2027-08-31'

describe('dayStatuses', () => {
  test('a day is open when any campsite is bookable or first-come (Not Reservable), closed when every site is Closed, nyr when only unreleased', () => {
    const av = {
      campsites: {
        a: { availabilities: { '2026-10-01T00:00:00Z': 'Not Reservable', '2026-10-02T00:00:00Z': 'Closed', '2026-10-03T00:00:00Z': 'NYR' } },
        b: { availabilities: { '2026-10-01T00:00:00Z': 'Available', '2026-10-02T00:00:00Z': 'Not Available', '2026-10-03T00:00:00Z': 'NYR' } },
      },
    }
    expect(dayStatuses(av)).toEqual({ '2026-10-01': 'open', '2026-10-02': 'closed', '2026-10-03': 'nyr' })
  })
})

describe('seasonWindow', () => {
  test('a calendar that simply ends after Oct 10 and resumes in April gives a known end and the next opening', () => {
    const w = seasonWindow(days([['2026-09-03', '2026-10-10', 'open'], ['2027-04-24', '2027-08-31', 'open']]), '2026-09-28', WINDOW_END)
    expect(w).toEqual({ firstOpen: '2026-09-03', seasonEnd: '2026-10-10', seasonEndKnown: true, nextOpen: '2027-04-24', prevEnd: null })
  })
  test('winter marked Closed day by day is the same as a missing winter', () => {
    const w = seasonWindow(days([['2026-09-03', '2026-10-10', 'open'], ['2026-10-11', '2027-04-23', 'closed'], ['2027-04-24', '2027-08-31', 'open']]), '2026-09-28', WINDOW_END)
    expect(w.seasonEnd).toBe('2026-10-10')
    expect(w.seasonEndKnown).toBe(true)
    expect(w.nextOpen).toBe('2027-04-24')
  })
  test('a maintenance gap shorter than a week does not end the season', () => {
    const w = seasonWindow(days([['2026-09-03', '2026-09-30', 'open'], ['2026-10-01', '2026-10-03', 'closed'], ['2026-10-04', '2026-10-10', 'open']]), '2026-09-28', WINDOW_END)
    expect(w.seasonEnd).toBe('2026-10-10')
  })
  test('unreleased (NYR) days after the last open day leave the end unknown', () => {
    const w = seasonWindow(days([['2026-09-03', '2026-10-10', 'open'], ['2026-10-11', '2027-08-31', 'nyr']]), '2026-09-28', WINDOW_END)
    expect(w.seasonEnd).toBe('2026-10-10')
    expect(w.seasonEndKnown).toBe(false)
  })
  test('when today falls after a season ended, the next run is the season and the old end is prevEnd', () => {
    const w = seasonWindow(days([['2026-09-03', '2026-10-10', 'open'], ['2027-04-24', '2027-08-31', 'open']]), '2026-11-15', WINDOW_END)
    expect(w).toEqual({ firstOpen: '2027-04-24', seasonEnd: '2027-08-31', seasonEndKnown: false, nextOpen: null, prevEnd: '2026-10-10' })
  })
})

describe('seasonPhrase', () => {
  const P = ' (Recreation.gov calendar)'
  test('open now with a known end and a posted reopening', () => {
    expect(seasonPhrase({ firstOpen: '2026-09-03', seasonEnd: '2026-10-10', seasonEndKnown: true, nextOpen: '2027-04-24', prevEnd: null }, '2026-09-28', WINDOW_END)).toBe(`Open through Oct 10; reopens Apr 24, 2027${P}`)
  })
  test('open now with a known end and no reopening posted yet', () => {
    expect(seasonPhrase({ firstOpen: '2026-09-03', seasonEnd: '2026-10-10', seasonEndKnown: true, nextOpen: null, prevEnd: null }, '2026-09-28', WINDOW_END)).toBe(`Open through Oct 10; next season not posted yet${P}`)
  })
  test('open now with later dates not released', () => {
    expect(seasonPhrase({ firstOpen: '2026-09-03', seasonEnd: '2026-10-10', seasonEndKnown: false, nextOpen: null, prevEnd: null }, '2026-09-28', WINDOW_END)).toBe(`Open now, through Oct 10; later dates not released yet${P}`)
  })
  test('open now to the edge of the 12-month window reads as at least', () => {
    expect(seasonPhrase({ firstOpen: '2027-05-01', seasonEnd: WINDOW_END, seasonEndKnown: false, nextOpen: null, prevEnd: null }, '2027-06-15', WINDOW_END)).toBe(`Open now, through at least Aug 31${P}`)
  })
  test('a failed month fetch after the last open day leaves the end unknown rather than calling it closed', () => {
    const w = seasonWindow(days([['2026-09-03', '2026-10-10', 'open'], ['2026-10-11', '2026-11-30', 'unknown']]), '2026-09-28', WINDOW_END)
    expect(w.seasonEndKnown).toBe(false)
  })
  test('open across the whole window is year-round', () => {
    expect(seasonPhrase({ firstOpen: '2026-09-01', seasonEnd: WINDOW_END, seasonEndKnown: false, nextOpen: null, prevEnd: null }, '2026-09-28', WINDOW_END)).toBe(`Open year-round${P}`)
  })
  test('closed now with a posted reopening', () => {
    expect(seasonPhrase({ firstOpen: '2027-04-24', seasonEnd: '2027-08-31', seasonEndKnown: false, nextOpen: null, prevEnd: '2026-10-10' }, '2026-11-15', WINDOW_END)).toBe(`Closed since Oct 10; reopens Apr 24, 2027${P}`)
  })
  test('closed now with nothing posted', () => {
    expect(seasonPhrase({ firstOpen: null, seasonEnd: null, seasonEndKnown: false, nextOpen: null, prevEnd: '2026-10-10' }, '2026-11-15', WINDOW_END)).toBe(`Closed since Oct 10; next season not posted yet${P}`)
  })
  test('not open yet and never was in the window', () => {
    expect(seasonPhrase({ firstOpen: '2027-04-24', seasonEnd: '2027-08-31', seasonEndKnown: false, nextOpen: null, prevEnd: null }, '2027-03-01', WINDOW_END)).toBe(`Opens Apr 24, through at least Aug 31${P}`)
  })
  test('no open days at all', () => {
    expect(seasonPhrase({ firstOpen: null, seasonEnd: null, seasonEndKnown: false, nextOpen: null, prevEnd: null }, '2026-09-28', WINDOW_END)).toBe(`Closed for the next 12 months${P}`)
  })
})
