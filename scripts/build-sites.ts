/**
 * Build-time merge of every campground source into public/data/sites-index.json (lean: ~100 B/site) plus
 * public/data/sites-detail-N.json chunks read when a card opens. Runs in `bun run build`; outputs are not committed.
 */
import { buildSites, splitSites, type CspSite, type OsmSite, type RidbExtra, type RidbSite, type SitePage } from '../src/lib/mergeSites'
const dir = new URL('../public/data/', import.meta.url)
const read = async <T>(f: string, fallback: T): Promise<T> => { const file = Bun.file(new URL(f, dir)); return (await file.exists()) ? ((await file.json()) as T) : fallback }
const fc = await read<GeoJSON.FeatureCollection<GeoJSON.Point>>('sites.json', { type: 'FeatureCollection', features: [] })
const sites = buildSites(fc, await read<Record<string, SitePage>>('site-pages.json', {}), await read<RidbSite[]>('ridb-sites.json', []), await read<Record<string, RidbExtra>>('ridb-extra.json', {}), await read<CspSite[]>('csp-sites.json', []), await read<OsmSite[]>('osm-sites.json', []))
const { index, chunks } = splitSites(sites)
await Bun.write(new URL('sites-index.json', dir), JSON.stringify(index))
for (const [i, c] of chunks.entries()) await Bun.write(new URL(`sites-detail-${i}.json`, dir), JSON.stringify(c))
const kb = (f: string) => (Bun.file(new URL(f, dir)).size / 1024).toFixed(0)
console.log(`sites-index.json: ${index.length} sites, ${kb('sites-index.json')} KB; ${chunks.length} detail chunks ≈ ${kb('sites-detail-0.json')} KB each`)
