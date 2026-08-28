/**
 * The USFS EDW feed still carries legacy `recarea/?recid=` links (which now redirect to the forest
 * homepage) and an `openstatus` nobody maintains. The redesigned per-site pages at
 * fs.usda.gov/r0X/<forest>/recreation/<slug> are the real source for both. This resolves each EDW site
 * to its page, reads the "Site Open / Closed" status and "Last updated" date, and writes
 * public/data/site-pages.json. Run weekly by CI (verify-orders.yml) and by `bun run enrich`.
 */
const FOREST_SLUG: Record<string, string> = {
  'Shasta-Trinity National Forest': 'r05/shasta-trinity',
  'Klamath National Forest': 'r05/klamath',
  'Six Rivers National Forest': 'r05/sixrivers',
  'Mendocino National Forest': 'r05/mendocino',
  'Modoc National Forest': 'r05/modoc',
  'Lassen National Forest': 'r05/lassen',
  'Plumas National Forest': 'r05/plumas',
  'Tahoe National Forest': 'r05/tahoe',
  'Eldorado National Forest': 'r05/eldorado',
  'Lake Tahoe Basin Management Unit': 'r05/laketahoebasin',
  'Stanislaus National Forest': 'r05/stanislaus',
  'Sierra National Forest': 'r05/sierra',
  'Inyo National Forest': 'r05/inyo',
  'Sequoia National Forest': 'r05/sequoia',
  'Humboldt-Toiyabe National Forest': 'r04/humboldt-toiyabe',
  'Rogue River-Siskiyou National Forest': 'r06/rogue-siskiyou',
  'Fremont-Winema National Forest': 'r06/fremont-winema',
}

export type SitePage = { url: string; status: 'open' | 'closed' | null; statusText: string | null; updated: string | null; checkedOn: string }
const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/\(.*?\)/g, '').replace(/[''.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const candidates = (name: string) => {
  const base = slugify(name)
  const out = [base]
  if (/-campground$/.test(base)) out.push(base.replace(/-campground$/, ''))
  else out.push(`${base}-campground`)
  out.push(base.replace(/-group-campground$/, '-group-camp'), base.replace(/-campgrounds?$/, '-campground'), base.replace(/-boat-in-/, '-boat-'), base.replace(/-camping-area$/, ''), base.replace(/-recreation-area$/, ''))
  return [...new Set(out)].filter(Boolean)
}

const today = new Date().toISOString().slice(0, 10)
const UA = 'ember-check/1.0 (campfire restriction map; site page check)'
const inPath = new URL('../public/data/sites.json', import.meta.url)
const outPath = new URL('../public/data/site-pages.json', import.meta.url)
const fc = (await Bun.file(inPath).json()) as GeoJSON.FeatureCollection
const previous: Record<string, SitePage> = (await Bun.file(outPath).exists()) ? await Bun.file(outPath).json() : {}

const statuses: Record<string, number> = {}
async function fetchPage(url: string, attempt = 0): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(45_000) })
    statuses[r.status] = (statuses[r.status] ?? 0) + 1
    if (r.status === 200) return await r.text()
    // fs.usda.gov's WAF answers 403 to bursts; wait it out rather than losing the site
    if ((r.status === 403 || r.status === 429 || r.status >= 500) && attempt < 4) {
      await new Promise((res) => setTimeout(res, (r.status === 403 ? 15_000 : 2000) * (attempt + 1)))
      return fetchPage(url, attempt + 1)
    }
    return null
  } catch (e) {
    statuses.error = (statuses.error ?? 0) + 1
    if (attempt < 2) { await new Promise((res) => setTimeout(res, 3000)); return fetchPage(url, attempt + 1) }
    return null
  }
}
function parse(html: string) {
  const statusCls = html.match(/class="wfs-status ([^"]*)"/)?.[1] ?? ''
  const heading = html.match(/status__heading[^>]*>([^<]*)</)?.[1]?.trim() ?? null
  const status: SitePage['status'] = /status--success/.test(statusCls) || /\bopen\b/i.test(heading ?? '') ? 'open' : /closed/i.test(heading ?? '') || /status--(error|danger)/.test(statusCls) ? 'closed' : null
  const upd = html.replace(/<[^>]+>/g, ' ').match(/Last updated\s+((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 20\d\d)/)?.[1]
  const updated = upd && !isNaN(new Date(upd).getTime()) ? new Date(upd).toISOString().slice(0, 10) : null
  return { status, statusText: heading, updated }
}

const keys = new Map<string, { name: string; forest: string }>()
for (const f of fc.features) {
  const p = f.properties as { recareaname: string; forestname: string }
  keys.set(`${p.forestname}|${p.recareaname}`, { name: p.recareaname, forest: p.forestname })
}
const result: Record<string, SitePage> = {}
let resolved = 0, missing = 0, failed = 0
const queue = [...keys.entries()]
async function worker() {
  for (;;) {
    const item = queue.shift()
    if (!item) return
    const [key, { name, forest }] = item
    const base = FOREST_SLUG[forest]
    if (!base) { missing++; continue }
    let hit: SitePage | null = null
    const tries = previous[key] ? [previous[key].url.replace(/^https:\/\/www\.fs\.usda\.gov\//, '').split('/').pop()!, ...candidates(name)] : candidates(name)
    for (const slug of [...new Set(tries)]) {
      const url = `https://www.fs.usda.gov/${base}/recreation/${slug}`
      await new Promise((res) => setTimeout(res, 300))
      const html = await fetchPage(url)
      if (html && /rec-intro|wfs-status/.test(html)) { hit = { url, ...parse(html), checkedOn: today }; break }
    }
    if (hit) { result[key] = hit; resolved++ }
    else if (previous[key]) { result[key] = previous[key]; failed++ } // keep the last good answer through a transient outage
    else missing++
  }
}
await Promise.all(Array.from({ length: 2 }, worker))
await Bun.write(outPath, JSON.stringify(result))
const open = Object.values(result).filter((s) => s.status === 'open').length
console.log('http statuses', JSON.stringify(statuses))
console.log(`site pages: ${resolved} resolved (${open} open, ${Object.values(result).filter((s) => s.status === 'closed').length} closed), ${failed} kept previous, ${missing} without a page, of ${keys.size} sites`)
