/**
 * BLM campgrounds and campsites in California from BLM's national recreation-sites point service — the
 * campgrounds BLM fire orders list (Douglas City, Steel Bridge, Reading Island…) are in no other feed.
 * Written to public/data/blm-sites.json; monthly via CI (`bun run blm`).
 */
const OUT = new URL('../public/data/blm-sites.json', import.meta.url)
const BASE = 'https://gis.blm.gov/arcgis/rest/services/recreation/BLM_Natl_Recs_pts/MapServer'
const LAYERS: [number, 'Campground Camping' | 'Dispersed Camping'][] = [[2, 'Campground Camping'], [3, 'Campground Camping'], [4, 'Dispersed Camping']]
type Attr = { OBJECTID: number; FET_NAME: string | null; FET_SUBTYPE: string | null; DESCRIPTION: string | null; WEB_LINK: string | null; WEB_DISPLAY: string | null; LAT: number; LONG: number }
const H = { 'User-Agent': 'ember-check/1.0 (campfire restriction map)' }
const rows: { id: string; name: string; kind: 'Campground Camping' | 'Dispersed Camping'; subtype: string | null; description: string | null; website: string | null; fee: string | null; reservable: boolean | null; lat: number; lng: number }[] = []
for (const [layer, kind] of LAYERS) {
  const q = new URLSearchParams({ where: "ADMIN_ST='CA'", outFields: 'OBJECTID,FET_NAME,FET_SUBTYPE,DESCRIPTION,WEB_LINK,WEB_DISPLAY,LAT,LONG', returnGeometry: 'false', f: 'json' })
  const d = (await (await fetch(`${BASE}/${layer}/query?${q}`, { headers: H, signal: AbortSignal.timeout(60_000) })).json()) as { features?: { attributes: Attr }[]; error?: unknown }
  if (!d.features) throw new Error(`layer ${layer}: ${JSON.stringify(d.error ?? d).slice(0, 200)}`)
  for (const { attributes: a } of d.features) {
    if (!a.FET_NAME || !a.LAT || !a.LONG || a.WEB_DISPLAY === 'NO') continue
    // BLM's own typos, corrected so exhibit names match ('Junction City' is in the Redding order)
    const FIX: Record<string, string> = { 'Juntion City': 'Junction City', 'Dune Buggy Contact Statio': 'Dune Buggy Contact Station' }
    let name = a.FET_NAME.trim().replace(/\s+CG$/i, ' Campground')
    for (const [bad, good] of Object.entries(FIX)) name = name.replace(bad, good)
    if (/^(campground|campsite|camp)$/i.test(name.trim())) continue // nameless point
    if (kind === 'Campground Camping' && !/campground|camp\b|site/i.test(name)) name += ' Campground'
    const sub = a.FET_SUBTYPE ?? ''
    rows.push({
      id: `blm-${layer}-${a.OBJECTID}`, name, kind, subtype: a.FET_SUBTYPE,
      description: a.DESCRIPTION?.trim() || null, website: a.WEB_LINK && /^https?:\/\//.test(a.WEB_LINK) ? a.WEB_LINK : null,
      fee: /\bFee\b/i.test(sub) ? 'Fee charged (per BLM)' : /No Fee|Free/i.test(sub) ? 'No fee (per BLM)' : null,
      reservable: /Reservable/i.test(sub) ? !/Non Reservable/i.test(sub) : null,
      lat: +a.LAT.toFixed(5), lng: +a.LONG.toFixed(5),
    })
  }
}
// A campground and its campsite points overlap (Douglas City + 'Douglas City CG'); keep the campground row
const norm = (s: string) => s.toLowerCase().replace(/\b(campground|cg|camp|site)\b/g, '').replace(/[^a-z]/g, '')
const out = rows.filter((r, i) => !rows.some((o, j) => j < i && norm(o.name) === norm(r.name) && Math.abs(o.lat - r.lat) < 0.02 && Math.abs(o.lng - r.lng) < 0.02))
const prevCount = (await Bun.file(OUT).exists()) ? ((await Bun.file(OUT).json()) as unknown[]).length : 0
if (prevCount && out.length < prevCount * 0.8) { console.error(`refusing to write: ${out.length} rows vs ${prevCount} previously`); process.exit(1) }
await Bun.write(OUT, JSON.stringify(out))
console.log(`blm-sites.json: ${out.length} BLM sites in California (${rows.length} before dedupe), ${(Bun.file(OUT).size / 1024).toFixed(0)} KB`)
