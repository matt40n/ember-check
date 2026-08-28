#!/usr/bin/env bash
# upsert-issue.sh "<title>" "<body>" <label>
# Creates the issue (assigned to $ASSIGNEE, which triggers a GitHub email) or, if an open issue with the
# same title exists, comments on it instead — so a recurring problem is one thread, not a pile of issues.
set -euo pipefail
title="$1"; body="$2"; label="${3:-bot}"
gh label create "$label" --color 8B4513 --description "opened by Ember Check automation" 2>/dev/null || true
existing=$(gh issue list --state open --label "$label" --search "\"$title\" in:title" --json number,title --jq ".[] | select(.title == \"$title\") | .number" | head -1)
if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "$body"
  echo "commented on #$existing"
else
  gh issue create --title "$title" --body "$body" --label "$label" --assignee "$ASSIGNEE"
fi
