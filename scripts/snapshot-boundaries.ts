/**
 * Refresh the build-time boundary snapshots in public/data/ from the live ArcGIS services.
 * Run monthly by .github/workflows/snapshot-boundaries.yml; safe to run by hand: `bun run snapshot`.
 * A layer that fails to download keeps its previous snapshot (and the script exits non-zero so CI notices).
 */
import { SNAPSHOTS, type SnapshotName } from '../src/api/snapshot'

const out = new URL('../public/data/', import.meta.url)
const UA = 'ember-check/1.0 (campfire restriction map; boundary snapshot)'
let failed = 0
for (const [name, url] of Object.entries(SNAPSHOTS) as [SnapshotName, string][]) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120_000) })
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
    const fc = (await r.json()) as GeoJSON.FeatureCollection & { error?: unknown }
    if (fc.error || !Array.isArray(fc.features)) throw new Error(`bad response: ${JSON.stringify(fc).slice(0, 200)}`)
    if (fc.features.length < 5) throw new Error(`only ${fc.features.length} features — refusing to overwrite`)
    await Bun.write(new URL(`${name}.json`, out), JSON.stringify(fc))
    console.log(`${name.padEnd(11)} ${fc.features.length} features, ${(Bun.file(new URL(`${name}.json`, out)).size / 1024).toFixed(0)} KB`)
  } catch (e) {
    failed++
    console.error(`${name.padEnd(11)} FAILED — kept previous snapshot: ${(e as Error).message}`)
  }
}
process.exit(failed ? 1 : 0)
