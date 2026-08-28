The monthly boundary refresh could not download at least one layer. The previous snapshot is still being served, so the site is fine for now.

**What to do**
- Nothing urgent. If this fails two months running, the agency changed its map service: open `src/api/snapshot.ts`, find the new layer URL on the agency's ArcGIS REST directory, update it, and run `bun run snapshot`.
