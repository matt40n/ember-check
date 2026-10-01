import { describe, expect, test } from 'bun:test'
import { applyScheduled, pacificToday } from './scheduled'
import type { Jurisdiction } from '../types'

const plain: Jurisdiction = { id: 'usfs-plain', name: 'Plain NF', agency: 'USFS', lat: 0, lng: 0, radiusKm: 10, stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited', expires: '2026-12-31', sourceUrl: 'https://example.gov/order', verifiedOn: '2026-10-01' }
/** Shasta-Trinity on Oct 1, 2026: Stage 1 today, termination signed for Oct 2. */
const lifting: Jurisdiction = {
  ...plain, id: 'usfs-lifting', name: 'Lifting NF', effective: '2026-07-01', orderNumber: '14-26-07', sourceUrl: 'https://example.gov/lifted',
  developedSitesListed: ['A Campground'], developedSitesComplete: true, wildernessExempt: ['W Wilderness'], notes: 'Stage 1 rules.',
  scheduled: { on: '2026-10-02', summary: 'Fire restrictions lift', change: { stage: 'none', campfiresDispersed: 'allowed_with_permit', smoking: 'allowed', effective: '2026-10-02', expires: 'until_rescinded', orderNumber: undefined, developedSitesListed: undefined, developedSitesComplete: undefined, wildernessExempt: undefined, notes: 'Lifted.' } },
}

describe('applyScheduled', () => {
  test('before the date the entry keeps today\'s rules and its scheduled block', () => {
    const [j] = applyScheduled([lifting], '2026-10-01')
    expect(j.stage).toBe('stage1')
    expect(j.campfiresDispersed).toBe('prohibited')
    expect(j.scheduled?.on).toBe('2026-10-02')
  })
  test('on the date the scheduled fields replace the entry\'s and the block is gone', () => {
    const [j] = applyScheduled([lifting], '2026-10-02')
    expect(j.stage).toBe('none')
    expect(j.campfiresDispersed).toBe('allowed_with_permit')
    expect(j.smoking).toBe('allowed')
    expect(j.expires).toBe('until_rescinded')
    expect(j.notes).toBe('Lifted.')
    expect(j.scheduled).toBeUndefined()
  })
  test('fields the change sets to undefined are removed: no stale exhibit, order number or wilderness list', () => {
    const [j] = applyScheduled([lifting], '2026-10-02')
    expect(j.orderNumber).toBeUndefined()
    expect(j.developedSitesListed).toBeUndefined()
    expect(j.developedSitesComplete).toBeUndefined()
    expect(j.wildernessExempt).toBeUndefined()
  })
  test('fields the change does not mention are kept', () => {
    const [j] = applyScheduled([lifting], '2026-10-02')
    expect(j.campfiresDeveloped).toBe('allowed')
    expect(j.stoves).toBe('allowed_with_permit')
    expect(j.sourceUrl).toBe('https://example.gov/lifted')
    expect(j.id).toBe('usfs-lifting')
  })
  test('the change stays applied on later days', () => {
    expect(applyScheduled([lifting], '2026-11-15')[0].stage).toBe('none')
  })
  test('an entry without a scheduled block passes through untouched', () => {
    expect(applyScheduled([plain], '2026-10-02')[0]).toBe(plain)
  })
})

describe('pacificToday', () => {
  test('is the Pacific calendar date, so the flip happens at midnight Pacific wherever the visitor is', () => {
    expect(pacificToday(new Date('2026-10-02T06:30:00Z'))).toBe('2026-10-01') // 11:30 pm PDT on Oct 1
    expect(pacificToday(new Date('2026-10-02T07:00:00Z'))).toBe('2026-10-02') // midnight PDT
  })
})
