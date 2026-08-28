# Extracting developed-site exhibits from order PDFs

Agencies publish orders as PDFs; some are scans. This is the prompt that worked for the 2026 season — give it to one agent per 2–3 forests and run them in parallel.

> You are extracting developed-site exhibit lists from USFS/BLM California fire restriction orders. Work in a scratch directory. Use `curl` to download PDFs; `pdftotext -layout` if text-based, otherwise render pages with `pdftoppm -r 150 -png` (not higher — disk is limited) and read the images; delete PNGs when done.
>
> Forests: [name, order number if known, alerts page URL, expected site count if known].
>
> For each forest report: order number, effective/expiry dates, the COMPLETE list of exhibit site names exactly as printed (JSON array of strings; keep words like "Campground"/"Day Use Area"), whether the list is the complete exhibit, the wilderness exemption list, whether campfires at listed sites require a permit, and the PDF/page URL you used. Flag anything ambiguous. If a PDF cannot be found, say so plainly rather than guessing.

Things that have bitten before:
- **Press release ≠ order.** BLM Bishop's release implied developed-site fires were fine; the signed order banned all open flame. Always cite the signed order.
- **Exhibits get revised mid-season without a new order number** (Six Rivers, Aug 2026). Record the page's "last updated" date in `noticeUpdated` so the verify bot can spot the next one.
- **Bundled names** ("Ice House: Campground, Boatramp, and Day Use") — keep the base name so `namesMatch` catches every facility at that complex.
- **Apostrophes** in names (White's Bar, Martin's Dairy) need escaping in the TS file.
- Duplicate names across forests (Sand Flat, Aspen, Big Flat) are different sites — matching is scoped per forest, so that's fine.
