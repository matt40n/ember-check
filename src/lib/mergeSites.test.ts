import { describe, expect, test } from 'bun:test'
import { buildSites, type RidbExtra, type RidbSite } from './mergeSites'

const CALENDAR = 'Open through Oct 10; reopens Apr 24, 2027 (Recreation.gov calendar)'
const edwHatCreek: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-121.4435, 40.6692] },
    properties: { recareaname: 'Hat Creek Campground', forestname: 'Lassen National Forest', markeractivity: 'Campground Camping', openstatus: 'open', recareaurl: null, restrictions: null, open_season_start: 'April', open_season_end: 'October', feedescription: null, recareadescription: null, reservation_info: null, operational_hours: null },
  }],
}
const ridbHatCreek: RidbSite = { id: '232248', name: 'Hat Creek Campground', agency: 'USFS', area: 'Lassen National Forest', lat: 40.6692, lng: -121.4435, reservable: true, sites: 12, fee: null, description: null, stayLimit: null, phone: null, updated: null }
const extra: RidbExtra = { season: CALENDAR, firstOpen: '2026-09-03', seasonEnd: '2026-10-10', seasonEndKnown: true, nextOpen: '2027-04-24', prevEnd: null, windowEnd: '2027-08-31', fee: null, feeMin: 16, feeMax: 80, checkedOn: '2026-09-28' }

describe('season precedence when a USFS site is also on Recreation.gov', () => {
  test('the calendar phrase with its exact closing date beats the forest feed\'s month range', () => {
    const [site] = buildSites(edwHatCreek, {}, [ridbHatCreek], { '232248': extra }, [], [])
    expect(site.season).toBe(CALENDAR)
  })
  test('the calendar\'s dated season window reaches the site, so the card can list closing and reopening dates', () => {
    const [site] = buildSites(edwHatCreek, {}, [ridbHatCreek], { '232248': extra }, [], [])
    expect({ firstOpen: site.firstOpen, seasonEnd: site.seasonEnd, seasonEndKnown: site.seasonEndKnown, nextOpen: site.nextOpen }).toEqual({ firstOpen: '2026-09-03', seasonEnd: '2026-10-10', seasonEndKnown: true, nextOpen: '2027-04-24' })
  })
  test('a Recreation.gov listing that ships without coordinates gets the same treatment once it is matched by name', () => {
    const unlocated = [{ id: '232248', name: 'Hat Creek Campground', agency: 'USFS', reservable: true, fee: null, description: null, hasCaAddress: true }]
    const [site] = buildSites(edwHatCreek, {}, [], { '232248': extra }, [], [], [], unlocated)
    expect(site.season).toBe(CALENDAR)
    expect(site.seasonEnd).toBe('2026-10-10')
    expect(site.nextOpen).toBe('2027-04-24')
  })
  test('without a calendar phrase the month range stays', () => {
    const [site] = buildSites(edwHatCreek, {}, [ridbHatCreek], { '232248': { ...extra, season: null } }, [], [])
    expect(site.season).toBe('April – October')
  })
})

import { splitSites } from './mergeSites'

test('season window dates stay on the index record so pins can judge a stay without loading detail', () => {
  const sites = buildSites(edwHatCreek, {}, [ridbHatCreek], { '232248': extra }, [], [])
  const { index, chunks } = splitSites(sites)
  expect(index[0].seasonEnd).toBe('2026-10-10')
  expect(index[0].seasonEndKnown).toBe(true)
  expect(chunks[0][0]?.season).toBe(CALENDAR)
  expect((chunks[0][0] as Record<string, unknown>)?.seasonEnd).toBeUndefined()
})
