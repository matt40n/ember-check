import { describe, expect, test } from 'bun:test'
import { collapseIdentical } from './osm'

describe('one campsite tagged twice in OpenStreetMap', () => {
  test('a multipolygon relation and its outer way with the same name and point collapse to one row', () => {
    const rows = [
      { id: 'w683404866', name: 'Site 4', kind: 'Unknown operator', lat: 35.75639, lng: -120.89494 },
      { id: 'r9479841', name: 'Site 4', kind: 'Unknown operator', lat: 35.75639, lng: -120.89494 },
    ]
    expect(collapseIdentical(rows).map((r) => r.id)).toEqual(['w683404866'])
  })
  test('the row carrying more tags is the one kept, in the first row\'s position', () => {
    const rows = [
      { id: 'n1', name: 'Alder Camp', lat: 40, lng: -122, fee: null, website: null },
      { id: 'w1', name: 'Site 4', lat: 35.75639, lng: -120.89494, fee: null, website: null },
      { id: 'r1', name: 'Site 4', lat: 35.75639, lng: -120.89494, fee: 'No fee', website: 'https://example.org/' },
      { id: 'n2', name: 'Zephyr Camp', lat: 41, lng: -123, fee: null, website: null },
    ]
    expect(collapseIdentical(rows).map((r) => r.id)).toEqual(['n1', 'r1', 'n2'])
  })
  test('same name at a different point, or a different name at the same point, are separate sites', () => {
    const rows = [
      { id: 'r1', name: 'Site 4', lat: 35.75639, lng: -120.89494 },
      { id: 'r2', name: 'Site 5', lat: 35.75639, lng: -120.89494 },
      { id: 'r3', name: 'Site 4', lat: 35.75598, lng: -120.89443 },
    ]
    expect(collapseIdentical(rows)).toHaveLength(3)
  })
})
