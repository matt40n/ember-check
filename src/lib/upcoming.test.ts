import { describe, expect, test } from 'bun:test'
import { formatUpcomingDate, upcomingForJurisdiction, upcomingForSite } from './upcoming'
import type { Jurisdiction } from '../types'

const TODAY = '2026-10-01'
const stage1: Jurisdiction = { id: 'usfs-tahoe', name: 'Tahoe NF', agency: 'USFS', lat: 0, lng: 0, radiusKm: 10, stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited', expires: '2026-10-31', orderNumber: '17-26-15', sourceUrl: 'https://example.gov/order', verifiedOn: TODAY }
const lifting: Jurisdiction = { ...stage1, id: 'usfs-st', expires: '2026-12-31', orderNumber: '14-26-07', scheduled: { on: '2026-10-02', summary: 'Fire restrictions lift', change: { stage: 'none' } } }

describe('upcomingForJurisdiction', () => {
  test('lists a scheduled change that has not happened yet', () => {
    expect(upcomingForJurisdiction(lifting, TODAY)).toEqual([{ date: '2026-10-02', text: 'Fire restrictions lift' }])
  })
  test('lists the order\'s end date when restrictions are in force', () => {
    expect(upcomingForJurisdiction(stage1, TODAY)).toEqual([{ date: '2026-10-31', text: 'Fire order 17-26-15 ends, unless lifted earlier or renewed' }])
  })
  test('drops the order\'s end date when a scheduled change comes first, since the order will never reach it', () => {
    expect(upcomingForJurisdiction(lifting, TODAY).map((i) => i.date)).toEqual(['2026-10-02'])
  })
  test('can leave the end date out for a surface that already shows it', () => {
    expect(upcomingForJurisdiction(stage1, TODAY, { includeExpiry: false })).toEqual([])
  })
  test('has nothing to say for an open-ended order, a lifted forest, or an order already past its end', () => {
    expect(upcomingForJurisdiction({ ...stage1, expires: 'until_rescinded' }, TODAY)).toEqual([])
    expect(upcomingForJurisdiction({ ...stage1, stage: 'none' }, TODAY)).toEqual([])
    expect(upcomingForJurisdiction({ ...stage1, expires: '2026-09-30' }, TODAY)).toEqual([])
  })
})

describe('upcomingForSite', () => {
  test('a calendar that ends and resumes gives a closing night and a reopening, in date order', () => {
    expect(upcomingForSite({ firstOpen: '2026-09-04', seasonEnd: '2026-10-10', seasonEndKnown: true, nextOpen: '2027-04-23' }, TODAY)).toEqual([
      { date: '2026-10-10', text: 'Last bookable night of the season (Recreation.gov calendar)' },
      { date: '2027-04-23', text: 'Reopens (Recreation.gov calendar)' },
    ])
  })
  test('a campground that is closed now lists when it opens', () => {
    expect(upcomingForSite({ firstOpen: '2027-05-14', seasonEnd: '2027-08-31', seasonEndKnown: false, nextOpen: null }, TODAY)).toEqual([
      { date: '2027-05-14', text: 'Opens for the season (Recreation.gov calendar)' },
    ])
  })
  test('an end date the calendar has not confirmed is not listed as a closing', () => {
    expect(upcomingForSite({ firstOpen: '2026-09-04', seasonEnd: '2026-10-10', seasonEndKnown: false, nextOpen: null }, TODAY)).toEqual([])
  })
  test('a site with no calendar data lists nothing', () => {
    expect(upcomingForSite({}, TODAY)).toEqual([])
  })
})

describe('formatUpcomingDate', () => {
  test('names the weekday, and the year only when it is not this year', () => {
    expect(formatUpcomingDate('2026-10-02', TODAY)).toBe('Fri, Oct 2')
    expect(formatUpcomingDate('2027-04-23', TODAY)).toBe('Fri, Apr 23, 2027')
  })
})

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
