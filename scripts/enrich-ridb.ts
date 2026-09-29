/**
 * RIDB has no season field. Recreation.gov's availability calendar does: bookable days simply stop at the end of
 * the season (or turn "Closed"), so the last bookable night is an exact closing date. For each reservable RIDB
 * campground, read the next 12 months, fold them into one status per day (src/lib/season.ts) and record the
 * season window, plus the fuller fee text from Recreation.gov's campground endpoint.
 * Writes public/data/ridb-extra.json. ~1 request/0.3 s so the WAF stays calm; monthly via CI (`bun run ridb-extra`).
 */
import { dayStatuses, seasonWindow, seasonPhrase, type DayStatus, type SeasonWindow } from '../src/lib/season'
const IN = new URL('../public/data/ridb-sites.json', import.meta.url)
const OUT = new URL('../public/data/ridb-extra.json', import.meta.url)
type Site = { id: string; reservable: boolean; name: string }
type Extra = SeasonWindow & { season: string | null; windowEnd: string; fee: string | null; feeMin?: number | null; feeMax?: number | null; checkedOn: string }
const UNLOC = new URL('../public/data/ridb-unlocated.json', import.meta.url)
const sites = [...((await Bun.file(IN).json()) as Site[]), ...(((await Bun.file(UNLOC).exists()) ? await Bun.file(UNLOC).json() : []) as Site[])]
const previous: Record<string, Extra> = (await Bun.file(OUT).exists()) ? await Bun.file(OUT).json() : {}
const today = new Date()
const stamp = today.toISOString().slice(0, 10)
const H = { 'User-Agent': 'Mozilla/5.0 (compatible; ember-check/1.0; campfire restriction map)', Accept: 'application/json' }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim()

async function get(url: string, attempt = 0): Promise<unknown | null> {
  try {
    const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(30_000) })
    if (r.status === 200) return await r.json()
    if ((r.status === 403 || r.status === 429 || r.status >= 500) && attempt < 4) { await sleep((r.status === 403 ? 20_000 : 3000) * (attempt + 1)); return get(url, attempt + 1) }
    return null
  } catch {
    if (attempt < 2) { await sleep(3000); return get(url, attempt + 1) }
    return null
  }
}
/** The 12 calendar months from this one; the window ends on the last day of the twelfth. */
const monthStart = (i: number) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1))
const windowEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 12, 0)).toISOString().slice(0, 10)
/** Every day of the month starting at d, as ISO dates — to mark a month whose fetch failed as unknown. */
const daysOf = (d: Date) => Array.from({ length: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate() }, (_, i) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), i + 1)).toISOString().slice(0, 10))

if (process.argv.includes('--rephrase')) {
  const cur: Record<string, Extra> = await Bun.file(OUT).json()
  for (const v of Object.values(cur)) if (v.windowEnd) v.season = seasonPhrase(v, v.checkedOn, v.windowEnd)
  await Bun.write(OUT, JSON.stringify(cur))
  console.log(`rephrased ${Object.keys(cur).length} seasons`)
  process.exit(0)
}

const result: Record<string, Extra> = { ...previous }
let done = 0, failed = 0
const queue = sites.filter((s) => s.reservable)
async function worker() {
  for (;;) {
    const s = queue.shift()
    if (!s) return
    const cg = (await get(`https://www.recreation.gov/api/camps/campgrounds/${s.id}`)) as { campground?: { facility_use_fee_description?: string } } | null
    await sleep(300)
    // Nightly rates by season and site type (what the Seasons tab shows) → a min–max range
    const rates = (await get(`https://www.recreation.gov/api/camps/campgrounds/${s.id}/rates`)) as { rates_list?: { rate_map?: Record<string, { per_night?: number; per_person?: number }> }[] } | null
    await sleep(300)
    const nightly = (rates?.rates_list ?? []).flatMap((r) => Object.values(r.rate_map ?? {}).map((x) => x.per_night ?? 0)).filter((n) => n > 0)
    const feeMin = nightly.length ? Math.min(...nightly) : null, feeMax = nightly.length ? Math.max(...nightly) : null
    const days: Record<string, DayStatus> = {}
    let known = 0
    for (let i = 0; i < 12; i++) {
      const d = monthStart(i)
      const av = (await get(`https://www.recreation.gov/api/camps/availability/campground/${s.id}/month?start_date=${d.toISOString().slice(0, 10)}T00%3A00%3A00.000Z`)) as { campsites?: Record<string, { availabilities: Record<string, string> }> } | null
      await sleep(300)
      // A failed fetch must not read as "closed": mark its days unknown so a season ending there stays "at least"
      if (!av?.campsites) { for (const dd of daysOf(d)) days[dd] = 'unknown'; continue }
      const ds = dayStatuses(av)
      Object.assign(days, ds)
      if (Object.values(ds).some((st) => st === 'open' || st === 'closed')) known++
    }
    const window = seasonWindow(days, stamp, windowEnd)
    const season = seasonPhrase(window, stamp, windowEnd)
    if (!known) { // availability blocked or empty: keep last month's season rather than blanking it
      if (previous[s.id]) result[s.id] = { ...previous[s.id], fee: cg?.campground?.facility_use_fee_description ? strip(cg.campground.facility_use_fee_description).slice(0, 400) : previous[s.id].fee, checkedOn: stamp }
      failed++
      continue
    }
    result[s.id] = { season, ...window, windowEnd, fee: cg?.campground?.facility_use_fee_description ? strip(cg.campground.facility_use_fee_description).slice(0, 400) : previous[s.id]?.fee ?? null, feeMin: feeMin ?? previous[s.id]?.feeMin ?? null, feeMax: feeMax ?? previous[s.id]?.feeMax ?? null, checkedOn: stamp }
    done++
    if (done % 50 === 0) console.log(`${done}/${sites.filter((x) => x.reservable).length}…`)
  }
}
await Promise.all(Array.from({ length: 2 }, worker))
if (failed > 0.3 * (done + failed)) { console.error(`too many unreachable (${failed}/${done + failed}) — keeping previous ridb-extra.json`); process.exit(1) }
await Bun.write(OUT, JSON.stringify(result))
console.log(`ridb-extra.json: ${done} campgrounds updated, ${failed} unreachable, ${Object.keys(result).length} total, ${(Bun.file(OUT).size / 1024).toFixed(0)} KB`)
