The live site's oldest `verifiedOn` is at least 10 days old. At 14 days the app shows those orders as *Unverified* (grey) everywhere.

This normally can't happen while **Verify fire orders** is healthy — it re-stamps passing orders twice a week. So either that workflow is failing (check its issue / the Actions tab), or some orders keep failing verification and need a hand edit (see their own issue).

**Fastest fix**: run **Verify fire orders** manually from the Actions tab, or locally `bun run verify --stamp` and push. See [docs/runbooks/weekly.md](../blob/main/docs/runbooks/weekly.md).
