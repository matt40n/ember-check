// src/lib/newsFeed.ts
/**
 * NPS news-release RSS (https://www.nps.gov/feeds/getNewsRSS.htm?id=<park>): one more place a park may say a
 * restriction started or ended. The verify bot warns when a fire-related release is newer than the entry's
 * notice date. Pure, so it is tested on sample XML. No XML library: the feed is plain RSS 2.0.
 */
export type NewsItem = { title: string; link: string; date: string; description: string }

export const FIRE_RELEASE = /fire (?:restriction|ban|order)|burn ban|campfire|open (?:flame|fire)|charcoal|wood fire|\bstage (?:1|2|i|ii)\b|restrictions? (?:lifted|rescinded|end)/i

const field = (item: string, tag: string) => {
  const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return ''
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()
}
const isoDate = (pubDate: string) => { const d = new Date(pubDate); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) }

export function parseRss(xml: string): NewsItem[] {
  if (!/<rss[\s>]|<channel[\s>]/i.test(xml)) return []
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => ({
    title: field(m[0], 'title'), link: field(m[0], 'link'), date: isoDate(field(m[0], 'pubDate')), description: field(m[0], 'description'),
  }))
}

export function fireReleasesSince(items: NewsItem[], since: string): NewsItem[] {
  return items.filter((i) => i.date && i.date > since && FIRE_RELEASE.test(`${i.title} ${i.description}`)).sort((a, b) => b.date.localeCompare(a.date))
}

export const npsNewsFeedUrl = (park: string) => `https://www.nps.gov/feeds/getNewsRSS.htm?id=${park}`
