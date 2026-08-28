# Weekly check (≈ 20 minutes, fire season only)

The bots do the routine work. This is what's left for a human.

1. **Open issues labeled `bot`.** Each lists orders that failed or warned verification, with the reason.
   For each order: open the source link → find the current order → edit its entry in
   `src/data/restrictions.ts` → `bun run build && bun run check-exhibits` → push to main. Close the issue.
2. **Open issues labeled `field-report`.** Someone saw a sign or was told something that disagrees with the map.
   Trust signs over the map; if it's a site-specific quirk, add it to that jurisdiction's `siteNotes`.
3. **Glance at `public/status.json` on the live site** (`/status.json`): `expiringWithin14Days` is what will
   change next. Most orders are rescinded early after the first sustained rain — from late October, expect
   rescission notices rather than replacements.
4. **Nothing to do?** Then there's nothing to do. Don't bump `DATA_VERIFIED_ON` by hand — the verify bot does
   it when every order passes.

## If the verify bot itself is broken
`bun run verify --stamp` locally, push, and read the failing workflow run. It's almost always an agency
page redesign that broke `pageUpdatedOn()` or `fireAlerts()` in `scripts/verify-orders.ts`.
