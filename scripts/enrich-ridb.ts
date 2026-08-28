/**
 * RIDB has no season field. Recreation.gov's availability calendar does: a month where every site is
 * "Closed" is out of season. For each reservable RIDB campground, read the next 12 months and record the
 * open window, plus the fuller fee text from Recreation.gov's campground endpoint.
 * Writes public/data/ridb-extra.json. ~1 request/0.3 s so the WAF stays calm; monthly via CI (`bun run ridb-extra`).
 */
const IN = new URL('../public/data/ridb-sites.json', import.meta.url)
const OUT = new URL('../public/data/ridb-extra.json', import.meta.url)
type Site = { id: string; reservable: boolean; name: string }
type Extra = { season: string | null; openMonths: string[]; fee: string | null; checkedOn: string }
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

const result: Record<string, Extra> = { ...previous }
let done = 0, failed = 0
const queue = sites.filter((s) => s.reservable)
async function worker() {
  for (;;) {
    const s = queue.shift()
    if (!s) return
    const cg = (await get(`https://www.recreation.gov/api/camps/campgrounds/${s.id}`)) as { campground?: { facility_use_fee_description?: string } } | null
    await sleep(300)
    const openDays: string[] = []
    let known = 0
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1))
      const av = (await get(`https://www.recreation.gov/api/camps/availability/campground/${s.id}/month?start_date=${d.toISOString().slice(0, 10)}T00%3A00%3A00.000Z`)) as { campsites?: Record<string, { availabilities: Record<string, string> }> } | null
      await sleep(300)
      if (!av?.campsites) continue
      const byDay = new Map<string, boolean>()
      for (const c of Object.values(av.campsites)) for (const [day, st] of Object.entries(c.availabilities)) {
        if (st === 'NYR') continue // not yet released — tells us nothing
        known++
        if (st !== 'Closed' && st !== 'Not Available') byDay.set(day, true)
        else if (!byDay.has(day)) byDay.set(day, false)
      }
      for (const [day, open] of byDay) if (open) openDays.push(day)
    }
    openDays.sort()
    const months = [...new Set(openDays.map((d) => d.slice(0, 7)))]
    const season = openDays.length === 0 ? (known ? 'Closed for the next 12 months (per Recreation.gov calendar)' : null) : months.length >= 12 ? 'Open year-round (per Recreation.gov calendar)' : `Open ${fmt(openDays[0])} – ${fmt(openDays[openDays.length - 1])} (per Recreation.gov calendar)`
    if (!cg && !known) { failed++; continue }
    result[s.id] = { season, openMonths: months, fee: cg?.campground?.facility_use_fee_description ? strip(cg.campground.facility_use_fee_description).slice(0, 400) : previous[s.id]?.fee ?? null, checkedOn: stamp }
    done++
    if (done % 50 === 0) console.log(`${done}/${sites.filter((x) => x.reservable).length}…`)
  }
}
await Promise.all(Array.from({ length: 2 }, worker))
await Bun.write(OUT, JSON.stringify(result))
console.log(`ridb-extra.json: ${done} campgrounds updated, ${failed} unreachable, ${Object.keys(result).length} total, ${(Bun.file(OUT).size / 1024).toFixed(0)} KB`)
