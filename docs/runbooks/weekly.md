# Weekly check (≈ 20 minutes, fire season only)

The bots do the routine work. This is what's left for a human.

1. **Open issues labeled `bot`.** Each lists orders that failed or warned verification, with the reason.
   For each order: open the source link → find the current order → edit its entry in
   `src/data/restrictions.ts` → `bun run build && bun run check-exhibits` → push to main. Close the issue.
2. **Open issues labeled `field-report`.** Someone saw a sign or was told something that disagrees with the map.
   Trust signs over the map; if it's a site-specific quirk, add it to that jurisdiction's `siteNotes`.
   **Season closing dates:** a campground with a Recreation.gov calendar (even for part of its sites) gets its
   closing date from that calendar — `enrich-ridb` reads the last bookable night, and a few days early beats a
   wasted trip. Write a sign's date into `siteNotes` only for first-come, first-served campgrounds that have no
   calendar (Lassen's Big Pine and Cave, Oct 2026), and drop the note once something online carries a date.
3. **Glance at `public/status.json` on the live site** (`/status.json`): `expiringWithin14Days` is what will
   change next. Most orders are rescinded early after the first sustained rain — from late October, expect
   rescission notices rather than replacements.
4. **Nothing to do?** Then there's nothing to do. Don't bump `DATA_VERIFIED_ON` by hand — the verify bot does
   it when every order passes.

## If the verify bot itself is broken
`bun run verify --stamp` locally, push, and read the failing workflow run. It's almost always an agency
page redesign that broke `pageUpdatedOn()` in `scripts/verify-orders.ts` or `alertCards()` in `src/lib/alerts.ts`.

## "Newer fire alerts since …" / "alerts index not checked"
Both come from the forest's **alerts index** (`fs.usda.gov/r05/<forest>/alerts`), which every USFS entry is
checked against — including the ones whose source is a rescission news release, since that is where a
restriction that comes back after a dry spell will be posted.
- **Newer fire alerts:** the index lists a fire-restriction alert (campfire, fire restriction, Stage 1/2, fire
  ban, restrictions lifted or rescinded) that starts after the entry's `effective` date and isn't the entry's own
  `sourceUrl`. Road, trail and fire-area closures are ignored. Open the alert; if it changes the rules, update
  the entry and point `sourceUrl` at it. A district entry (Humboldt-Toiyabe's Carson and Bridgeport) skips alerts
  that name only other ranger districts.
- **Alerts index not checked:** the page loaded but no alerts could be read from it, so the forest redesigned the
  page and nothing is watching for new restrictions. Every USFS entry warns at once. Save the page over
  `src/lib/__fixtures__/usfs-alerts-index-shasta-trinity.html`, get `bun test` passing again, and fix
  `alertCards()` in `src/lib/alerts.ts`. (The old check failed silently this way from the 2026 redesign until Oct 1.)

## Write every entry out in full — never generate one from a loop
`verify --stamp` bumps `verifiedOn` by rewriting `src/data/restrictions.ts` as *text*, anchored on the literal
`id: '<id>',`. An entry whose id is built at runtime (``id: `calfire-${code}` `` in a `.map()`) has no such text,
so the rewrite matches nothing and the entry keeps its old date forever while the run still reports it as passing.
That is how the 11 CAL FIRE units went stale for 11 days (issue #9) — the workflow was green the whole time.
Share prose between similar entries with a `const`, not by generating the entries. The bot now fails the run and
names any passing entry it could not stamp, so this can't rot silently again.

## "The park removed its fire alert" / "posted a fire alert" / "BLM California's status page changed"
These come from each entry's **live status channel**, not its source page. Agencies rarely announce a lift: the
July news release stays posted, and the restriction just disappears from the park's alert banner (Lassen
Volcanic, Sep 3, 2026) or from the field office's section of BLM California's
[fire-restrictions page](https://www.blm.gov/programs/public-safety-and-fire/fire-and-aviation/regional-info/california/fire-restrictions).
- **Alert removed:** check the park's Alerts & Conditions page. If nothing replaced it, set `stage: 'none'` with
  the park's standing rules (usually fires only in campground rings), `confidence: 'medium'`, and a note saying
  there was no rescission notice. Lassen Volcanic and Lava Beds are the model entries.
- **Alert posted or changed:** the alert text is in the issue. Transcribe it. Park alerts are often the only
  place a restriction appears (Whiskeytown's 2026 burn ban never had a news release).
- **BLM section changed:** re-read that office's section. A lifted order usually shows up as a new "BLM lifts…"
  link or a shorter "Current Restrictions in Place" list.

Use `verifiedOn: V` on the entries you edit; the next verify run accepts their new fingerprints.

## If the fingerprint check nags on a page whose fire text did not really change
`bun run verify --rehash` rewrites every entry's `pageFireHash` and `statusHash` from the current pages (verifiedOn untouched). Do this only after reading the flagged pages.

**Changing the fingerprint recipe** (what `fireSentences`/`fireTextHash` in `src/lib/fingerprint.ts` look at — `bun test` covers it): bump `FINGERPRINT_VERSION` in the same commit. Stored hashes from an older version are re-seeded silently; without the bump every entry warns on the next run (issue #6 was exactly that).
