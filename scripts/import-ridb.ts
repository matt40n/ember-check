/**
 * Pull every California campground out of the RIDB (Recreation.gov) full export and write
 * public/data/ridb-sites.json. Adds NPS, BLM, USACE, Reclamation and reservable USFS sites that the USFS
 * EDW feed doesn't carry. No API key: RIDB publishes a 250 MB CSV zip nightly. Monthly via CI (`bun run ridb`).
 */
import { $ } from 'bun'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ZIP = 'https://ridb.recreation.gov/downloads/RIDBFullExport_V1_CSV.zip'
const OUT = new URL('../public/data/ridb-sites.json', import.meta.url)
const AGENCY: Record<string, string> = { '126': 'BLM', '127': 'FWS', '128': 'NPS', '129': 'Reclamation', '130': 'USACE', '131': 'USFS' }
// Coarse California outline (lng, lat), clockwise from the NW corner — enough to keep AZ/NV/OR sites out.
const CA: [number, number][] = [[-124.5, 42.0], [-120.0, 42.0], [-120.0, 39.0], [-114.6, 35.0], [-114.5, 32.7], [-117.1, 32.5], [-118.6, 33.6], [-120.7, 34.4], [-122.5, 37.2], [-124.5, 40.3]]
const inCA = (lng: number, lat: number) => {
  let inside = false
  for (let i = 0, j = CA.length - 1; i < CA.length; j = i++) {
    const [xi, yi] = CA[i], [xj, yj] = CA[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Minimal RFC 4180 reader: quoted fields, doubled quotes, embedded newlines. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = [], field = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const head = rows[0].map((h) => h.replace(/^﻿/, ''))
  return rows.slice(1).filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])))
}
const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()

const dir = mkdtempSync(join(tmpdir(), 'ridb-'))
const zip = join(dir, 'ridb.zip')
console.log('downloading RIDB export…')
const r = await fetch(ZIP, { headers: { 'User-Agent': 'ember-check/1.0 (campfire restriction map)' } })
if (!r.ok) throw new Error(`RIDB download failed: ${r.status}`)
await Bun.write(zip, await r.arrayBuffer())
await $`unzip -o -q ${zip} Facilities_API_v1.csv FacilityAddresses_API_v1.csv RecAreas_API_v1.csv Campsites_API_v1.csv -d ${dir}`.quiet()

const facilities = parseCsv(await Bun.file(join(dir, 'Facilities_API_v1.csv')).text())
const states = new Map(parseCsv(await Bun.file(join(dir, 'FacilityAddresses_API_v1.csv')).text()).map((a) => [a.FacilityID, a.AddressStateCode]))
const recAreas = new Map(parseCsv(await Bun.file(join(dir, 'RecAreas_API_v1.csv')).text()).map((a) => [a.RecAreaID, a.RecAreaName]))
const siteCounts = new Map<string, number>()
const sitePts = new Map<string, [number, number][]>()
for (const c of parseCsv(await Bun.file(join(dir, 'Campsites_API_v1.csv')).text())) {
  siteCounts.set(c.FacilityID, (siteCounts.get(c.FacilityID) ?? 0) + 1)
  const la = Number(c.CampsiteLatitude), lo = Number(c.CampsiteLongitude)
  if (la && lo) sitePts.get(c.FacilityID)?.push([la, lo]) ?? sitePts.set(c.FacilityID, [[la, lo]])
}
const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]
/**
 * RIDB facility points are sometimes plain wrong (Mary Smith's was 23 km from the campground its own
 * description locates). The individual campsite coordinates are surveyed; when ≥3 exist and their median
 * sits >500 m from the facility point, trust the campsites.
 */
function bestCoords(fid: string, lat: number, lng: number): [number, number] {
  const pts = sitePts.get(fid) ?? []
  if (pts.length < 3) return [lat, lng]
  const mla = median(pts.map((p) => p[0])), mlo = median(pts.map((p) => p[1]))
  const km = Math.hypot((mla - lat) * 111, (mlo - lng) * 85)
  return km > 0.5 ? [mla, mlo] : [lat, lng]
}

const out = facilities
  .filter((f) => f.FacilityTypeDescription === 'Campground' && f.Enabled === 'true' && f.FacilityLatitude && f.FacilityLongitude)
  .map((f) => ({ f, lat: Number(f.FacilityLatitude), lng: Number(f.FacilityLongitude) }))
  .filter(({ f, lat, lng }) => states.get(f.FacilityID) === 'CA' || (!states.has(f.FacilityID) && inCA(lng, lat)))
  .filter(({ lat, lng }) => inCA(lng, lat))
  .map(({ f, lat, lng }) => ({ f, pt: bestCoords(f.FacilityID, lat, lng) }))
  .map(({ f, pt: [lat, lng] }) => ({
    id: f.FacilityID,
    name: strip(f.FacilityName),
    agency: AGENCY[f.OrgFacilityID] ?? 'Federal',
    area: recAreas.get(f.ParentRecAreaID) ?? null,
    lat, lng,
    reservable: f.Reservable === 'true',
    sites: siteCounts.get(f.FacilityID) ?? null,
    fee: strip(f.FacilityUseFeeDescription).slice(0, 300) || null,
    description: strip(f.FacilityDescription).slice(0, 500) || null,
    stayLimit: strip(f.StayLimit).slice(0, 120) || null,
    phone: f.FacilityPhone || null,
    updated: f.LastUpdatedDate || null,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
  // RIDB carries duplicate facility rows for some campgrounds (same name and coordinates); keep the reservable one
  .filter((s, i, arr) => arr.findIndex((o) => o.name === s.name && Math.abs(o.lat - s.lat) < 0.002 && Math.abs(o.lng - s.lng) < 0.002 && (o.reservable || !s.reservable)) === i)
await Bun.write(OUT, JSON.stringify(out))
const by = out.reduce<Record<string, number>>((m, s) => ((m[s.agency] = (m[s.agency] ?? 0) + 1), m), {})
console.log(`ridb-sites.json: ${out.length} California campgrounds`, JSON.stringify(by), `${(Bun.file(OUT).size / 1024).toFixed(0)} KB`)
await $`rm -rf ${dir}`.quiet()
