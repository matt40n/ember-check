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

const results: { id: string; status: 'PASS' | 'WARN' | 'FAIL'; notes: string[] }[] = []

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

  results.push({ id: j.id, status, notes })
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
  await Bun.write(path, src)
  console.log(`stamped verifiedOn = ${today} on ${passed.length} entries`)
}
