/**
 * California State Parks campgrounds from CDPR's open GIS data (data.ca.gov "Campgrounds" point layer,
 * joined to Park Boundaries for the park unit name). Written to public/data/csp-sites.json.
 * Monthly via CI (`bun run csp`). ReserveCalifornia has no open API, so cards link to its search.
 */
const OUT = new URL('../public/data/csp-sites.json', import.meta.url)
const CAMPS = 'https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/Campgrounds/FeatureServer/0/query?where=1%3D1&outFields=Campground,TYPE,SUBTYPE,UNITNBR,DETAIL&outSR=4326&f=geojson&resultRecordCount=2000'
const UNITS = 'https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkBoundaries/FeatureServer/0/query?where=1%3D1&outFields=UNITNBR,UNITNAME&returnGeometry=false&f=json&resultRecordCount=2000'
const H = { 'User-Agent': 'ember-check/1.0 (campfire restriction map)' }
const camps = (await (await fetch(CAMPS, { headers: H })).json()) as GeoJSON.FeatureCollection<GeoJSON.Point, { Campground: string; TYPE: string; SUBTYPE: string; UNITNBR: string; DETAIL: string }>
const units = (await (await fetch(UNITS, { headers: H })).json()) as { features: { attributes: { UNITNBR: string | number; UNITNAME: string } }[] }
const unitName = new Map(units.features.map((u) => [String(u.attributes.UNITNBR), u.attributes.UNITNAME]))
if (!camps.features?.length || !unitName.size) throw new Error('empty response from CDPR services')

const out = camps.features
  .filter((f) => f.geometry && f.properties.Campground)
  .map((f) => {
    const p = f.properties
    const park = unitName.get(String(p.UNITNBR)) ?? null
    return {
      id: `csp-${p.UNITNBR}-${f.id ?? Math.round(f.geometry.coordinates[0] * 1e4)}`,
      name: p.Campground.trim(),
      park,
      type: p.TYPE && p.TYPE !== 'Undefined' ? p.TYPE.replace(/ Area$/, '') : null,
      subtype: p.SUBTYPE && !/Not Defined|Multiple types/.test(p.SUBTYPE) ? p.SUBTYPE : null,
      detail: p.DETAIL && p.DETAIL !== p.Campground ? p.DETAIL : null,
      lat: +f.geometry.coordinates[1].toFixed(5),
      lng: +f.geometry.coordinates[0].toFixed(5),
    }
  })
  .sort((a, b) => (a.park ?? '').localeCompare(b.park ?? '') || a.name.localeCompare(b.name))
await Bun.write(OUT, JSON.stringify(out))
console.log(`csp-sites.json: ${out.length} state park campground points in ${new Set(out.map((s) => s.park)).size} parks (${out.filter((s) => !s.park).length} without a unit name), ${(Bun.file(OUT).size / 1024).toFixed(0)} KB`)
