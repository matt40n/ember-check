#!/usr/bin/env bash
# Turn verify.json into one issue listing every order that needs a human look, with instructions.
set -euo pipefail
ran=$(jq -r .ranOn verify.json)
fails=$(jq -r '[.results[] | select(.status=="FAIL")] | length' verify.json)
warns=$(jq -r '[.results[] | select(.status=="WARN")] | length' verify.json)
rows=$(jq -r '.results[] | select(.status!="PASS") | "### \(.status) — \(.name) (`\(.id)`)\n" + (.notes | map("- " + .) | join("\n")) + "\n- Source: \(.sourceUrl)\n"' verify.json)
body="Ran $ran: **$fails FAIL**, **$warns WARN**. Entries below kept their old \`verifiedOn\`, so the map will show them as *Unverified* 14 days after that date unless you update them.

$rows

**What to do (≈ 5 min per order)** — details in [docs/runbooks/weekly.md](../blob/main/docs/runbooks/weekly.md)
1. Open the source link and the forest's alerts page. Find the current order (new number? new dates? changed exhibit?).
2. Edit that entry in \`src/data/restrictions.ts\`: \`stage\`, allowances, \`effective\`, \`expires\`, \`orderNumber\`, \`noticeUpdated\`, \`sourceUrl\`, and \`developedSitesListed\` if the exhibit changed. Set \`verifiedOn: V\`.
3. \`bun run build && bun run check-exhibits\`, commit, push to main. The site redeploys itself.
4. If the order was **rescinded** (no restrictions now): set \`stage: 'none'\` and point \`sourceUrl\` at the rescission notice — don't delete the entry.

Close this issue when done; the bot reopens a new one only if something regresses.

_Run: ${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}_"
bash "$(dirname "$0")/upsert-issue.sh" "Ember Check: $fails order(s) failed verification, $warns warned" "$body" bot
