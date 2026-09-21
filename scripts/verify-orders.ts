/**
 * Re-check every tracked fire order against its agency's web page.
 *
 *   bun run verify           # report only
 *   bun run verify --stamp   # also bump verifiedOn (today) for entries that PASS (and write pageFireHash)
 *   bun run verify --rehash  # rewrite every pageFireHash from the current pages (after a human read)
 *   bun run verify --json out.json
 *
 * For each USFS/BLM/NPS entry it fetches the source page and the forest's alerts index, then checks:
 *   - the source page is reachable and still mentions the order number
 *   - the alerts index doesn't list a newer fire-related alert than the order's effective date
 *   - the agency's live status channel (NPS park alerts, BLM CA field-office section) hasn't changed since the last
 *     human read — the one place a lifted restriction shows up when the original news release stays posted
 * Anything that fails stays at its old verifiedOn, so the app drops it to "Unverified" after 14 days.
 * This is a smell test, not a parser: read the flagged pages yourself before updating the data.
 */
import { JURISDICTIONS } from '../src/data/restrictions'
import type { Jurisdiction } from '../src/types'

const stamp = process.argv.includes('--stamp')
const rehash = process.argv.includes('--rehash')
const jsonOut = process.argv[process.argv.indexOf('--json') + 1]
const writeJson = process.argv.includes('--json') && !!jsonOut
const today = new Date().toISOString().slice(0, 10)
const UA = 'ember-check/1.0 (campfire restriction map; personal use)'

async function text(url: string, attempt = 0): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(30_000) })
    if (!r.ok) throw new Error(String(r.status))
    return (await r.text()).replace(/\s+/g, ' ')
  } catch {
    // County and small-agency sites blip; three tries over ~45 s before we call it unreachable
    if (attempt < 2) { await new Promise((res) => setTimeout(res, 15_000 * (attempt + 1))); return text(url, attempt + 1) }
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

/** Sentences on the page that talk about fire rules — the part of a conditions page that matters to us. */
function fireSentences(html: string): string[] {
  // Only the article body: site chrome (title, breadcrumb, 'current conditions' sidebar, menus) changes on its own
  let body = html.replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<title[\s\S]*?<\/title>/gi, ' ')
  const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ?? html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ?? html.match(/<div[^>]+id="main-content"[^>]*>([\s\S]*?)<footer/i)
  if (art) body = art[1]
  body = body.replace(/<(nav|aside|header|footer)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+class="[^"]*(breadcrumb|sidebar|related|share|social)[^"]*"[^>]*>[\s\S]*?<\/(div|ul|nav|section)>/gi, ' ')
  const text = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  return text
    .split(/(?<=[.!?])\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 40 && !/skip to |breadcrumb|current condition|fire danger:|\bmenu\b|official website|\(u\.s\.$/i.test(t))
    .filter((t) => /campfire|fire restriction|fire ban|open flame|stove|charcoal|wood fire|burn(?:ing)? (?:ban|restriction|permit)|stage [12i]/i.test(t))
}
/** Bump when the fingerprint recipe changes: a stored hash from an older recipe is replaced silently instead of paging a human. */
const FINGERPRINT_VERSION = 'v5'
function articleBody(html: string): string {
  const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ?? html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  return (art ? art[1] : html).replace(/<(nav|aside|header|footer)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
}
function fireTextHash(html: string): string {
  // Prose plus the order/PDF links *in the article*: a swapped order PDF with unchanged prose still changes the
  // hash, but the sidebar's list of other alerts (a new closure elsewhere on the forest) does not.
  // Same link may appear relative and absolute, encoded and not — the CMS alternates; treat those as one link
  const links = [...new Set([...articleBody(html).matchAll(/href="([^"]*(?:\/alerts\/[^"]*|\.pdf))"/gi)].map((m) => decodeURIComponent(m[1]).toLowerCase().replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '')))].sort().join('|')
  const s = (fireSentences(html).join('|') + '|' + links).toLowerCase().replace(/\d{1,2}:\d{2}\s*[ap]m/g, '').replace(/[^a-z0-9|]/g, '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return FINGERPRINT_VERSION + ':' + (h >>> 0).toString(36) + ':' + s.length.toString(36)
}
const hashes: Record<string, string> = {}

/**
 * Where an agency says what's in force *today*. A news release or announcement is written once and stays up after
 * the restriction ends — Lassen Volcanic dropped its Stage 2 alert on 2026-09-03 while its July release still read
 * "implements Stage 2" — so each NPS/BLM entry also watches a channel the agency edits when it lifts an order:
 *   - NPS: the park's alert feed (rendered client-side on every park page; parks post and remove restrictions there)
 *   - BLM: the field office's "Current Restrictions in Place" section of BLM California's statewide page
 */
const STATUS_VERSION = 's1'
const BLM_CA_STATUS = 'https://www.blm.gov/programs/public-safety-and-fire/fire-and-aviation/regional-info/california/fire-restrictions'
const FIRE_ALERT = /fire (?:restriction|ban|order)|burn ban|campfire|open (?:flame|fire)|charcoal|wood fire|\bstage (?:1|2|i|ii)\b/i
type NpsAlert = { title: string; description: string; start_date: string; end_date: string; is_active: number }
type Live = { url: string; recipe: string; hash: string; summary: string } | { url: string; error: string }
const squash = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
/** NPS feed dates look like "July, 24 2026 00:00:00"; 1900 means unset */
function npsDate(s: string): Date | null {
  const m = !s || s.includes('1900') ? null : s.match(/([A-Za-z]+),? (\d{1,2}),? (\d{4})/)
  const d = m ? new Date(`${m[1]} ${m[2]}, ${m[3]}`) : null
  return d && !isNaN(d.getTime()) ? d : null
}
/** Same window the park page uses to decide which alerts to show */
function inForce(a: NpsAlert, now: Date): boolean {
  const start = npsDate(a.start_date), end = npsDate(a.end_date)
  return a.is_active !== 0 && (!start || start <= now) && (!end || end.getTime() + 86_399_000 >= now.getTime())
}
let blmStatusPage: Promise<string | null> | null = null
async function liveStatus(j: Jurisdiction): Promise<Live | null> {
  const park = j.sourceUrl.match(/^https?:\/\/(?:www\.)?nps\.gov\/([a-z]{4})\//)?.[1]
  if (park) {
    const url = `https://www.nps.gov/${park}/park-alerts-${park}.json`
    const body = await text(url)
    let alerts: NpsAlert[]
    try { alerts = JSON.parse(body ?? '') } catch { return { url, error: body ? 'alert feed is not JSON' : 'alert feed unreachable' } }
    const now = new Date()
    const fire = alerts.filter((a) => inForce(a, now) && FIRE_ALERT.test(`${a.title} ${a.description}`))
    const titles = [...new Set(fire.map((a) => squash(a.title)))].sort()
    return { url, recipe: `${STATUS_VERSION}:nps`, hash: `${STATUS_VERSION}:nps:${titles.join('|') || 'none'}`, summary: fire.length ? fire.map((a) => `"${a.title}": ${a.description.trim()}`).join(' | ') : 'no fire-restriction alert posted' }
  }
  const office = j.agency === 'BLM' ? j.name.match(/^BLM (.+?) Field Office/)?.[1] : undefined
  if (office) {
    const url = `${BLM_CA_STATUS}#${office.replace(/ /g, '%20')}`
    const page = await (blmStatusPage ??= text(BLM_CA_STATUS))
    if (!page) return { url, error: 'BLM California fire-restrictions page unreachable' }
    // <dt>…Redding Field Office…</dt><dd>…the office's current restrictions and announcement links…</dd>
    const sec = page.match(new RegExp(`<dt[^>]*>(?:(?!</dt>).)*?${office} Field Office(?:(?!</dt>).)*</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>`))
    if (!sec) return { url, error: `no "${office} Field Office" section on the page` }
    const recipe = `${STATUS_VERSION}:blm:${FINGERPRINT_VERSION}`
    const said = sec[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    return { url, recipe, hash: `${STATUS_VERSION}:blm:${fireTextHash(`<article>${sec[1]}</article>`)}`, summary: `"${said.slice(0, 400)}${said.length > 400 ? '…' : ''}"` }
  }
  return null
}
const statuses: Record<string, string> = {}
/**
 * Everything below rewrites `restrictions.ts` as text, anchored on the entry's literal `id: '<id>',`. Two rules
 * keep that honest:
 *   - stay inside the entry: `[\s\S]*?` from one id will happily run past that entry's own fields into a later
 *     one (a passing entry's `verifiedOn: V` pattern would find the *next* entry's V and stamp that instead), so
 *     every pattern stops at the following `id: '`.
 *   - an id that isn't literally in the file matches nothing, and silence here reads as success — see the
 *     post-stamp check below.
 */
const IN_ENTRY = "(?:(?!id: ')[\\s\\S])*?"
/** Put `field: 'value',` right after the entry's id (replacing any old one) */
function setField(src: string, id: string, field: string, value: string): string {
  return src.replace(new RegExp(`(id: '${id}',)(${IN_ENTRY})(verifiedOn: )`), (_m, a: string, mid: string, c: string) => `${a} ${field}: '${value}',${mid.replace(new RegExp(`\\s*${field}: '[^']*',`), '')}${c}`)
}

const results: { id: string; name: string; status: 'PASS' | 'WARN' | 'FAIL'; notes: string[]; sourceUrl: string }[] = []
/** Entries a human just edited reference V for verifiedOn; their old fingerprint is expected to differ and is simply replaced. */
const srcNow = await Bun.file(new URL('../src/data/restrictions.ts', import.meta.url)).text()
const handEdited = (id: string) => new RegExp(`id: '${id}',${IN_ENTRY}verifiedOn: V,`).test(srcNow)

// Every entry, boundary or not: radius-only units (CAL FIRE, state parks, a ranger district) still have a page to check
for (const j of JURISDICTIONS) {
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

  // PDF sources get their fingerprint/date checks from a companion HTML page when the entry names one
  const checkPage = j.checkUrl ? await text(j.checkUrl) : null
  if (j.checkUrl && !checkPage) notes.push(`check page unreachable: ${j.checkUrl}`)
  const fpPage = checkPage ?? page
  if (fpPage) {
    const page = fpPage
    // The agency page was edited after the notice date we recorded — Six Rivers revised its exhibit this way
    // on 2026-08-20 without changing the order number.
    const updated = pageUpdatedOn(page)
    const hash = fireTextHash(page)
    hashes[j.id] = hash
    const staleRecipe = !!j.pageFireHash && !j.pageFireHash.startsWith(FINGERPRINT_VERSION + ':')
    if (staleRecipe) notes.push(`fingerprint recipe changed (${j.pageFireHash.split(':')[0] === j.pageFireHash ? 'v1' : j.pageFireHash.split(':')[0]} → ${FINGERPRINT_VERSION}); re-seeded, not a page change`)
    if (j.pageFireHash && !handEdited(j.id) && !staleRecipe) {
      // We have a fingerprint of the fire-related text: only a change to *that* text is worth a human read
      if (hash !== j.pageFireHash) {
        if (status === 'PASS') status = 'WARN'
        notes.push(`fire-related text on the source page changed${updated ? ` (page updated ${updated})` : ''} — re-read it: ${fireSentences(page).slice(0, 3).map((t) => `"${t.slice(0, 140)}"`).join(' | ')}`)
      }
    } else if (updated && j.noticeUpdated && updated > j.noticeUpdated) {
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

  const live = await liveStatus(j)
  if (live && 'error' in live) {
    // Without the live channel a lifted order goes unnoticed, so don't stamp this entry as verified
    if (status === 'PASS') status = 'WARN'
    notes.push(`live status not checked (${live.error}): ${live.url}`)
  } else if (live) {
    statuses[j.id] = live.hash
    const was = j.statusHash
    if (!was || !was.startsWith(live.recipe + ':')) notes.push(`live status now watched (${live.summary}): ${live.url}`)
    else if (was !== live.hash && !handEdited(j.id)) {
      if (status === 'PASS') status = 'WARN'
      if (live.recipe.endsWith(':nps')) {
        const before = was.slice(live.recipe.length + 1)
        notes.push(before === 'none'
          ? `the park posted a fire alert — a restriction may have started or changed: ${live.summary} — ${live.url}`
          : live.hash.endsWith(':none')
            ? `the park removed its fire alert (was: "${before}") — the restriction was probably lifted; parks post current restrictions as alerts and leave the original news release up. Confirm, then set stage 'none': ${live.url}`
            : `the park's fire alerts changed (was: "${before}") — now ${live.summary} — ${live.url}`)
      } else notes.push(`BLM California's status page changed this field office's section — re-read it (lifted or new restrictions show up here, not in the original announcement): ${live.summary} — ${live.url}`)
    }
  }

  // Page-derived text ends up in a GitHub issue body: strip Markdown/link/HTML syntax so a hostile page can't phish the maintainer
  const plain = (t: string) => t.replace(/[\[\]()<>`*_]/g, ' ').replace(/https?:\/\/\S+/g, (u) => (u.startsWith(j.sourceUrl.split('/').slice(0, 3).join('/')) ? u : '[link removed]')).replace(/\s+/g, ' ')
  results.push({ id: j.id, name: j.name, status, notes: notes.map(plain), sourceUrl: j.sourceUrl })
  console.log(`${status.padEnd(4)} ${j.name}${notes.length ? '\n     - ' + notes.join('\n     - ') : ''}`)
}

const passed = results.filter((r) => r.status === 'PASS').map((r) => r.id)
console.log(`\n${passed.length} pass, ${results.filter((r) => r.status === 'WARN').length} warn, ${results.filter((r) => r.status === 'FAIL').length} fail`)

if (stamp && passed.length) {
  const path = new URL('../src/data/restrictions.ts', import.meta.url)
  let src = await Bun.file(path).text()
  for (const id of passed) {
    // record the fire-text and live-status fingerprints so later cosmetic page edits don't page a human
    if (hashes[id]) src = setField(src, id, 'pageFireHash', hashes[id])
    if (statuses[id]) src = setField(src, id, 'statusHash', statuses[id])
    // bump only this entry's verifiedOn (entries use `verifiedOn: V`; switch passing ones to a literal date)
    src = src.replace(new RegExp(`(id: '${id}',${IN_ENTRY}verifiedOn: )V(,)`), `$1'${today}'$2`)
    src = src.replace(new RegExp(`(id: '${id}',${IN_ENTRY}verifiedOn: )'20\\d\\d-\\d\\d-\\d\\d'(,)`), `$1'${today}'$2`)
  }
  // Every entry we just reported as passing must now carry today's date. If one doesn't, its `id: '<id>',` isn't
  // in the file the way we expect (generated at runtime, renamed, reformatted) and the rewrite quietly did
  // nothing — the entry keeps its old date and the app greys it out at 14 days with no other warning. The 11
  // CAL FIRE units sat 11 days stale exactly this way while every run logged them as stamped (issue #9).
  const unstamped = passed.filter((id) => src.match(new RegExp(`id: '${id}',${IN_ENTRY}verifiedOn: ('20\\d\\d-\\d\\d-\\d\\d'|V),`))?.[1] !== `'${today}'`)
  // DATA_VERIFIED_ON (= V) is today's bulk-verification date. It's safe to bump whenever no *failing* entry still
  // references V — a failing entry pinned to a literal date keeps that date regardless.
  const failingUsesV = results.filter((r) => r.status !== 'PASS').some((r) => new RegExp(`id: '${r.id}',${IN_ENTRY}verifiedOn: V,`).test(src))
  if (!failingUsesV) src = src.replace(/export const DATA_VERIFIED_ON = '20\d\d-\d\d-\d\d'/, `export const DATA_VERIFIED_ON = '${today}'`)
  await Bun.write(path, src)
  console.log(`stamped verifiedOn = ${today} on ${passed.length - unstamped.length} of ${passed.length} passing entries${!failingUsesV ? ' and DATA_VERIFIED_ON' : ' (DATA_VERIFIED_ON held: a failing entry still references V)'}`)
  if (unstamped.length) {
    console.log(`\nNOT STAMPED — no \`id: '<id>',\` match in src/data/restrictions.ts for ${unstamped.length} passing entr${unstamped.length === 1 ? 'y' : 'ies'}:`)
    for (const id of unstamped) console.log(`     - ${id} (still ${JURISDICTIONS.find((j) => j.id === id)?.verifiedOn}) — spell this entry out with a literal id instead of generating it`)
    for (const id of unstamped) results.find((r) => r.id === id)!.status = 'FAIL'
  }
}
if (rehash) {
  const path = new URL('../src/data/restrictions.ts', import.meta.url)
  let src = await Bun.file(path).text()
  for (const [id, h] of Object.entries(hashes)) src = setField(src, id, 'pageFireHash', h)
  for (const [id, h] of Object.entries(statuses)) src = setField(src, id, 'statusHash', h)
  await Bun.write(path, src)
  console.log(`rehashed ${Object.keys(hashes).length} page and ${Object.keys(statuses).length} live-status fingerprints (verifiedOn untouched)`)
}
if (writeJson) {
  await Bun.write(jsonOut, JSON.stringify({ ranOn: today, results }, null, 2))
  console.log(`wrote ${jsonOut}`)
}
process.exit(results.some((r) => r.status === 'FAIL') ? 2 : results.some((r) => r.status === 'WARN') ? 1 : 0)
