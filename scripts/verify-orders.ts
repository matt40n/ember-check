/**
 * Re-check every tracked fire order against its agency's web page.
 *
 *   bun run verify           # report only
 *   bun run verify --stamp   # also bump verifiedOn (today) for entries that PASS
 *
 * For each USFS/BLM/NPS entry it fetches the source page and the forest's alerts index, then checks:
 *   - the source page is reachable and still mentions the order number
 *   - the alerts index doesn't list a newer fire-related alert than the order's effective date
 * Anything that fails stays at its old verifiedOn, so the app drops it to "Unverified" after 14 days.
 * This is a smell test, not a parser: read the flagged pages yourself before updating the data.
 */
import { JURISDICTIONS } from '../src/data/restrictions'
import type { Jurisdiction } from '../src/types'

const stamp = process.argv.includes('--stamp')
const jsonOut = process.argv[process.argv.indexOf('--json') + 1]
const writeJson = process.argv.includes('--json') && !!jsonOut
const today = new Date().toISOString().slice(0, 10)
const UA = 'ember-check/1.0 (campfire restriction map; personal use)'

async function text(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(30_000) })
    if (!r.ok) return null
    return (await r.text()).replace(/\s+/g, ' ')
  } catch {
    return null
  }
}

function alertsIndexFor(j: Jurisdiction): string | null {
  const m = j.sourceUrl.match(/^(https?:\/\/(?:www\.)?fs\.usda\.gov\/r0\d\/[a-z-]+)\/alerts/)
  return m ? `${m[1]}/alerts` : null
}

/** Pull "Title ... Month D, YYYY" pairs that look like fire alerts out of a USFS alerts index. */
function fireAlerts(html: string): { title: string; date: string }[] {
  const out: { title: string; date: string }[] = []
  const re = /<a[^>]*href="[^"]*\/alerts\/[^"]*"[^>]*>([^<]{5,140})<\/a>[\s\S]{0,400}?((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 20\d\d)/g
  for (const m of html.matchAll(re)) {
    const title = m[1].trim()
    if (/fire|campfire|restriction|closure|order/i.test(title)) out.push({ title, date: m[2] })
  }
  return out
}

/** ISO date the page says it was last updated (og:updated_time, article:modified_time, or "Last updated: Month D, YYYY"). */
function pageUpdatedOn(html: string): string | null {
  const meta = html.match(/(?:og:updated_time|article:modified_time)"\s+content="(\d{4}-\d{2}-\d{2})/i) ?? html.match(/content="(\d{4}-\d{2}-\d{2})[^"]*"\s+property="(?:og:updated_time|article:modified_time)"/i)
  if (meta) return meta[1]
  const text = html.match(/(?:last updated|updated on|date updated)[^A-Za-z0-9]{0,20}((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 20\d\d)/i)
  if (text) {
    const d = new Date(text[1])
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return null
}

const results: { id: string; name: string; status: 'PASS' | 'WARN' | 'FAIL'; notes: string[]; sourceUrl: string }[] = []

for (const j of JURISDICTIONS.filter((x) => x.boundary)) {
  const notes: string[] = []
  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS'

  const page = await text(j.sourceUrl)
  if (!page) {
    status = 'FAIL'
    notes.push(`source page unreachable: ${j.sourceUrl}`)
  } else if (j.orderNumber && /\d{2}/.test(j.orderNumber) && !/\.pdf(\?|$)/i.test(j.sourceUrl)) {
    // Only meaningful for HTML pages and real order IDs (PDF bodies and "Superintendent's ..." labels can't be text-matched)
    const token = j.orderNumber.split(/[ –/]/)[0]
    if (!page.includes(token)) {
      status = 'FAIL'
      notes.push(`order "${token}" no longer mentioned on source page — likely superseded`)
    }
  } else if (/\.pdf(\?|$)/i.test(j.sourceUrl)) {
    notes.push('source is a PDF — reachable, but contents not checked; open it to confirm')
  }

  if (page) {
    // The agency page was edited after the notice date we recorded — Six Rivers revised its exhibit this way
    // on 2026-08-20 without changing the order number.
    const updated = pageUpdatedOn(page)
    if (updated && j.noticeUpdated && updated > j.noticeUpdated) {
      if (status === 'PASS') status = 'WARN'
      notes.push(`source page updated ${updated}, after the notice date on file (${j.noticeUpdated}) — re-read it for changed stages or exhibits`)
    }
    // If the page transcribes the exhibit, every listed site should still be on it.
    if (j.developedSitesComplete && j.developedSitesListed?.length) {
      // Compare on squashed text (no spaces/punctuation) using the site's first distinctive word or two, so
      // "Kangaroo Lake Campground and Picnic Area" still matches a page that says "Kangaroo Lake Campground".
      const squash = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '')
      const GENERIC = /^(campground|campgrounds|group|camp|day|use|area|picnic|site|trailhead|campsite|and|the|of|primitive|fee|walkin|upper|lower|north|south|east|west|big|little|lake|creek|flat|meadow|meadows|springs|spring|point|mountain|mt|river|fork)$/
      const key = (n: string) => {
        const words = n.replace(/\(.*?\)/g, '').toLowerCase().split(/[^a-z0-9']+/).map((w) => w.replace(/'/g, '')).filter(Boolean)
        const sig = words.filter((w) => !GENERIC.test(w))
        const first = sig[0] ?? words[0]
        const idx = words.indexOf(first)
        return first.length >= 7 ? first : words.slice(idx, idx + 2).join('')
      }
      const flat = squash(page.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'"))
      // Fallback on the first distinctive word alone so "Carr/Feeley Lake" or a misspelled alias doesn't nag.
      const firstWord = (n: string) => n.replace(/\(.*?\)/g, '').toLowerCase().split(/[^a-z0-9']+/).map((w) => w.replace(/'/g, '')).find((w) => w && !GENERIC.test(w)) ?? ''
      const onPage = (n: string) => { const w = firstWord(n); return flat.includes(key(n)) || (w.length >= 4 && flat.includes(w)) }
      const found = j.developedSitesListed.filter(onPage)
      // Only trust this when the page clearly carries the whole exhibit; many pages transcribe part of it.
      if (found.length >= j.developedSitesListed.length * 0.85) {
        const missing = j.developedSitesListed.filter((n) => !onPage(n))
        if (missing.length) {
          if (status === 'PASS') status = 'WARN'
          notes.push(`exhibit may have changed: ${missing.length} listed site(s) not found on the source page — ${missing.join(', ')}`)
        }
      }
    }
  }

  const idx = alertsIndexFor(j)
  if (idx) {
    const html = await text(idx)
    if (html) {
      const alerts = fireAlerts(html)
      const newer = alerts.filter((a) => j.effective && new Date(a.date) > new Date(j.effective))
      if (newer.length) {
        if (status === 'PASS') status = 'WARN'
        notes.push(`newer fire alerts since ${j.effective}: ${newer.map((a) => `"${a.title}" (${a.date})`).join('; ')}`)
      }
    } else notes.push(`alerts index unreachable: ${idx}`)
  }

  results.push({ id: j.id, name: j.name, status, notes, sourceUrl: j.sourceUrl })
  console.log(`${status.padEnd(4)} ${j.name}${notes.length ? '\n     - ' + notes.join('\n     - ') : ''}`)
}

const passed = results.filter((r) => r.status === 'PASS').map((r) => r.id)
console.log(`\n${passed.length} pass, ${results.filter((r) => r.status === 'WARN').length} warn, ${results.filter((r) => r.status === 'FAIL').length} fail`)

if (stamp && passed.length) {
  const path = new URL('../src/data/restrictions.ts', import.meta.url)
  let src = await Bun.file(path).text()
  for (const id of passed) {
    // bump only this entry's verifiedOn (entries use `verifiedOn: V`; switch passing ones to a literal date)
    src = src.replace(new RegExp(`(id: '${id}',[\\s\\S]*?verifiedOn: )V(,)`), `$1'${today}'$2`)
    src = src.replace(new RegExp(`(id: '${id}',[\\s\\S]*?verifiedOn: )'20\\d\\d-\\d\\d-\\d\\d'(,)`), `$1'${today}'$2`)
  }
  if (passed.length === results.length) src = src.replace(/export const DATA_VERIFIED_ON = '20\d\d-\d\d-\d\d'/, `export const DATA_VERIFIED_ON = '${today}'`)
  await Bun.write(path, src)
  console.log(`stamped verifiedOn = ${today} on ${passed.length} entries${passed.length === results.length ? ' and DATA_VERIFIED_ON' : ''}`)
}
if (writeJson) {
  await Bun.write(jsonOut, JSON.stringify({ ranOn: today, results }, null, 2))
  console.log(`wrote ${jsonOut}`)
}
process.exit(results.some((r) => r.status === 'FAIL') ? 2 : results.some((r) => r.status === 'WARN') ? 1 : 0)
