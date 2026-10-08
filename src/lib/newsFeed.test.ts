// src/lib/newsFeed.test.ts
import { describe, expect, test } from 'bun:test'
import { FIRE_RELEASE, fireReleasesSince, npsNewsFeedUrl, parseRss } from './newsFeed'

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>nps.gov - Whiskeytown National Recreation Area - News Releases</title>
<item><title>National Park Service to Authorize Nearly 80 Miles of Trails for Bicycles at Whiskeytown National Recreation Area</title><link>https://www.nps.gov/whis/learn/news/bikes.htm</link><pubDate>Thu, 05 Feb 2026 10:25:00 EST</pubDate><description><![CDATA[Trails open to bikes.]]></description></item>
<item><title>Prescribed Burn to occur near the Visitor Center and East Beach on Saturday</title><link>https://www.nps.gov/whis/learn/news/rx.htm</link><pubDate>Thu, 24 Oct 2024 10:34:00 EST</pubDate><description><![CDATA[Fire crews will conduct a prescribed burn.]]></description></item>
<item><title>Whiskeytown lifts seasonal campfire restrictions</title><link>https://www.nps.gov/whis/learn/news/lift.htm</link><pubDate>Thu, 24 Sep 2026 09:00:00 EDT</pubDate><description><![CDATA[The seasonal ban on campfires &amp; charcoal ends Friday, September 25.]]></description></item>
</channel></rss>`

describe('parseRss', () => {
  test('reads title, link, date and description from each item', () => {
    const items = parseRss(RSS)
    expect(items).toHaveLength(3)
    expect(items[2]).toEqual({ title: 'Whiskeytown lifts seasonal campfire restrictions', link: 'https://www.nps.gov/whis/learn/news/lift.htm', date: '2026-09-24', description: 'The seasonal ban on campfires & charcoal ends Friday, September 25.' })
  })
  test('returns nothing for HTML or an empty body', () => {
    expect(parseRss('<!DOCTYPE html><html><body>Page not found</body></html>')).toEqual([])
    expect(parseRss('')).toEqual([])
  })
  test('an item with a bad pubDate keeps an empty date rather than throwing', () => {
    expect(parseRss('<rss><channel><item><title>x</title><link>l</link><pubDate>soon</pubDate></item></channel></rss>')[0].date).toBe('')
  })
})

describe('fireReleasesSince', () => {
  const items = parseRss(RSS)
  test('keeps fire-restriction releases newer than the notice date, newest first', () => {
    expect(fireReleasesSince(items, '2026-06-30').map((i) => i.title)).toEqual(['Whiskeytown lifts seasonal campfire restrictions'])
  })
  test('ignores releases on or before the notice date', () => {
    expect(fireReleasesSince(items, '2026-09-24')).toEqual([])
  })
  test('a prescribed-burn release is not a restriction', () => {
    expect(FIRE_RELEASE.test('Prescribed Burn to occur near the Visitor Center and East Beach on Saturday Fire crews will conduct a prescribed burn.')).toBe(false)
    expect(fireReleasesSince(items, '2024-01-01').map((i) => i.title)).toEqual(['Whiskeytown lifts seasonal campfire restrictions'])
  })
  test('items without a date are never "newer"', () => {
    expect(fireReleasesSince([{ title: 'campfire ban', link: '', date: '', description: '' }], '2026-01-01')).toEqual([])
  })
})

test('feed url', () => {
  expect(npsNewsFeedUrl('whis')).toBe('https://www.nps.gov/feeds/getNewsRSS.htm?id=whis')
})
