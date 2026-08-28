The scheduled order-verification workflow crashed, so `verifiedOn` stamps are not being refreshed. The map will start showing orders as *Unverified* about 14 days after the last successful run.

**What to do**
1. Open the failed run (link below). Usually it's an agency site redesign that breaks the parser in `scripts/verify-orders.ts`, or a dependency install.
2. Fix, push to main, and re-run **Verify fire orders** from the Actions tab.
3. Can't fix today? Run `bun run verify --stamp` locally and push — that buys another two weeks.

See [docs/runbooks/weekly.md](../blob/main/docs/runbooks/weekly.md).
