# Ember Check — NorCal campfire restrictions map

Where can I legally have a campfire in Northern California right now, and when does that change?

## Run

```
bun install
bun dev
```

## Data

- **Restriction stages** (`src/data/restrictions.ts`) are hand-verified from each agency's forest order / fire prevention order. Agencies publish these as PDFs, not APIs. Each entry carries `sourceUrl`, `orderNumber`, `expires`, and `verifiedOn`. Re-verify before each trip and bump `DATA_VERIFIED_ON`.
- **Boundaries** (`src/api/boundaries.ts`, `src/api/usfs.ts`, cached 24 h): USFS forest boundaries, ranger districts, wilderness areas and recreation sites (EDW), BLM field-office boundaries, NPS unit boundaries. Each restriction entry joins to its polygon via `boundary: { source, match }`; fills are colored by stage.
- **Wilderness exemptions**: `wildernessExempt` on a unit lists wildernesses where that order still allows campfires (with a CA Campfire Permit). They render green; wildernesses with no exemption render dotted/dark. Clicking inside one shows the exemption on the sign.
- **Campground pins** (zoom ≥ 8): every USFS campground / group / dispersed site from EDW. Click for a free/paid verdict (`src/lib/text.ts` parses the fee text — first dollar amount is the site fee), full fee text, reservations, season, hours, description, site rules, the Forest Service page, and a Recreation.gov search link. Pins live in a dedicated `sites` map pane so polygon layers can't cover them. Each pin's **ring color is a campfire verdict** for that exact spot (`src/lib/siteFire.ts`): the site's coordinates are resolved against the order polygons and wilderness exemptions — green = OK, amber = OK with a CA Campfire Permit, red = no campfires, grey = no tracked order. Dispersed sites use the order's dispersed rule; developed sites use the campground-ring rule.
- **Live conditions** (`src/api/nws.ts`, `src/api/nifc.ts`): Red Flag Warnings, active fires and perimeters refresh hourly (free, ~100 KB); NFDRS fire danger daily. No API keys required.

## Freshness rules (`src/lib/freshness.ts`)

- **Orders**: an entry is trusted for 14 days from `verifiedOn`, and never past `expires`. After that the app downgrades it to *Unverified* (grey) everywhere — fills, sign, pin verdicts — and the sign explains what the last known order was.
- **Site records**: USFS recreation text that names a year older than the current one is flagged *outdated* and its open/closed status is hidden; text with no year is flagged *undated*.
- **Campground ring verdicts** apply only to sites named in an order's exhibit of developed sites (`developedSitesListed`). Unlisted campgrounds under a restriction show "Rings only if listed in order" — free/undeveloped campgrounds (e.g. Gumboot, Shasta-Trinity) are usually not listed and get no wood fires.

## Confidence

Every order carries `noticeUpdated` (the date on the agency's own notice), `verifiedOn` (when we last checked it), and an optional `confidence` + `confidenceNote` for cases where sources conflict or the agency page looks unmaintained (e.g. Shasta-Trinity's order vs. the Gumboot site page; Whiskeytown's Nov 2025 conditions page). The sign and every campground card show all three so you can judge how much to trust a verdict.

## Re-verifying orders

```
bun run verify           # fetch every order's source page + forest alerts index, report PASS/WARN/FAIL
bun run verify --stamp   # also set verifiedOn = today on entries that pass
```
It checks the page is reachable, still mentions the order number, and that no newer fire alert has appeared since the order's effective date. It's a smell test — read anything flagged before editing the data.

## Updating restrictions

1. Open the forest's alerts page (`https://www.fs.usda.gov/alerts/<forest>/alerts-notices`) or BLM CA fire restrictions page.
2. Edit the matching entry in `src/data/restrictions.ts`: `stage`, per-activity allowances, `effective`, `expires`, `orderNumber`, `sourceUrl`, `verifiedOn`.
3. `bun run build` — types will catch mistakes.
