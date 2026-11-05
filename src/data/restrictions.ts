import type { Jurisdiction } from '../types'

/**
 * Hand-verified from agency forest orders / fire prevention orders on 2026-08-28.
 * Agencies publish these as PDFs, not APIs — re-verify weekly through fire season.
 * See README "Updating restrictions".
 */
export const DATA_VERIFIED_ON = '2026-11-05'
/** Exported (not just a local) so tsc's noUnusedLocals doesn't fail after `verify --stamp` pins every entry to a literal date. */
export const V = DATA_VERIFIED_ON

/** Ranger districts administered by a different forest than the polygon they sit in (Ukonom RD is Six Rivers-managed inside Klamath's boundary). */
export const DISTRICT_OVERRIDES: Record<string, string> = { 'Ukonom Ranger District': 'usfs-six-rivers' }

/** The 11 CAL FIRE units below differ only by unit, centre point and press release; these two fields are identical for all of them. */
const CALFIRE_NOTES = 'Residential debris-burn permits suspended in State Responsibility Area. Campfires in organized campgrounds and on private land with owner permission (and a CA Campfire Permit) remain legal unless a local ordinance says otherwise. This is the trigger counties use for local bans.'
const CALFIRE_CONFIDENCE_NOTE = 'Burn-permit suspensions are announced via press release, not a durable page; county ordinances may add campfire limits.'

export const JURISDICTIONS: Jurisdiction[] = [
  // ───────────── USFS Region 5 ─────────────
  {
    id: 'usfs-shasta-trinity', pageFireHash: 'v6:1szt7lh:bx', noticeUpdated: '2026-10-01', boundary: { source: 'usfs', match: 'Shasta-Trinity National Forest' }, name: 'Shasta-Trinity NF', agency: 'USFS', lat: 40.9, lng: -122.6, radiusKm: 70,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-10-02', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/shasta-trinity/alerts/2026-fire-restrictions-lifted',
    notes: 'Fire restrictions lifted effective Oct 2, 2026: a termination order for 14-26-07 was signed Oct 1 (press release the same day). From then a free CA Campfire Permit is all that is needed for a campfire or stove outside developed campgrounds. Standing orders still apply: 14-26-06 (through Jul 29, 2027) bans camping and ALL fires and stoves outside developed sites in the Mt. Shasta Plantation area around Mount Shasta city; 14-24-08 (through Nov 8, 2026) allows no campfires anywhere in the Mt. Shasta Wilderness, gas or liquid-fuel stoves only; 14-25-03 (through Sep 19, 2028) bans wood fires in the three Trinity Alps Wilderness campfire prohibition areas.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-klamath', pageFireHash: 'v6:fbfjaf:ow', noticeUpdated: '2026-09-24', boundary: { source: 'usfs', match: 'Klamath National Forest' }, name: 'Klamath NF', agency: 'USFS', lat: 41.6, lng: -123.0, radiusKm: 60,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-09-24', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/klamath/newsroom/releases/klamath-national-forest-rescinds-fire-restrictions-effective-midnight',
    notes: 'Fire restrictions rescinded effective midnight Sep 24, 2026 (press release dated Sep 23): Order 05-05-00-26-11 (Sep 9 – Oct 30) and its Exhibit A no longer apply, and the forest took the alert page down. Standing rules: a free CA Campfire Permit is required for any campfire, stove or barbecue outside a developed campground; fireworks and explosives are always prohibited. The forest says fire season is not over — check for a new order before you go. Ukonom RD inside this boundary is Six Rivers-managed and still follows the Six Rivers order.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-six-rivers', pageFireHash: 'v6:gb4kpq:16k', noticeUpdated: '2026-10-23', boundary: { source: 'usfs', match: 'Six Rivers National Forest' }, name: 'Six Rivers NF', agency: 'USFS', lat: 41.0, lng: -123.7, radiusKm: 55,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-10-23', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/sixrivers/newsroom/releases/six-rivers-national-forest-lifts-fire-restrictions-0',
    notes: 'All fire restrictions lifted effective Oct 23, 2026 (press release Oct 23): "the Six Rivers National Forest will be lifting all fire restrictions, effective October 23, 2026." Campfires in wilderness areas and dispersed campfires are allowed again with a valid CA Campfire Permit, which is also required for stoves and barbecues outside developed campgrounds. Order 10-26-05 (Stage 1 since Jul 3) is ended; the forest removed its fire-restrictions page.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-mendocino', pageFireHash: 'v6:8njl8j:7h', noticeUpdated: '2026-09-29', boundary: { source: 'usfs', match: 'Mendocino National Forest' }, name: 'Mendocino NF', agency: 'USFS', lat: 39.6, lng: -122.9, radiusKm: 55,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-09-30', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/mendocino/newsroom/releases/fire-restrictions-lift-sept-30',
    notes: 'Fire restrictions lifted Sep 30, 2026 at noon (press release Sep 29). With a valid CA Campfire Permit, open campfires and camp stoves are allowed again outside designated campgrounds. On Oct 1 the forest\'s alert for Order 08-26-08 was still posted, with a first line saying restrictions lift Sep 30.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-modoc', pageFireHash: 'v6:1m9g8mz:1ep', noticeUpdated: '2026-10-01', boundary: { source: 'usfs', match: 'Modoc National Forest' }, name: 'Modoc NF', agency: 'USFS', lat: 41.6, lng: -120.8, radiusKm: 65,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-09-27', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/modoc/alerts/forest-fire-restrictions-2026',
    notes: 'Fire restrictions (Order 09-26-01) lifted as of 12:01 a.m. Sep 27, 2026 (forest notice dated Sep 25). Campfires are allowed again outside developed campgrounds and recreation sites; a free CA Campfire Permit is still required. The page keeps the text of the old order below the notice.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-lassen', pageFireHash: 'v6:19vjjbr:vw', siteNotes: { 'Big Pine Campground': 'Closes for the season Oct 13, 2026 per the notice posted at the campground; nothing online carries a date (first-come, first-served, no Recreation.gov calendar).', 'Cave Campground': 'Closes for the season Oct 13, 2026 per the notice posted at the campground; nothing online carries a date (first-come, first-served, no Recreation.gov calendar).' }, siteDates: { 'Big Pine Campground': { closes: '2026-10-13', source: 'notice posted at the campground, late Sep 2026' }, 'Cave Campground': { closes: '2026-10-13', source: 'notice posted at the campground, late Sep 2026' } }, noticeUpdated: '2026-09-29', boundary: { source: 'usfs', match: 'Lassen National Forest' }, name: 'Lassen NF', agency: 'USFS', lat: 40.5, lng: -121.3, radiusKm: 50,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-10-01', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/lassen/newsroom/releases/lassen-national-forest-lift-fire-restrictions',
    notes: 'Fire restrictions rescinded effective midnight Oct 1, 2026 (press release Sep 29): Order 06-26-05 and its Exhibit A no longer apply, and the forest took the alert page down. Standing rules: a free CA Campfire Permit is required for campfires, stoves and barbecues outside developed campgrounds, with 5 ft cleared around the fire; fireworks are always illegal. The forest says it may bring restrictions back if the weather trends drier than expected.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-plumas', pageFireHash: 'v6:5t9b9l:zs', noticeUpdated: '2026-11-02', boundary: { source: 'usfs', match: 'Plumas National Forest' }, name: 'Plumas NF', agency: 'USFS', lat: 39.9, lng: -120.9, radiusKm: 50,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-11-02', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/plumas/alerts/stage-i-fire-restrictions-plumas-national-forest',
    notes: 'Stage I order 05-11-26-04 ran "from 2:00 p.m. on September 4, 2026, through November 1, 2026" and expired on that date; no replacement order on the forest alerts page as of Nov 2. A free CA Campfire Permit is required for a campfire or stove outside developed recreation sites.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-tahoe', pageFireHash: 'v6:1k8qhpo:hy', noticeUpdated: '2026-10-27', boundary: { source: 'usfs', match: 'Tahoe National Forest' }, name: 'Tahoe NF', agency: 'USFS', lat: 39.4, lng: -120.6, radiusKm: 50,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-10-27', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/tahoe/newsroom/releases/tahoe-national-forest-lifts-fire-restrictions-0',
    notes: 'Fire restrictions terminated effective Oct 27, 2026 (press release the same day): Stage 1 order 17-26-25 and its Exhibit A no longer apply. A valid CA Campfire Permit is required for a campfire outside a designated developed recreation area; attend it and clear flammables 5 ft in all directions. Separately, Order 17-25-05 (through Jun 2028) still bans camping and all fires outside Forest Service campgrounds and designated dispersed sites in the Truckee and Sierraville restricted-use areas.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-eldorado', noticeUpdated: '2026-11-03', boundary: { source: 'usfs', match: 'Eldorado National Forest' }, wildernessNote: 'Campfires are prohibited year-round in the Desolation and Mokelumne Wildernesses.', name: 'Eldorado NF', agency: 'USFS', lat: 38.8, lng: -120.3, radiusKm: 45,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-11-03', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/eldorado/alerts',
    notes: 'The forest lifted its fire restrictions (order 03-26-08, which was to run through Nov 29) in a Facebook post around Nov 3, 2026, citing cooler temperatures and more moisture. Wood and charcoal campfires are allowed in dispersed camping areas again. A free CA Campfire Permit is still required for campfires, propane stoves and lanterns outside developed recreation sites. The alert page for the order is gone and the forest alerts index no longer lists a fire restriction (checked Nov 5).', verifiedOn: V,
  },
  {
    id: 'usfs-ltbmu', pageFireHash: 'v6:1ktm0bg:1ou', developedSitesListed: ['Berkeley Camp', 'Blackwood Campground', 'Camp Concord', 'Camp Richardson Resort Campgrounds', 'Camp Richardson Stables', 'Camp Shelly', 'Fallen Leaf Campground', 'Kaspian Campground', 'Luther Campground', 'Meeks Bay Campground', 'Meeks Bay Resort and Campground', 'Nevada Beach Campground', 'Nevada Beach Day Use Area', 'Zephyr Cove Resort Campground', 'Watson Lake Campground', 'William Kent Campground', 'William Kent Day Use Area'], developedSitesComplete: true, noticeUpdated: '2026-09-11', confidence: 'medium', confidenceNote: 'Permanent 2024 order (page refreshed Aug 20, 2026; no new 2026 order), but local fire districts around the lake issue their own bans.', boundary: { source: 'usfs', match: 'Lake Tahoe Basin Management Unit' }, wildernessNote: 'Desolation Wilderness: never any wood fires.', name: 'Lake Tahoe Basin', agency: 'USFS', lat: 39.0, lng: -120.05, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2024-06-28', expires: '2027-12-01', orderNumber: '19-24-04',
    sourceUrl: 'https://fs.usda.gov/r05/laketahoebasin/alerts/campfire-restrictions',
    notes: 'Permanent order: wood fires only in installed rings at 17 listed campgrounds. Never in Desolation Wilderness, Meiss Country, along the PCT/TRT, beaches or general forest. Local fire districts add their own bans.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-stanislaus', pageFireHash: 'v6:2mbf1c:gf', noticeUpdated: '2026-10-29', boundary: { source: 'usfs', match: 'Stanislaus National Forest' }, wildernessNote: 'Emigrant, Carson-Iceberg and Mokelumne have permanent elevation/area limits under separate orders.', name: 'Stanislaus NF', agency: 'USFS', lat: 38.2, lng: -120.0, radiusKm: 45,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-10-29', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/stanislaus/newsroom/releases/stanislaus-national-forest-terminates-fire-restrictions-high-and-0',
    notes: 'Fire restriction orders STF-16-2026-11 (Moderate Hazard) and -12 (High Hazard) were terminated in a Forest Service release dated Oct 29, 2026, citing recent and forecast precipitation and cooler nights. A valid CA Campfire Permit is required for a campfire outside a developed recreation site; attend it and clear flammables around it. Emigrant, Carson-Iceberg and Mokelumne Wildernesses keep their permanent elevation/area limits.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-sierra', pageFireHash: 'v6:56tpt4:ws', developedSitesListed: ['Big Sandy Campground', 'Chilkoot Campground', 'Clover Meadow Campground', 'Denver Church Picnic Site', 'The Falls Picnic Site', 'Forks Campground', 'Fresno Dome Campground', 'Gaggs Campground', 'Greys Mountain Campground', 'Granite Creek Campground', 'Jerseydale Campground', 'Kelty Meadows', 'Lakeside Picnic Site', 'Little Denver Picnic Site', 'Lower Chiquito Campground', 'Lone Sequoia Campground', 'Lupine Cedar Bluff Campground', 'Nelder Grove Campground', 'Pine Point Picnic Site', 'Pine Slope Picnic Site', 'Recreation Point Group Campground', 'Rocky Point Picnic Site', 'Spring Cove Campground', 'Soquel Campground', 'Summerdale Campground', 'Whisky Falls Campground', 'Whiskers Campground', 'Wishon Point Campground', 'Badger Flat Campground', 'Badger Flat Group Site', 'Bald Mountain Base Camp', 'Bear Wallow Camping Area', 'Billy Creek Lower Campground', 'Billy Creek Upper Campground', 'Billy Creek Picnic Site', 'Bolsillo Campground', 'Bretz Mill Campground', 'Buck Meadow Campground', 'Catavee Campground', 'College Campground', 'Deer Creek Campground', 'Dinkey Creek Campground', 'Dorabelle Campground', 'Dorabelle Picnic Site', 'Dowville Picnic Site', 'Florence Lake Picnic Site', 'Gravel Flat Camping Area', 'Jackass Meadows Campground', 'Kirch Flat Campground', 'Kirch Flat Group Site', 'Lily Pad Campground', 'Marmot Rock Campground', 'Midge Creek Group Campground', 'Mono Creek Campground', 'Mono Creek Trailhead Campground', 'Portal Forebay Campground', 'Rancheria Campground', 'Sample Meadow Campground', 'Swanson Meadow Campground', 'Trapper Springs Campground', 'Upper Kings Group Campground', 'Vermillion Campground', 'Voyager Rock Camping Area', 'Ward Lake Campground', 'West Kaiser Campground', 'Wishon Village Campground'], developedSitesComplete: true, noticeUpdated: '2026-09-10', boundary: { source: 'usfs', match: 'Sierra National Forest' }, wildernessExempt: ['Ansel Adams Wilderness', 'John Muir Wilderness', 'Kaiser Wilderness', 'Dinkey Lakes Wilderness', 'Monarch Wilderness'], wildernessNote: 'Per Exhibit B map: no fires above 10,000 ft, nor at ~28 named lakes/meadows (Sadler, Rutherford, Chittenden, Lady, Jackass, Margaret Lakes, Devils Bathtub, Rae, Woodchuck, Crown, Portal Lake, etc.). Wilderness permit with campfire authorization still applies.', name: 'Sierra NF', agency: 'USFS', lat: 37.3, lng: -119.3, radiusKm: 50,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-08-07', expires: '2026-11-14', orderNumber: '05-15-00-26-10',
    sourceUrl: 'https://www.fs.usda.gov/r05/sierra/alerts/sierra-national-forest-fire-restrictions',
    notes: 'Campfires still allowed inside designated wilderness, except above 10,000 ft (north) / 10,400 ft (south) in Ansel Adams and John Muir (order 05-15-00-26-09).', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-inyo', pageFireHash: 'v6:s98dwe:4n', noticeUpdated: '2026-10-30', boundary: { source: 'usfs', match: 'Inyo National Forest' }, wildernessNote: 'Standing orders: campfire limits in the Ansel Adams and John Muir Wildernesses (no fires above about 10,000 ft) and in the Golden Trout and Hoover Wildernesses. See the forest alerts index.', name: 'Inyo NF', agency: 'USFS', lat: 37.4, lng: -118.6, radiusKm: 60,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-10-26', expires: 'until_rescinded',
    sourceUrl: 'https://www.easternsierranow.com/mammoth-lakes-community-e-news-october-30-2026/',
    notes: 'Forest Order 05-04-50-26-23 (Stage 1, Jun 22 to Dec 31, 2026) terminated effective Oct 26, 2026, signed in Bishop by Acting Forest Supervisor Stephanie Heller and posted on the forest Facebook page Oct 27. The forest alert page is gone; the Oct 30 Mammoth Lakes e-news relays the lift. A free CA Campfire Permit is required for a campfire or stove outside developed sites. Standing wilderness campfire orders still apply.', verifiedOn: '2026-11-05',
  },
  {
    id: 'usfs-htnf-carson', pageFireHash: 'v6:88lhi0:o3', noticeUpdated: '2026-11-02', boundary: { source: 'usfs', match: 'Humboldt-Toiyabe National Forest' }, name: 'Humboldt-Toiyabe — Carson RD', agency: 'USFS', lat: 38.7, lng: -119.8, radiusKm: 35,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-11-01', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r04/humboldt-toiyabe/alerts',
    notes: 'Stage 1 order 04-17-01-26-04 expired Oct 31, 2026; its alert page is gone and the forest alerts index no longer lists it (checked Nov 2). CA Campfire Permit required on the California side. Standing area orders on the alerts index still restrict day use, camping and fires in parts of the Carson RD, including the Whites, Thomas, Jones and Galena Creek areas.', verifiedOn: V,
  },
  {
    id: 'usfs-htnf-bridgeport', pageFireHash: 'v6:88lhi0:o3', noticeUpdated: '2026-11-02', wildernessNote: 'Standing order: camping, campfire and transportation restrictions in the Hoover Wilderness and the Red, Blue and Big Virginia Lakes area.', name: 'Humboldt-Toiyabe — Bridgeport RD', agency: 'USFS', lat: 38.2, lng: -119.4, radiusKm: 35,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-11-01', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r04/humboldt-toiyabe/alerts',
    notes: 'Stage 1 order 04-17-02-26-03 expired Oct 31, 2026; the forest alerts index no longer lists a Stage 1 order (checked Nov 2). A free CA Campfire Permit is required for a campfire or stove outside developed sites.', verifiedOn: V,
  },

  // ───────────── BLM California ─────────────
  {
    id: 'blm-redding', statusHash: 's1:blm:v6:hkpnry:o3', pageFireHash: 'v6:1xwhsf1:sj', noticeUpdated: '2026-10-01', boundary: { source: 'blm', match: 'Redding Field Office' }, name: 'BLM Redding Field Office', agency: 'BLM', lat: 40.6, lng: -122.4, radiusKm: 40,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-10-01', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-redding-field-office-ease-seasonal-fire-restrictions',
    notes: 'Seasonal fire order CA-360-26-01 rescinded effective Oct 1, 2026 (BLM announcement, Oct 1). Campfires and target shooting are allowed again with a free CA Campfire Permit, unless posted otherwise. The statewide year-round BLM fire order still applies: 5-ft clearance to bare soil, a round-point shovel on hand, and a permit for any campfire or stove outside a developed campground.', verifiedOn: '2026-11-05',
  },
  {
    id: 'blm-arcata', statusHash: 's1:blm:v6:hkpnry:o3', pageFireHash: 'v6:11ig2bi:t2', noticeUpdated: '2026-10-14', boundary: { source: 'blm', match: 'Arcata Field Office' }, name: 'BLM Arcata Field Office (King Range / Lost Coast)', agency: 'BLM', lat: 40.2, lng: -124.0, radiusKm: 45,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-10-13', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-arcata-field-office-ease-seasonal-fire-restrictions',
    notes: 'Seasonal fire order CA-330-26-01 rescinded effective Oct 13, 2026 (BLM announcement, Oct 14). Campfires and target shooting are allowed again with a free CA Campfire Permit, unless posted otherwise. The statewide year-round BLM fire order still applies: 5-ft clearance to bare soil, a round-point shovel on hand, and a permit for any campfire or stove outside a developed campground. Lost Coast Trail: beach fires are legal again under the statewide rules; the King Range may post its own limits.', verifiedOn: '2026-11-05',
  },
  {
    id: 'blm-ukiah', statusHash: 's1:blm:v6:5s1nss:iy', pageFireHash: 'v6:13djqfu:u9', noticeUpdated: '2026-06-05', boundary: { source: 'blm', match: 'Ukiah Field Office' }, name: 'BLM Ukiah Field Office (Cow Mtn, Cache Creek)', agency: 'BLM', lat: 39.1, lng: -122.9, radiusKm: 45,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-05', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-ukiah-field-office-issues-seasonal-fire-restrictions',
    notes: 'No campfires or open flame even in established campgrounds. Target shooting banned. Covers BLM portions of Berryessa Snow Mountain NM.', verifiedOn: '2026-11-05',
  },
  {
    id: 'blm-eagle-lake', statusHash: 's1:blm:v6:hkpnry:o3', pageFireHash: 'v6:13wxhdy:zq', noticeUpdated: '2026-10-15', boundary: { source: 'blm', match: 'Eagle Lake Field Office' }, name: 'BLM Eagle Lake Field Office', agency: 'BLM', lat: 40.6, lng: -120.5, radiusKm: 45,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-10-15', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-eases-seasonal-fire-restrictions-ne-california-nw-nevada',
    notes: 'Seasonal fire order CAN-050-26-01 rescinded effective Oct 15, 2026 (BLM Northern California District announcement, Oct 15). Campfires and target shooting are allowed again with a free CA Campfire Permit, unless posted otherwise. The statewide year-round BLM fire order still applies: 5-ft clearance to bare soil, a round-point shovel on hand, and a permit for any campfire or stove outside a developed campground.', verifiedOn: '2026-11-05',
  },
  {
    id: 'blm-applegate', statusHash: 's1:blm:v6:hkpnry:o3', pageFireHash: 'v6:13wxhdy:zq', noticeUpdated: '2026-10-15', boundary: { source: 'blm', match: 'Applegate Field Office' }, name: 'BLM Applegate Field Office (Alturas)', agency: 'BLM', lat: 41.5, lng: -120.5, radiusKm: 45,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-10-15', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-eases-seasonal-fire-restrictions-ne-california-nw-nevada',
    notes: 'Seasonal fire order CA-320-26-01 rescinded effective Oct 15, 2026 (BLM Northern California District announcement, Oct 15). Campfires and target shooting are allowed again with a free CA Campfire Permit, unless posted otherwise. The statewide year-round BLM fire order still applies: 5-ft clearance to bare soil, a round-point shovel on hand, and a permit for any campfire or stove outside a developed campground.', verifiedOn: '2026-11-05',
  },
  {
    id: 'blm-mother-lode', statusHash: 's1:blm:v6:tzvq9u:z2', pageFireHash: 'v6:qlneti:ajw', checkUrl: 'https://www.blm.gov/programs/public-safety-and-fire/fire-and-aviation/regional-info/california/fire-restrictions', noticeUpdated: '2026-11-05', confidence: 'medium', confidenceNote: 'No rescission notice was published. BLM California\'s fire-restrictions page, read Nov 5, 2026, lists only the standing Fire Prevention Order for the Mother Lode Field Office; order CAC08000-26-05 ("until rescinded") is no longer listed there.', boundary: { source: 'blm', match: 'Mother Lode Field Office' }, name: 'BLM Mother Lode Field Office', agency: 'BLM', lat: 38.5, lng: -120.6, radiusKm: 55,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-11-05', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/programs/public-safety-and-fire/fire-and-aviation/regional-info/california/fire-restrictions#Mother%20Lode',
    notes: 'Seasonal Fire Prevention Order CAC08000-26-05 (campfire and open-flame ban, May 15, 2026) no longer appears in the Mother Lode section of BLM California\'s fire-restrictions page (checked Nov 5, 2026); there was no rescission notice. The standing order applies: 5-ft clearance to bare soil, a round-point shovel on hand, and a free CA Campfire Permit for any campfire, charcoal or wood stove outside a developed campground. Some areas, such as South Yuba, keep year-round restrictions; check posted signs.', verifiedOn: V,
  },
  {
    id: 'blm-bishop', statusHash: 's1:blm:v6:1wuqx5c:tj', pageFireHash: 'v6:1fkgp8y:r2', noticeUpdated: '2026-10-26', boundary: { source: 'blm', match: 'Bishop Field Office' }, name: 'BLM Bishop Field Office', agency: 'BLM', lat: 37.6, lng: -118.4, radiusKm: 50,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-10-26', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-eases-seasonal-fire-restrictions-eastern-sierra',
    notes: 'Seasonal fire order CAC09000-26-06 rescinded effective Oct 26, 2026 (BLM announcement Oct 26; rescission signed Oct 22). Campfires and target shooting are allowed again with a free CA Campfire Permit, unless posted otherwise, on BLM land in Inyo and Mono counties. The statewide year-round BLM fire order still applies: 5-ft clearance to bare soil, a round-point shovel on hand, and a permit for any campfire or stove outside a developed campground.', verifiedOn: '2026-11-05',
  },

  // ───────────── National Park Service ─────────────
  {
    id: 'nps-yosemite', statusHash: 's1:nps:none', pageFireHash: 'v6:ac8ozh:2ai', alsoCheck: ['https://www.facebook.com/YosemiteNPS'], noticeUpdated: '2026-11-02', confidence: 'medium', confidenceNote: 'The park restrictions page says there are no seasonal fire restrictions in place, but the park published no 2026 rescission release, so the lift date is unknown.', boundary: { source: 'nps', match: 'Yosemite National Park' }, wildernessNote: 'Year-round: wilderness campfires only below 9,600 ft in existing fire rings, never within 100 ft of a trail or water, on Half Dome, on El Capitan from the trail to the rim, in the Upper and Lower Cathedral Lakes basins, or within a quarter mile of Kibbie Lake.', name: 'Yosemite NP', agency: 'NPS', lat: 37.85, lng: -119.55, radiusKm: 45,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-11-02', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/yose/planyourvisit/firerestrictions.htm',
    notes: 'The park fire restrictions page says "There are no seasonal fire restrictions in place" (read Nov 2, 2026), ending the Stage 2 restrictions below 8,000 ft. Gas, liquid-fuel, propane and alcohol stoves are always allowed. Campfires at Little Yosemite Valley and the High Sierra Camp campgrounds only in NPS fire rings. Wilderness fires need a wilderness permit.', verifiedOn: '2026-11-05',
  },
  {
    id: 'nps-lassen-volcanic', statusHash: 's1:nps:none', pageFireHash: 'v6:1e2wwai:nz', alsoCheck: ['https://www.facebook.com/LassenNPS'], noticeUpdated: '2026-09-03', confidence: 'medium', confidenceNote: 'No rescission notice was published. The park says any current restriction is posted as an alert, and its alert feed has listed none since Sep 3, 2026. The visitor phone line is intermittent — email lavo_information@nps.gov to confirm.', boundary: { source: 'nps', match: 'Lassen Volcanic National Park' }, name: 'Lassen Volcanic NP', agency: 'NPS', lat: 40.5, lng: -121.45, radiusKm: 20,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-09-03', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/lavo/learn/management/fire-regulations-and-restrictions.htm',
    notes: 'Stage 2 (Jul 31, 2026: no wood or charcoal fires in any campground) appears lifted as of Sep 3. Standing park rules: fires only in park-provided grills and rings at established frontcountry campgrounds and day-use areas — never in the backcountry or wilderness, where only small gas or liquid-fuel stoves are allowed. Juniper Lake Campground is closed.', verifiedOn: '2026-11-05',
  },
  {
    id: 'nps-lava-beds', statusHash: 's1:nps:none', pageFireHash: 'v6:1fft04j:6n', alsoCheck: ['https://www.facebook.com/LavaBedsNPS'], confidence: 'medium', confidenceNote: 'Lifting is stated on the conditions page only; no formal rescission notice found. Call 530-667-8113 to confirm.', noticeUpdated: '2026-09-02', boundary: { source: 'nps', match: 'Lava Beds National Monument' }, name: 'Lava Beds NM', agency: 'NPS', lat: 41.75, lng: -121.5, radiusKm: 15,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-09-02', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/labe/planyourvisit/conditions.htm',
    notes: 'Closure Order 26-001 (Jul 31, 2026) banned all wood/charcoal fires; the park conditions page now says: "Effective Sept. 2, 2026 - No fire restrictions are in place in the campground." Fires in Indian Well Campground rings only — no fires elsewhere in the monument; gas stoves OK.', verifiedOn: '2026-11-05',
  },
  {
    id: 'nps-redwood', statusHash: 's1:nps:none', pageFireHash: 'v6:kdh5mk:3f', alsoCheck: ['https://www.facebook.com/RedwoodNPS'], noticeUpdated: '2026-09-10', confidence: 'low', confidenceNote: 'No 2026 fire order found on nps.gov (conditions page edited Aug 31 and Sep 2, still no order; no fire alerts posted). Status is inferred, not confirmed.', boundary: { source: 'nps', match: 'Redwood National Park' }, name: 'Redwood National & State Parks', agency: 'NPS', lat: 41.3, lng: -124.0, radiusKm: 30,
    stage: 'unknown', campfiresDeveloped: 'allowed', campfiresDispersed: 'unknown', stoves: 'allowed', smoking: 'unknown',
    expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/redw/planyourvisit/conditions.htm',
    notes: 'No 2026 park-wide order posted as of Aug 28. Campground rings normally OK; backcountry fires often banned late summer. Call 707-464-6101.', verifiedOn: '2026-11-05',
  },
  {
    id: 'nps-whiskeytown', statusHash: 's1:nps:none', pageFireHash: 'v6:3g:1', alsoCheck: ['https://www.facebook.com/WhiskeytownNationalRecreationArea'], boundary: { source: 'nps', match: 'Whiskeytown-Shasta-Trinity National Recreation Area' }, noticeUpdated: '2026-09-24', name: 'Whiskeytown NRA', agency: 'NPS', lat: 40.63, lng: -122.6, radiusKm: 15,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-09-25', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/whis/planyourvisit/conditions.htm',
    notes: 'Seasonal wood and charcoal ban ended Fri, Sep 25, 2026, per the park\'s Facebook post of Sep 24 (facebook.com/WhiskeytownNationalRecreationArea): "the seasonal temporary ban on campfires and charcoal barbequing ends Friday, September 25." Campfires are permitted only in designated fire rings; charcoal grills and gas stoves OK. The park never posted a news release; its stale "Wood & Charcoal Burn Ban" alert stayed in the alert feed until mid-October and was gone by Oct 19, 2026, which confirms the lift.', verifiedOn: '2026-11-05',
  },
  {
    id: 'nps-point-reyes', statusHash: 's1:nps:none', pageFireHash: 'v6:10b5c7y:1uj', alsoCheck: ['https://www.facebook.com/PointReyesNPS'], noticeUpdated: '2026-08-28', confidence: 'medium', confidenceNote: 'Beach-fire permits are suspended day-by-day on high fire-danger days — call 415-464-5100 the morning of.', boundary: { source: 'nps', match: 'Point Reyes National Seashore' }, name: 'Point Reyes NS', agency: 'NPS', lat: 38.07, lng: -122.88, radiusKm: 20,
    stage: 'none', campfiresDeveloped: 'prohibited', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed', smoking: 'allowed',
    expires: 'until_rescinded', orderNumber: "Superintendent's Compendium",
    sourceUrl: 'https://www.nps.gov/pore/planyourvisit/beachfires.htm',
    notes: 'Beach fires only, with a free permit, below the high-tide line, 30 ft from vegetation, out by 10 pm; not on Drakes Beach. Suspended on any High fire-danger day — call 415-464-5100. No wood fires at backcountry camps.', verifiedOn: '2026-11-05',
  },

  // ───────────── CAL FIRE units (burn-permit suspensions; SRA / private land) ─────────────
  // Spelled out one entry each, not generated from a table: `verify --stamp` rewrites this file by matching the
  // literal text `id: '<id>',`, so an id built at runtime (`calfire-${code}`) is invisible to it. These 11 were
  // reported as stamped every run while their shared verifiedOn sat unchanged for 11 days (issue #9). The prose
  // they share stays in the two consts above so it can't drift between units.
  {
    id: 'calfire-shu', pageFireHash: 'v6:1ewz05i:o8', name: 'CAL FIRE Shasta-Trinity Unit', agency: 'CAL FIRE', lat: 40.55, lng: -122.1, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday',
    notes: CALFIRE_NOTES, verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-tgu', pageFireHash: 'v6:1ewz05i:o8', name: 'CAL FIRE Tehama-Glenn Unit', agency: 'CAL FIRE', lat: 39.9, lng: -122.3, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday',
    notes: CALFIRE_NOTES, verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-huu', pageFireHash: 'v6:g6en8b:ov', name: 'CAL FIRE Humboldt-Del Norte Unit', agency: 'CAL FIRE', lat: 40.8, lng: -123.9, radiusKm: 30,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-11-01', expires: 'until_rescinded', noticeUpdated: '2026-10-28', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-to-lift-burn-permit-suspension-in-humboldt-del-norte-on-nov-1',
    notes: 'Burn permit suspension lifted at 6 am Nov 1, 2026 in Humboldt, Del Norte and western Trinity (KRCR, Oct 27; CAL FIRE\'s burn status table agrees). Valid CAL FIRE and North Coast AQMD permit holders may burn on permissive burn days.', verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-btu', pageFireHash: 'v6:1f09edc:3r', name: 'CAL FIRE Butte Unit', agency: 'CAL FIRE', lat: 39.7, lng: -121.6, radiusKm: 30,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-11-01', expires: 'until_rescinded', noticeUpdated: '2026-10-28', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://www.sierradailynews.com/state/butte-county-ends-burn-suspension-november-1-2026-permits-no-longer-required/',
    notes: 'Burn suspension lifted Nov 1, 2026 in unincorporated Butte County (SierraDailyNews, Oct 28; CAL FIRE\'s burn status table lists Butte as Permit Required from 8 am Nov 1). Burning only on permissive burn days; Paradise and Gridley still require permits.', verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-sku', pageFireHash: 'v6:1ewz05i:o8', name: 'CAL FIRE Siskiyou Unit', agency: 'CAL FIRE', lat: 41.7, lng: -122.4, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday',
    notes: CALFIRE_NOTES, verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-lnu', pageFireHash: 'v6:1oxb245:17p', name: 'CAL FIRE Sonoma-Lake-Napa Unit', agency: 'CAL FIRE', lat: 38.6, lng: -122.6, radiusKm: 30,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-11-01', expires: 'until_rescinded', noticeUpdated: '2026-10-30', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://sonomacounty.gov/calfire-to-lift-burn-permit-suspension-in-sonoma-county-x193083',
    notes: 'Burn permit suspension lifted at 8 am Nov 1, 2026 across the unit\'s State Responsibility Area (Sonoma County announcement; CAL FIRE\'s burn status table lists Sonoma, Lake and Napa as Permit Required from Nov 1). A permit is required to burn, on permissive burn days only.', verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-meu', pageFireHash: 'v6:1knuqyy:rk', name: 'CAL FIRE Mendocino Unit', agency: 'CAL FIRE', lat: 39.3, lng: -123.4, radiusKm: 30,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-11-01', expires: 'until_rescinded', noticeUpdated: '2026-11-01', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://kymkemp.com/2026/11/01/mendocino-unit-lifts-burn-suspension-in-mendocino-county/',
    notes: 'Residential burn permit suspension lifted at 8 am Nov 1, 2026 (Redheaded Blackbelt, Nov 1; CAL FIRE\'s burn status table agrees). Burning only on permissive burn days; agricultural burns still need a CAL FIRE inspection.', verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-neu', pageFireHash: 'v6:16vpy7x:gv', name: 'CAL FIRE Nevada-Yuba-Placer Unit', agency: 'CAL FIRE', lat: 39.2, lng: -121.1, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://yubanet.com/regional/cal-fire-suspends-burn-permits-in-nevada-yuba-placer-and-sierra-counties-on-june-15-2026/',
    notes: CALFIRE_NOTES, verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-aeu', pageFireHash: 'v6:1w2f1b1:ri', name: 'CAL FIRE Amador-El Dorado Unit', agency: 'CAL FIRE', lat: 38.6, lng: -120.9, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://www.eldoradocountyfire.com/cal-fire-implements-burn-permit-suspension-in-el-dorado-county-due-to-high-fire-danger',
    notes: CALFIRE_NOTES, verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-tcu', pageFireHash: 'v6:11ypn24:m1', name: 'CAL FIRE Tuolumne-Calaveras Unit', agency: 'CAL FIRE', lat: 38.1, lng: -120.5, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://new.thepinetree.net/?p=202470',
    notes: CALFIRE_NOTES, verifiedOn: '2026-11-05',
  },
  {
    id: 'calfire-lmu', pageFireHash: 'v6:3ywql3:kz', name: 'CAL FIRE Lassen-Modoc Unit', agency: 'CAL FIRE', lat: 40.9, lng: -120.9, radiusKm: 30,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-11-01', expires: 'until_rescinded', noticeUpdated: '2026-10-30', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://plumassun.org/2026/10/30/cal-fire-lifts-burn-permit-suspension-nov-1/',
    notes: 'Burn permit suspension lifted at 6 am Nov 1, 2026 across Lassen, Modoc and Plumas counties (Plumas Sun, Oct 30; CAL FIRE\'s burn status table agrees). CAL FIRE burn permits remain required; burn only on permissive burn days.', verifiedOn: '2026-11-05',
  },
  // ───────────── State Parks ─────────────
  {
    id: 'csp-folsom-peninsula', pageFireHash: 'v6:v715r0:95', name: 'Folsom Lake SRA — Peninsula CG', agency: 'State Parks', lat: 38.75, lng: -121.1, radiusKm: 8,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-06-10', expires: '2026-12-31',
    sourceUrl: 'https://www.parks.ca.gov/post/113',
    notes: 'Campfires, wood/charcoal cooking and liquid-fuel torches prohibited for the rest of the 2026 season. Other state parks: no statewide order — fires only in provided rings; check each park.', verifiedOn: '2026-11-05',
  },
  {
    id: 'csp-auburn', pageFireHash: 'v6:127jfoa:5c', confidence: 'low', confidenceNote: '2026 district order not located; based on the pattern of prior years.', name: 'Auburn SRA', agency: 'State Parks', lat: 38.92, lng: -121.0, radiusKm: 12,
    stage: 'unknown', campfiresDeveloped: 'unknown', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    expires: 'until_rescinded',
    sourceUrl: 'https://www.parks.ca.gov/?page_id=502',
    notes: 'Gold Fields District has banned all campfires here every summer (2025 order 690-058). 2026 order not located — assume banned until the district confirms.', verifiedOn: '2026-11-05',
  },
]
