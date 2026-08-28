After the first sustained rain (typically late October–November) forests rescind their restriction orders early, and the rest expire on the dates in each entry. The map must say "no restrictions, here's the notice" — not "no tracked order".

**Runbook** (≈ 1 hour)

1. Check each unit's alerts page for a rescission notice ("Fire restrictions lifted", "Order terminated").
2. For rescinded or expired orders: **don't delete the entry.** Set `stage: 'none'`, `campfiresDeveloped`/`campfiresDispersed`: `'allowed_with_permit'` (a CA Campfire Permit is always required outside developed sites), `expires: 'until_rescinded'`, `orderNumber` to the rescission notice if it has one, `sourceUrl` to that notice, and clear `developedSitesListed` / `developedSitesComplete` / `wildernessExempt`. Keep `siteNotes`.
3. Wilderness permanent elevation limits (Sierra, Inyo, Stanislaus) still apply year-round — keep those in `wildernessNote`.
4. `bun run build`, push. Close this issue.

The verify bot keeps running weekly over winter (it just confirms the rescission pages still exist). The season-open reminder arrives May 15.
