/** For each jurisdiction with developedSitesListed, report which exhibit names match an EDW site and which don't. */
import { JURISDICTIONS } from '../src/data/restrictions'
import { namesMatch } from '../src/lib/siteFire'
const ENV = 'geometry=-124.5,36.5,-118,42.1&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson'
const fc = await (await fetch(`https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecreationOpportunities_01/MapServer/0/query?where=markeractivity%20IN%20(%27Campground%20Camping%27,%27Dispersed%20Camping%27,%27Group%20Camping%27)&outFields=recareaname,forestname&${ENV}`)).json()
const sites: { name: string; forest: string }[] = fc.features.map((f: any) => ({ name: f.properties.recareaname, forest: f.properties.forestname ?? '' }))
for (const j of JURISDICTIONS) {
  if (!j.developedSitesListed) continue
  const inForest = sites.filter((s) => j.boundary?.source !== 'usfs' || s.forest === j.boundary.match)
  const hit: string[] = [], miss: string[] = []
  for (const n of j.developedSitesListed) (inForest.some((s) => namesMatch(n, s.name)) ? hit : miss).push(n)
  const matchedSites = inForest.filter((s) => j.developedSitesListed!.some((n) => namesMatch(n, s.name))).length
  console.log(`${j.name}: ${hit.length}/${j.developedSitesListed.length} exhibit names matched → ${matchedSites} of ${inForest.length} EDW sites listed${j.developedSitesComplete ? ' (complete)' : ' (partial)'}`)
  if (miss.length) console.log('   unmatched:', miss.join(' | '))
}
