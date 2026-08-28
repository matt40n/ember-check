# Ember Check — design (2026-08-28)

**Job:** answer "can I have a campfire here, right now, and when does that change?" for NorCal public land (USFS, BLM, NPS, CAL FIRE SRA, State Parks).

## Data reality
No agency in California publishes fire-restriction stages as an API (checked USFS R5, BLM CA, NIFC, NPS, ArcGIS Online). Orders are PDFs. So:
- `src/data/restrictions.ts` — hand-verified snapshot of every unit's current order: stage, per-activity allowances, effective/expiry, order number, source URL, verified date. Re-verify weekly in fire season.
- Live layers via public, key-less, CORS-open APIs: NWS alerts (Red Flag Warnings joined to NOAA fire-zone polygons), NIFC WFIGS incidents + perimeters, NIFC CA_NFDRS ERC percentile by PSA, USFS EDW forest boundaries, BLM SMA tiles, Open-Meteo AQI, NWS point forecast.

## Architecture
Vite + React + TS + Tailwind v4, Leaflet/react-leaflet, TanStack Query. No backend.
- `api/` one module per source, each exporting a `use*` query hook.
- `hooks/useRedFlag` — point-in-zone test against active RFWs.
- `App` — probe logic: USFS polygon match → radius fallback (CAL FIRE units deprioritised) → "no tracked jurisdiction".
- `components/SignPanel` — the signature element (USFS brown/gold sign) with stage, countdown to expiry, allowances table, source link.

## Design
Palette: pine-900 ground, cream text, sign brown/gold; status green/amber/ember/deep-ember/grey. Type: Barlow Condensed display, Barlow body, JetBrains Mono for coords/countdowns. Desktop: left drawer; mobile: bottom sheet.

## Revision (2026-08-28, afternoon)
- Jurisdiction pins removed. Stage now rendered as fills over real boundary polygons: USFS forests (EDW), NPS units, BLM field offices (outline-only — those polygons cover private land too). CAL FIRE units and State Parks stay list-only with a radius fallback in the probe.
- Added ranger-district outlines, wilderness overlay (green = order exempts backcountry fires; dotted = no exemption), and USFS campground / group / dispersed site pins (visible at zoom ≥ 8).
- Probe order: NPS → USFS → BLM polygon → radius fallback; also reports district and wilderness, and flips "Dispersed / backcountry" to "With permit" when the enclosing order exempts that wilderness.
- Cadence: boundaries and NFDRS daily; NWS alerts / NIFC fires hourly (cheap, no fees).
- Basemap desaturated (`.basemap` filter) so amber/ember fills read against terrain.
