/**
 * Emit public/status.json at build time so the health workflow (and anyone curious) can read the live
 * site's data freshness without cloning the repo.
 */
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { JURISDICTIONS, DATA_VERIFIED_ON } from '../src/data/restrictions'

const now = new Date()
const tracked = JURISDICTIONS.filter((j) => j.boundary)
const oldest = tracked.map((j) => j.verifiedOn).sort()[0]
const expiring = JURISDICTIONS.filter((j) => j.expires !== 'until_rescinded' && differenceInCalendarDays(parseISO(j.expires), now) <= 14)
  .map((j) => ({ id: j.id, name: j.name, expires: j.expires }))
const status = {
  generatedAt: now.toISOString(),
  dataVerifiedOn: DATA_VERIFIED_ON,
  oldestVerifiedOn: oldest,
  oldestVerifiedAgeDays: differenceInCalendarDays(now, parseISO(oldest)),
  trackedOrders: tracked.length,
  expiringWithin14Days: expiring,
}
await Bun.write(new URL('../public/status.json', import.meta.url), JSON.stringify(status, null, 2) + '\n')
console.log(`status.json: oldest verifiedOn ${oldest} (${status.oldestVerifiedAgeDays}d), ${expiring.length} expiring soon`)
