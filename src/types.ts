export type Stage = 'none' | 'stage1' | 'stage2' | 'full_ban' | 'unknown'
export type Allow = 'allowed' | 'allowed_with_permit' | 'prohibited' | 'unknown'
export type Agency = 'USFS' | 'BLM' | 'NPS' | 'CAL FIRE' | 'State Parks'

export interface Jurisdiction {
  id: string
  name: string
  agency: Agency
  lat: number
  lng: number
  stage: Stage
  campfiresDeveloped: Allow
  campfiresDispersed: Allow
  stoves: Allow
  smoking: Allow
  effective?: string
  /** ISO date, or 'until_rescinded' */
  expires: string | 'until_rescinded'
  orderNumber?: string
  sourceUrl: string
  notes?: string
  verifiedOn: string
  /** Date the agency's notice/alert was posted or last updated (as shown on their page) */
  noticeUpdated?: string
  /** How sure we are the fire rules here are right; default 'high' when an order number is on file */
  confidence?: 'high' | 'medium' | 'low'
  /** Why confidence is less than high: conflicting pages, stale agency site, missing order, etc. */
  confidenceNote?: string
  /** Rough radius in km used to answer "am I inside this unit?" when no polygon */
  radiusKm: number
  /** How to join this unit to a boundary polygon from a live boundary service */
  boundary?: { source: 'usfs' | 'blm' | 'nps'; match: string }
  /** Wilderness areas where the order still allows campfires (with a CA Campfire Permit) */
  wildernessExempt?: string[]
  /** Extra text for the wilderness exemption (elevation limits etc.) */
  wildernessNote?: string
  /** Developed sites the order's exhibit explicitly allows ring fires at (may be partial — see notes) */
  developedSitesListed?: string[]
  /** true when developedSitesListed is the order's complete exhibit, so an unlisted site is definitively excluded */
  developedSitesComplete?: boolean
  /** 'any_developed' when the order has no exhibit and allows rings at every agency developed site (e.g. Humboldt-Toiyabe, BLM Arcata) */
  developedSitesRule?: 'exhibit' | 'any_developed'
  /** Site-specific caveats keyed by site name (matched with namesMatch); shown only on that site's card */
  siteNotes?: Record<string, string>
  /** Fingerprint of the fire-related sentences on the source page, written by `verify --stamp`; a later page edit that
   *  leaves these sentences unchanged (weather, road notes) is not worth a human read */
  pageFireHash?: string
  /** Set by applyFreshness() when the entry is too old or expired to trust */
  stale?: { reason: string; original: Jurisdiction }
}
