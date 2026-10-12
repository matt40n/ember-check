#!/usr/bin/env bash
# manual-checks-issue.sh — on Saturdays, remind the maintainer of the social-media pages the bot cannot read,
# but only while some NPS unit is restricted, and only when verify opened no issue this run (otherwise the
# "Check by hand" section in that issue already covers it).
set -euo pipefail
n=$(jq -r '.manualChecks // [] | length' verify.json)
[ "$n" -gt 0 ] || { echo "no manual checks needed"; exit 0; }
ran=$(jq -r .ranOn verify.json)
list=$(jq -r '.manualChecks[] | "- \(.name) (`\(.stage)`): " + (.links | join(", "))' verify.json)
body="Weekly reminder for $ran. These units are restricted and announce changes in places the bot cannot read. Glance at each and, if a post says the restriction changed, update the entry (see the weekly runbook) with the post date as \`noticeUpdated\`.

$list

Close this issue when every unit above is lifted; the bot comments here each Saturday until then."
bash "$(dirname "$0")/upsert-issue.sh" "Ember Check: weekly manual checks" "$body" bot
