# Bot: manual-check links and NPS news-release watch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the weekly verify bot (1) print, in every issue it writes and in a weekly reminder, the social-media links a human must glance at for NPS units that are restricted, and (2) watch each park's NPS news-release RSS feed for fire-related releases newer than the entry's notice date.

**Architecture:** A pure, tested module `src/lib/newsFeed.ts` parses an RSS document into items and picks the fire-related ones newer than a date. `scripts/verify-orders.ts` calls it for NPS entries as one more note (WARN), and writes a `manualChecks` list into `verify.json`. `.github/scripts/verify-issue.sh` renders that list as a "Check by hand" section; a new `.github/scripts/manual-checks-issue.sh` posts the same list on Saturdays when nothing else was reported, via the existing `upsert-issue.sh` (one open thread, comments appended).

**Tech Stack:** TypeScript on Bun (`bun test` runs in `bun run build`), bash + `jq` + `gh` in GitHub Actions.

**Spec:** this plan is its own spec; the decisions are recorded in the conversation of 2026-10-07 (Whiskeytown announced the end of its burn ban only on Facebook, 2026-09-24; the bot's NPS alert-feed watch saw nothing because the park left the stale alert up). Facebook has no public feed, so the check stays manual; the bot's job is to make sure it happens.

## Global Constraints

- `scripts/verify-orders.ts` may be concurrently edited by another branch that repairs `fireAlerts`/`alertsIndexFor` (see the task chip "Repair verify bot's alerts-index watch"). Keep edits to that file small and additive; put logic in `src/lib/newsFeed.ts`.
- Nothing in this plan changes an entry's `stage`, allowances or `verifiedOn`. Data changes are limited to adding `alsoCheck` arrays to NPS entries.
- The bot must never read or post to Facebook. Links are printed for a human.
- WARN notes use the same plain-text style as existing notes: one sentence, the fact, then the link.
- Tests use real sample XML, no mocks.

## Review Focus

1. An RSS feed with a release dated *before* the entry's notice date but about fire: must not warn (it is the release that led to the current entry). Test in Task 1.
2. A park whose feed URL returns HTML (NPS error page) or times out: must produce a single "news feed unreachable" note, not a crash or a WARN. Test in Task 1 (parser returns `[]` for non-XML) and Task 2 (unreachable → note only).
3. A release about a prescribed burn ("Prescribed Burn to occur near the Visitor Center"): must not match, or the bot cries wolf every autumn. Test in Task 1 with the real Whiskeytown title.
4. An entry at `stage: 'none'` with `alsoCheck` links: must not appear in the manual-check list (nothing to confirm). Test in Task 2.
5. Saturday run with an open "orders need a human look" issue: the reminder must append to that issue rather than open a second one. Covered by `upsert-issue.sh` semantics; Task 3 checks the title match by hand.

---

### Task 1: RSS parsing and fire-release filter

**Files:**
- Create: `src/lib/newsFeed.ts`
- Test: `src/lib/newsFeed.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type NewsItem = { title: string; link: string; date: string /* YYYY-MM-DD, from pubDate; '' if unparseable */; description: string }
  export function parseRss(xml: string): NewsItem[]            // [] for anything that is not an RSS document
  export const FIRE_RELEASE = /fire (?:restriction|ban|order)|burn ban|campfire|open (?:flame|fire)|charcoal|wood fire|\bstage (?:1|2|i|ii)\b|restrictions? (?:lifted|rescinded|end)/i
  export function fireReleasesSince(items: NewsItem[], since: string): NewsItem[]   // date > since and FIRE_RELEASE matches title or description; newest first
  export function npsNewsFeedUrl(park: string): string          // https://www.nps.gov/feeds/getNewsRSS.htm?id=<park>
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/newsFeed.test.ts
import { describe, expect, test } from 'bun:test'
import { FIRE_RELEASE, fireReleasesSince, npsNewsFeedUrl, parseRss } from './newsFeed'

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>nps.gov - Whiskeytown National Recreation Area - News Releases</title>
<item><title>National Park Service to Authorize Nearly 80 Miles of Trails for Bicycles at Whiskeytown National Recreation Area</title><link>https://www.nps.gov/whis/learn/news/bikes.htm</link><pubDate>Thu, 05 Feb 2026 10:25:00 EST</pubDate><description><![CDATA[Trails open to bikes.]]></description></item>
<item><title>Prescribed Burn to occur near the Visitor Center and East Beach on Saturday</title><link>https://www.nps.gov/whis/learn/news/rx.htm</link><pubDate>Thu, 24 Oct 2024 10:34:00 EST</pubDate><description><![CDATA[Fire crews will conduct a prescribed burn.]]></description></item>
<item><title>Whiskeytown lifts seasonal campfire restrictions</title><link>https://www.nps.gov/whis/learn/news/lift.htm</link><pubDate>Thu, 24 Sep 2026 09:00:00 EDT</pubDate><description><![CDATA[The seasonal ban on campfires &amp; charcoal ends Friday, September 25.]]></description></item>
</channel></rss>`

describe('parseRss', () => {
  test('reads title, link, date and description from each item', () => {
    const items = parseRss(RSS)
    expect(items).toHaveLength(3)
    expect(items[2]).toEqual({ title: 'Whiskeytown lifts seasonal campfire restrictions', link: 'https://www.nps.gov/whis/learn/news/lift.htm', date: '2026-09-24', description: 'The seasonal ban on campfires & charcoal ends Friday, September 25.' })
  })
  test('returns nothing for HTML or an empty body', () => {
    expect(parseRss('<!DOCTYPE html><html><body>Page not found</body></html>')).toEqual([])
    expect(parseRss('')).toEqual([])
  })
  test('an item with a bad pubDate keeps an empty date rather than throwing', () => {
    expect(parseRss('<rss><channel><item><title>x</title><link>l</link><pubDate>soon</pubDate></item></channel></rss>')[0].date).toBe('')
  })
})

describe('fireReleasesSince', () => {
  const items = parseRss(RSS)
  test('keeps fire-restriction releases newer than the notice date, newest first', () => {
    expect(fireReleasesSince(items, '2026-06-30').map((i) => i.title)).toEqual(['Whiskeytown lifts seasonal campfire restrictions'])
  })
  test('ignores releases on or before the notice date', () => {
    expect(fireReleasesSince(items, '2026-09-24')).toEqual([])
  })
  test('a prescribed-burn release is not a restriction', () => {
    expect(FIRE_RELEASE.test('Prescribed Burn to occur near the Visitor Center and East Beach on Saturday Fire crews will conduct a prescribed burn.')).toBe(false)
    expect(fireReleasesSince(items, '2024-01-01').map((i) => i.title)).toEqual(['Whiskeytown lifts seasonal campfire restrictions'])
  })
  test('items without a date are never "newer"', () => {
    expect(fireReleasesSince([{ title: 'campfire ban', link: '', date: '', description: '' }], '2026-01-01')).toEqual([])
  })
})

test('feed url', () => {
  expect(npsNewsFeedUrl('whis')).toBe('https://www.nps.gov/feeds/getNewsRSS.htm?id=whis')
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test src/lib/newsFeed.test.ts` → FAIL `Cannot find module './newsFeed'`

- [ ] **Step 3: Implement**

```ts
// src/lib/newsFeed.ts
/**
 * NPS news-release RSS (https://www.nps.gov/feeds/getNewsRSS.htm?id=<park>): one more place a park may say a
 * restriction started or ended. The verify bot warns when a fire-related release is newer than the entry's
 * notice date. Pure, so it is tested on sample XML. No XML library: the feed is plain RSS 2.0.
 */
export type NewsItem = { title: string; link: string; date: string; description: string }

export const FIRE_RELEASE = /fire (?:restriction|ban|order)|burn ban|campfire|open (?:flame|fire)|charcoal|wood fire|\bstage (?:1|2|i|ii)\b|restrictions? (?:lifted|rescinded|end)/i

const field = (item: string, tag: string) => {
  const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return ''
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()
}
const isoDate = (pubDate: string) => { const d = new Date(pubDate); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) }

export function parseRss(xml: string): NewsItem[] {
  if (!/<rss[\s>]|<channel[\s>]/i.test(xml)) return []
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => ({
    title: field(m[0], 'title'), link: field(m[0], 'link'), date: isoDate(field(m[0], 'pubDate')), description: field(m[0], 'description'),
  }))
}

export function fireReleasesSince(items: NewsItem[], since: string): NewsItem[] {
  return items.filter((i) => i.date && i.date > since && FIRE_RELEASE.test(`${i.title} ${i.description}`)).sort((a, b) => b.date.localeCompare(a.date))
}

export const npsNewsFeedUrl = (park: string) => `https://www.nps.gov/feeds/getNewsRSS.htm?id=${park}`
```

Note on the prescribed-burn test: the title and description contain "burn" and "fire" but none of the phrases in `FIRE_RELEASE`; keep the regex phrase-based, never bare "fire" or "burn".

- [ ] **Step 4: Run tests** → `bun test` all pass; `./node_modules/.bin/tsc -p .` silent.

- [ ] **Step 5: Commit**

```bash
git add src/lib/newsFeed.ts src/lib/newsFeed.test.ts
git commit -m "bot: parse NPS news-release RSS and pick fire-related releases newer than a date"
```

---

### Task 2: Verify script — news-release note and the manual-check list

**Files:**
- Modify: `src/types.ts` (add `alsoCheck?: string[]` after `checkUrl?`)
- Modify: `scripts/verify-orders.ts` (NPS branch of the per-entry loop; the `results` record; the `--json` output)
- Modify: `src/data/restrictions.ts` — add `alsoCheck` to the six NPS entries only

**Interfaces:**
- Consumes: `parseRss`, `fireReleasesSince`, `npsNewsFeedUrl` from `src/lib/newsFeed.ts`; the existing `text(url)` fetch helper and `results` array in `scripts/verify-orders.ts`.
- Produces: `verify.json` gains `manualChecks: { id: string; name: string; stage: string; links: string[] }[]` and each result keeps its shape (`id, name, status, notes, sourceUrl`).

- [ ] **Step 1: Type and data**

`src/types.ts`, after `checkUrl?: string`:

```ts
  /** Places the bot cannot read but a human should glance at while this unit is restricted (a park's Facebook page). Printed in the bot's issues. */
  alsoCheck?: string[]
```

`src/data/restrictions.ts`: in each of the six NPS entries, insert right after `id: '<id>', ` the field (scripted exact-string insert; do not touch `verifiedOn`):

```
nps-whiskeytown:      alsoCheck: ['https://www.facebook.com/WhiskeytownNationalRecreationArea'],
nps-lassen-volcanic:  alsoCheck: ['https://www.facebook.com/LassenNPS'],
nps-lava-beds:        alsoCheck: ['https://www.facebook.com/LavaBedsNPS'],
nps-point-reyes:      alsoCheck: ['https://www.facebook.com/PointReyesNPS'],
nps-yosemite:         alsoCheck: ['https://www.facebook.com/YosemiteNPS'],
nps-redwood:          alsoCheck: ['https://www.facebook.com/RedwoodNPS'],
```

Verify each URL resolves to the park's page (HTTP 200 with the park name in the `<title>`) with `curl -sL -o /dev/null -w '%{http_code}'` before committing; if one does not, search the park's nps.gov homepage footer for its Facebook link and use that.

- [ ] **Step 2: News-release note in the verify loop**

In `scripts/verify-orders.ts`, import `{ parseRss, fireReleasesSince, npsNewsFeedUrl } from '../src/lib/newsFeed'`. Inside the per-entry loop, after the live-status block and before `results.push(...)`, add:

```ts
  // NPS news releases: a park sometimes announces a start or lift here and nowhere the other checks look
  const park = j.sourceUrl.match(/^https?:\/\/(?:www\.)?nps\.gov\/([a-z]{4})\//)?.[1]
  if (park) {
    const feedUrl = npsNewsFeedUrl(park)
    const xml = await text(feedUrl)
    if (!xml) notes.push(`news feed unreachable: ${feedUrl}`)
    else {
      const since = j.noticeUpdated ?? j.effective ?? '2000-01-01'
      const fresh = fireReleasesSince(parseRss(xml), since)
      if (fresh.length) {
        if (status === 'PASS') status = 'WARN'
        notes.push(`park news release since ${since} mentions fire rules — read it: ${fresh.map((f) => `"${f.title}" (${f.date}) ${f.link}`).join(' | ')}`)
      }
    }
  }
```

`text()` collapses whitespace but leaves tags, which is what `parseRss` needs. Because the note compares against `noticeUpdated`, a human who reviews the release and bumps `noticeUpdated` silences it; no new hash field is required.

- [ ] **Step 3: Manual-check list in the JSON**

Where the script writes JSON (`if (writeJson) { … JSON.stringify({ ranOn: today, results }, null, 2) … }`), add the list:

```ts
  const manualChecks = JURISDICTIONS
    .filter((j) => j.alsoCheck?.length && j.stage !== 'none' && j.stage !== 'unknown')
    .map((j) => ({ id: j.id, name: j.name, stage: j.stage, links: j.alsoCheck! }))
  await Bun.write(jsonOut, JSON.stringify({ ranOn: today, results, manualChecks }, null, 2))
```

- [ ] **Step 4: Checks**

Run: `bun test && ./node_modules/.bin/tsc -p . && bunx tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --moduleResolution bundler --strict --types bun --ignoreConfig scripts/verify-orders.ts`
Then `bun run verify --json /tmp/v.json` and `jq '.manualChecks' /tmp/v.json`: Whiskeytown (stage none) must be absent; any NPS unit at Stage 1+ present with its link. Expect the run to stay 41 pass unless a park really has a newer fire release (if so, that is a real finding: say so in the PR, do not edit data).

- [ ] **Step 5: Commit**

```bash
git add src/types.ts scripts/verify-orders.ts src/data/restrictions.ts
git commit -m "bot: warn on NPS news releases about fire rules newer than the notice; list manual-check links in verify.json"
```

---

### Task 3: Issue text — "Check by hand" section and the Saturday reminder

**Files:**
- Modify: `.github/scripts/verify-issue.sh`
- Create: `.github/scripts/manual-checks-issue.sh`
- Modify: `.github/workflows/verify-orders.yml` (one new step)
- Modify: `docs/runbooks/weekly.md`

- [ ] **Step 1: Section in every bot issue**

In `verify-issue.sh`, after the `rows=` line, build the section and include it in `$body` after the rows:

```bash
checks=$(jq -r '.manualChecks // [] | if length == 0 then "" else "**Check by hand** — the bot cannot read these; glance at each while the unit is restricted:\n" + (map("- \(.name) (`\(.stage)`): " + (.links | join(", "))) | join("\n")) end' verify.json)
```

and in the body, between `$rows` and `**What to do**`, add a line `$checks`.

- [ ] **Step 2: Saturday reminder when nothing else was reported**

```bash
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
```

`chmod +x` it like its siblings.

- [ ] **Step 3: Workflow step**

In `.github/workflows/verify-orders.yml`, after the "Open or update issue for WARN/FAIL" step:

```yaml
      - name: Saturday reminder for checks the bot cannot do
        if: steps.verify.outputs.code == '0' && github.event.schedule == '0 13 * * 1,4,6'
        env:
          GH_TOKEN: ${{ github.token }}
          ASSIGNEE: ${{ github.repository_owner }}
        run: |
          [ "$(date -u +%u)" = "6" ] || { echo "not Saturday"; exit 0; }
          bash .github/scripts/manual-checks-issue.sh
```

(`github.event.schedule` is only set on cron fires, so a manual `workflow_dispatch` never posts the reminder.)

- [ ] **Step 4: Runbook**

In `docs/runbooks/weekly.md`, in the social-media bullet added on 2026-10-07, append: "The bot prints these links under **Check by hand** in every issue it opens, and on Saturdays with nothing else to report it comments on `Ember Check: weekly manual checks` while any NPS unit is restricted. Add a park's page with `alsoCheck` on its entry."

- [ ] **Step 5: Dry run and commit**

Run `bun run verify --json /tmp/v.json` (from Task 2) then `bash -n .github/scripts/manual-checks-issue.sh` and `bash -n .github/scripts/verify-issue.sh` for syntax; render the issue body without posting by replacing the final `bash … upsert-issue.sh` line with `echo "$body"` in a scratch copy and eyeballing the output.

```bash
git add .github/scripts/verify-issue.sh .github/scripts/manual-checks-issue.sh .github/workflows/verify-orders.yml docs/runbooks/weekly.md
git commit -m "bot: Check-by-hand links in issues and a Saturday reminder while NPS units are restricted"
```
