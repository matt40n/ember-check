Every USFS forest and BLM field office re-issues its fire restriction order between late May and mid-July, with a **new order number, new dates, and a fresh exhibit of developed sites**. The verify bot will flag each one as it appears ("newer fire alerts", "order no longer mentioned"), but it's faster to do the whole region in one sitting once most have posted — usually the second week of July.

**Runbook** (an afternoon with agent help; a weekend by hand)

1. For each unit in `src/data/restrictions.ts`, open its alerts page and find the new signed order PDF.
2. Extract the exhibit. Use the prompt in [docs/runbooks/extract-exhibits.md](docs/runbooks/extract-exhibits.md) — one agent per 2–3 forests. Render PDFs at **150 dpi max** and delete PNGs as you go (the scans filled a disk once).
3. Update each entry: `stage`, allowances, `effective`, `expires`, `orderNumber`, `noticeUpdated`, `sourceUrl`, `wildernessExempt`, `developedSitesListed`, `developedSitesComplete`.
4. `bun run check-exhibits` — the "N of M EDW sites listed" ratio per forest is the sanity check; a forest whose ratio drops sharply versus last year deserves a second look.
5. `bun run build`, push to main. The site redeploys itself and the verify bot takes over.
6. Close this issue.

**Low-confidence entries to re-check while you're at it**: Whiskeytown NRA, Redwood N&SP, Auburn SRA, Lake Tahoe local fire districts, Lava Beds stove terms, CAL FIRE burn-permit suspensions.
