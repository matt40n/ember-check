/**
 * County, regional, private and other campgrounds that no federal or state feed carries, from
 * OpenStreetMap (tourism=camp_site with a name, inside California) via Overpass. Written to
 * public/data/osm-sites.json; the app drops any that duplicate a federal/state record.
 * Data © OpenStreetMap contributors, ODbL — the card and map attribution say so. Monthly via CI (`bun run osm`).
 */
const OUT = new URL('../public/data/osm-sites.json', import.meta.url)
const QUERY = `[out:json][timeout:240];area["ISO3166-2"="US-CA"]->.ca;(node["tourism"="camp_site"]["name"](area.ca);way["tourism"="camp_site"]["name"](area.ca);relation["tourism"="camp_site"]["name"](area.ca););out center tags;`
const MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags: Record<string, string> }
let els: El[] | null = null
for (const m of MIRRORS) {
  try {
    const r = await fetch(m, { method: 'POST', body: 'data=' + encodeURIComponent(QUERY), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ember-check/1.0 (campfire restriction map)' }, signal: AbortSignal.timeout(300_000) })
    if (!r.ok) throw new Error(`${r.status}`)
    els = ((await r.json()) as { elements: El[] }).elements
    break
  } catch (e) {
    console.error(`${m}: ${(e as Error).message}`)
  }
}
if (!els) { console.error('Overpass unavailable — keeping previous osm-sites.json'); process.exit(1) }

/** Classify who runs it from operator/owner/website tags, so the card can say "County park" vs "private". */
function operatorKind(t: Record<string, string>): { kind: string; federal: boolean; state: boolean } {
  const s = `${t.operator ?? ''} ${t.owner ?? ''} ${t.website ?? ''} ${t['operator:type'] ?? ''}`.toLowerCase()
  if (/forest service|usfs|usda|fs\.usda|national forest/.test(s)) return { kind: 'USFS', federal: true, state: false }
  if (/national park|nps\.gov|\bnps\b/.test(s)) return { kind: 'NPS', federal: true, state: false }
  if (/bureau of land|\bblm\b/.test(s)) return { kind: 'BLM', federal: true, state: false }
  if (/army corps|usace|corps of engineers|lake sonoma|lake mendocino|black butte lake|eastman lake|hensley lake|pine flat|success lake|kaweah|new hogan|englebright|martis creek/.test(s)) return { kind: 'USACE', federal: true, state: false }
  if (/bureau of reclamation|usbr/.test(s)) return { kind: 'Reclamation', federal: true, state: false }
  if (/state park|parks\.ca\.gov|california department of parks|reservecalifornia/.test(s)) return { kind: 'State Parks', federal: false, state: true }
  if (/county|regional park|\bebrmud\b|\bebparks\b|\brpd\b|open space/.test(s)) return { kind: 'County / regional', federal: false, state: false }
  if (/\bcity of\b|municipal/.test(s)) return { kind: 'City', federal: false, state: false }
  if (/koa|resort|rv park|thousand trails|private|inc\b|llc\b|ranch/.test(s)) return { kind: 'Private', federal: false, state: false }
  if (t.operator || t.owner) return { kind: t.operator ?? t.owner!, federal: false, state: false }
  return { kind: 'Unknown operator', federal: false, state: false }
}

const out = els
  .map((e) => ({ e, lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon }))
  .filter((x): x is { e: El; lat: number; lng: number } => typeof x.lat === 'number' && typeof x.lng === 'number')
  .map(({ e, lat, lng }) => {
    const t = e.tags
    const op = operatorKind(t)
    return {
      id: `${e.type[0]}${e.id}`,
      name: t.name,
      operator: t.operator ?? t.owner ?? null,
      kind: op.kind,
      federalOrState: op.federal || op.state,
      lat: +lat.toFixed(5), lng: +lng.toFixed(5),
      backcountry: t.backcountry === 'yes',
      groupOnly: t.group_only === 'yes',
      fee: t.fee === 'no' ? 'No fee' : t.charge ?? t.cost ?? (t.fee === 'yes' ? 'Fee charged' : null),
      reservation: t.reservation ?? null,
      seasonal: t.seasonal ?? null,
      openingHours: t.opening_hours ?? null,
      capacity: t.capacity ? Number(t.capacity) || null : null,
      website: t.website ?? t['contact:website'] ?? null,
      phone: t.phone ?? t['contact:phone'] ?? null,
      description: (t.description ?? t.note ?? t.designation)?.slice(0, 300) ?? null,
      drinkingWater: t.drinking_water ?? null,
      toilets: t.toilets ?? null,
      fireplace: t.fireplace ?? t.openfire ?? null,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))
// Drop null/false fields to keep the payload small
const compact = out.map((s) => Object.fromEntries(Object.entries(s).filter(([, v]) => v !== null && v !== false)))
await Bun.write(OUT, JSON.stringify(compact))
const by = out.reduce<Record<string, number>>((m, s) => ((m[s.kind] = (m[s.kind] ?? 0) + 1), m), {})
console.log(`osm-sites.json: ${out.length} named camp sites in California`, JSON.stringify(by), `${(Bun.file(OUT).size / 1024).toFixed(0)} KB`)
