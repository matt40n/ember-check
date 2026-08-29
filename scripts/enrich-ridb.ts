/**
 * RIDB has no season field. Recreation.gov's availability calendar does: a month where every site is
 * "Closed" is out of season. For each reservable RIDB campground, read the next 12 months and record the
 * open window, plus the fuller fee text from Recreation.gov's campground endpoint.
 * Writes public/data/ridb-extra.json. ~1 request/0.3 s so the WAF stays calm; monthly via CI (`bun run ridb-extra`).
 */
const IN = new URL('../public/data/ridb-sites.json', import.meta.url)
const OUT = new URL('../public/data/ridb-extra.json', import.meta.url)
type Site = { id: string; reservable: boolean; name: string }
type MonthStatus = 'open' | 'closed' | 'unknown'
type Extra = { season: string | null; months: Record<string, MonthStatus>; firstOpen: string | null; lastOpen: string | null; fee: string | null; checkedOn: string }
const sites = (await Bun.file(IN).json()) as Site[]
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
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (d: string) => { const x = new Date(d); return `${MONTH[x.getUTCMonth()]} ${x.getUTCDate()}` }


/** Turn a 12-month open/closed/unknown map into one honest sentence, relative to the check date. */
export function phrase(months: Record<string, MonthStatus>, firstOpen: string | null, lastOpen: string | null, asOf: string): string | null {
  const keys = Object.keys(months)
  const vals = Object.values(months)
  const openN = vals.filter((m) => m === 'open').length, closedN = vals.filter((m) => m === 'closed').length
  if (openN + closedN === 0) return null
  const P = ' (Recreation.gov calendar)'
  if (openN === 0) return `Closed for the next ${vals.length} months${P}`
  if (closedN === 0 && openN >= 9) return `Open year-round${P}`
  const lastIdx = keys.indexOf(lastOpen!.slice(0, 7))
  const after = months[keys[lastIdx + 1]]
  const endKnown = after === 'closed'
  const atWindowEnd = lastIdx === keys.length - 1
  const tail = endKnown ? `through ${fmt(lastOpen!)}` : atWindowEnd ? `through at least ${fmt(lastOpen!)}` : `through ${fmt(lastOpen!)}; later dates not released yet`
  if (lastOpen! < asOf) return endKnown || !atWindowEnd ? `Closed since ${fmt(lastOpen!)}; next season not posted yet${P}` : `Closed since ${fmt(lastOpen!)}${P}`
  if (firstOpen! <= asOf) return `Open now, ${tail}${P}`
  return `Opens ${fmt(firstOpen!)}, ${tail}${P}`
}

if (process.argv.includes('--rephrase')) {
  const cur: Record<string, Extra> = await Bun.file(OUT).json()
  for (const v of Object.values(cur)) v.season = phrase(v.months, v.firstOpen, v.lastOpen, v.checkedOn)
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
    const months: Record<string, MonthStatus> = {}
    let firstOpen: string | null = null, lastOpen: string | null = null, known = 0
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1))
      const key = d.toISOString().slice(0, 7)
      const av = (await get(`https://www.recreation.gov/api/camps/availability/campground/${s.id}/month?start_date=${d.toISOString().slice(0, 10)}T00%3A00%3A00.000Z`)) as { campsites?: Record<string, { availabilities: Record<string, string> }> } | null
      await sleep(300)
      if (!av?.campsites) { months[key] = 'unknown'; continue }
      let anyKnown = false, anyOpen = false
      for (const c of Object.values(av.campsites)) for (const [day, st] of Object.entries(c.availabilities)) {
        if (st === 'NYR') continue // not yet released — tells us nothing about the season
        anyKnown = true
        if (st !== 'Closed' && st !== 'Not Available') { anyOpen = true; const dd = day.slice(0, 10); if (!firstOpen || dd < firstOpen) firstOpen = dd; if (!lastOpen || dd > lastOpen) lastOpen = dd }
      }
      months[key] = anyOpen ? 'open' : anyKnown ? 'closed' : 'unknown'
      if (anyKnown) known++
    }
    const season = phrase(months, firstOpen, lastOpen, stamp)
    if (!cg && !known) { failed++; continue }
    result[s.id] = { season, months, firstOpen, lastOpen, fee: cg?.campground?.facility_use_fee_description ? strip(cg.campground.facility_use_fee_description).slice(0, 400) : previous[s.id]?.fee ?? null, checkedOn: stamp }
    done++
    if (done % 50 === 0) console.log(`${done}/${sites.filter((x) => x.reservable).length}…`)
  }
}
await Promise.all(Array.from({ length: 2 }, worker))
await Bun.write(OUT, JSON.stringify(result))
console.log(`ridb-extra.json: ${done} campgrounds updated, ${failed} unreachable, ${Object.keys(result).length} total, ${(Bun.file(OUT).size / 1024).toFixed(0)} KB`)
