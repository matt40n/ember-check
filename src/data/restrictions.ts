import type { Jurisdiction } from '../types'

/**
 * Hand-verified from agency forest orders / fire prevention orders on 2026-08-28.
 * Agencies publish these as PDFs, not APIs — re-verify weekly through fire season.
 * See README "Updating restrictions".
 */
export const DATA_VERIFIED_ON = '2026-10-05'
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
    notes: 'Fire restrictions lifted effective Oct 2, 2026: a termination order for 14-26-07 was signed Oct 1 (press release the same day). From then a free CA Campfire Permit is all that is needed for a campfire or stove outside developed campgrounds. Standing orders still apply: 14-26-06 (through Jul 29, 2027) bans camping and ALL fires and stoves outside developed sites in the Mt. Shasta Plantation area around Mount Shasta city; 14-24-08 (through Nov 8, 2026) allows no campfires anywhere in the Mt. Shasta Wilderness, gas or liquid-fuel stoves only; 14-25-03 (through Sep 19, 2028) bans wood fires in the three Trinity Alps Wilderness campfire prohibition areas.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-klamath', pageFireHash: 'v6:fbfjaf:ow', noticeUpdated: '2026-09-24', boundary: { source: 'usfs', match: 'Klamath National Forest' }, name: 'Klamath NF', agency: 'USFS', lat: 41.6, lng: -123.0, radiusKm: 60,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-09-24', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/klamath/newsroom/releases/klamath-national-forest-rescinds-fire-restrictions-effective-midnight',
    notes: 'Fire restrictions rescinded effective midnight Sep 24, 2026 (press release dated Sep 23): Order 05-05-00-26-11 (Sep 9 – Oct 30) and its Exhibit A no longer apply, and the forest took the alert page down. Standing rules: a free CA Campfire Permit is required for any campfire, stove or barbecue outside a developed campground; fireworks and explosives are always prohibited. The forest says fire season is not over — check for a new order before you go. Ukonom RD inside this boundary is Six Rivers-managed and still follows the Six Rivers order.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-six-rivers', pageFireHash: 'v6:2xhzio:1a8', noticeUpdated: '2026-08-20', developedSitesListed: ['Panther Flat Campground', 'Big Flat Campground', 'North Fork Campground', 'Pearch Creek Campground', 'Fish Lake Campground', 'E-Ne-Nuck Campground', 'Aikens Creek Campground', 'Oak Bottom Campground', 'Dillon Creek Campground', 'Nordheimer Campground', 'Lake Ogaromtoc (Frog pond)', 'Beans Camp', 'Mad River Campground', 'Fir Cove Campground', 'Bailey Canyon Campground', 'Bear Basin Lookout Campsite', 'Flat Camp', 'Letter Buck Trailhead', 'Haypress Trailhead', 'Stanshaw Trailhead', 'Ten Bear Trailhead', 'Elk Valley', 'Louse Camp', 'Cedar Camp', 'Clear Lake Campsite', '23 Mile Camp', 'Happy Camp Campsite', 'Groves Prairie Campsite', 'Bear Hole Trailhead', 'Red Cap Trailhead', 'Grizzly Camp Trailhead', 'Cow Chip Springs Camp', 'Mill Creek Lake Trailhead', 'Watts Lake Campsite', 'Brown Canyon', '3 Forks', 'Crook Creek'], developedSitesComplete: true, boundary: { source: 'usfs', match: 'Six Rivers National Forest' }, wildernessExempt: ['Siskiyou Wilderness', 'North Fork Wilderness', 'Mount Lassic Wilderness', 'Trinity Alps Wilderness', 'Yolla Bolly-Middle Eel Wilderness', 'Marble Mountain Wilderness'], name: 'Six Rivers NF', agency: 'USFS', lat: 41.0, lng: -123.7, radiusKm: 55,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-03', expires: '2026-11-16', orderNumber: '10-26-05',
    sourceUrl: 'https://www.fs.usda.gov/r05/sixrivers/alerts/forest-fire-restrictions',
    notes: 'Campfires allowed with a CA Campfire Permit in the six wilderness areas (incl. Marble Mountain via Ukonom RD) and at Designated Fire Safe Sites. Exhibit A updated Aug 20, 2026: Patrick Creek, Grassy Flat, Boise Creek and East Fork campgrounds were removed — no campfires there now.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-mendocino', pageFireHash: 'v6:8njl8j:7h', noticeUpdated: '2026-09-29', boundary: { source: 'usfs', match: 'Mendocino National Forest' }, name: 'Mendocino NF', agency: 'USFS', lat: 39.6, lng: -122.9, radiusKm: 55,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-09-30', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/mendocino/newsroom/releases/fire-restrictions-lift-sept-30',
    notes: 'Fire restrictions lifted Sep 30, 2026 at noon (press release Sep 29). With a valid CA Campfire Permit, open campfires and camp stoves are allowed again outside designated campgrounds. On Oct 1 the forest\'s alert for Order 08-26-08 was still posted, with a first line saying restrictions lift Sep 30.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-modoc', pageFireHash: 'v6:1m9g8mz:1ep', noticeUpdated: '2026-10-01', boundary: { source: 'usfs', match: 'Modoc National Forest' }, name: 'Modoc NF', agency: 'USFS', lat: 41.6, lng: -120.8, radiusKm: 65,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-09-27', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/modoc/alerts/forest-fire-restrictions-2026',
    notes: 'Fire restrictions (Order 09-26-01) lifted as of 12:01 a.m. Sep 27, 2026 (forest notice dated Sep 25). Campfires are allowed again outside developed campgrounds and recreation sites; a free CA Campfire Permit is still required. The page keeps the text of the old order below the notice.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-lassen', pageFireHash: 'v6:19vjjbr:vw', siteNotes: { 'Big Pine Campground': 'Closes for the season Oct 13, 2026, per the notice posted at the campground in late Sep 2026. Nothing online carries a date: the USFS page only says April – October, and this campground is first-come, first-served with no Recreation.gov calendar.', 'Cave Campground': 'Closes for the season Oct 13, 2026, per the notice posted at the campground in late Sep 2026. Nothing online carries a date: the USFS page only says April – October, and this campground is first-come, first-served with no Recreation.gov calendar.' }, noticeUpdated: '2026-09-29', boundary: { source: 'usfs', match: 'Lassen National Forest' }, name: 'Lassen NF', agency: 'USFS', lat: 40.5, lng: -121.3, radiusKm: 50,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'allowed',
    effective: '2026-10-01', expires: 'until_rescinded',
    sourceUrl: 'https://www.fs.usda.gov/r05/lassen/newsroom/releases/lassen-national-forest-lift-fire-restrictions',
    notes: 'Fire restrictions rescinded effective midnight Oct 1, 2026 (press release Sep 29): Order 06-26-05 and its Exhibit A no longer apply, and the forest took the alert page down. Standing rules: a free CA Campfire Permit is required for campfires, stoves and barbecues outside developed campgrounds, with 5 ft cleared around the fire; fireworks are always illegal. The forest says it may bring restrictions back if the weather trends drier than expected.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-plumas', pageFireHash: 'v6:5t9b9l:zs', developedSitesListed: ['Big Cove Campground', 'Chilcoot Campground', 'Conklin Park Campground', 'Cottonwood Group Campground', 'Cottonwood Springs Campground', 'Crocker Campground', 'Frenchman Campground', 'Frenchman Picnic Area', 'Gold Lake 4x4 Campground', 'Gold Lake Campground', 'Goose Lake Campground', 'Grasshopper Flat Campground', 'Grizzly Campground', 'Haven Lake Campground', 'Lakes Basin Campground', 'Laufman Campground', 'Lightning Tree Campground', 'Meadow View Campground', 'Portola Picnic Area', 'Ross Camp', 'Spring Creek Campground', 'Antelope Picnic Area', 'Boulder Creek Campground', 'Brady\'s Camp', 'Deanes Valley Campground', 'Gansner Bar Campground', 'Greenville Campground', 'Grizzly Creek Campground', 'Grizzly Forebay Boat-in Campground', 'Hallsted Campground', 'Hutchins Group Camp', 'Lone Rock Campground', 'Long Point Campground', 'Long Point Group Campground', 'Lower Bucks Lake Campground', 'Meadow Camp', 'Mill Creek Campground', 'Queen Lily Campground', 'North Fork Campground', 'Red Bridge Campground', 'Rock Creek Camp', 'Round Valley Picnic Area', 'Sandy Point Day Use Area', 'Silver Lake Campground', 'Snake Lake Campground', 'Spanish Creek Campground', 'Sundew Campground', 'Whitehorse Campground', 'Black Rock Tent Campground', 'Blue Water Beach Day Use Area', 'Cottage Creek Campground', 'Pancake Beach Day Use Area', 'Paradise Lake Picnic Area', 'Peninsula Tent Campground', 'Red Feather Campground', 'Strawberry Campground', 'Sly Campground', 'South Fork Horse Camp', 'Wyandotte Campground'], developedSitesComplete: true, noticeUpdated: '2026-09-05', boundary: { source: 'usfs', match: 'Plumas National Forest' }, wildernessNote: 'No wilderness exemption: Bucks Lake Wilderness is under the Stage I order (fires only at Exhibit A sites).', name: 'Plumas NF', agency: 'USFS', lat: 39.9, lng: -120.9, radiusKm: 50,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-09-04', expires: '2026-11-01', orderNumber: '05-11-26-04',
    sourceUrl: 'https://www.fs.usda.gov/r05/plumas/alerts/stage-i-fire-restrictions-plumas-national-forest',
    notes: 'Lowered from Stage II to Stage I at 2 pm Sep 4, 2026 after widespread rain (order 05-11-26-04 supersedes 05-11-26-03). Campfires and stove fires only at the 59 Exhibit A designated sites, no permit needed there; elsewhere permit holders may use gas/pressurized-fuel pits, stoves, lanterns and pellet grills with a shut-off. Sandy Point: BBQs only. Not a season-ending event — forest says fire danger is still elevated.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-tahoe', pageFireHash: 'v6:sbr3uh:qg', developedSitesListed: ['Ahart Campground', 'Big Reservoir Campground', 'Brimstone OHV Staging Area', 'Coyote Group Campground', 'Forbes Creek Group Campground', 'French Meadows Campground', 'Gates Group Campground', 'Giant Gap Campground', 'Lewis Campground', 'Manzanita Day Use Picnic Area', 'Morning Star Campground', 'Mumford Bar Trailhead', 'North Fork Campground', 'Onion Valley Campground', 'Parker Flat Staging Area', 'Poppy Campground', 'Robinson Flat Campground', 'Shirttail Creek Campground', 'Talbot Campground', 'Tunnel Mills Campground', 'Bear Valley OHV Campground', 'Cold Creek Campground', 'Cottonwood Campground', 'East Meadows Campground', 'Findley Campground', 'Fir Top Campground', 'Jackson Point Boat-In Campground', 'Lake of the Woods Campground', 'Little Lasier Meadow Horse Campground', 'Lower Little Truckee Campground', 'Meadow Lake Campground', 'Meadow Lake Group Campground', 'Meadow Lake Shore Shoreline Sites', 'Milton Reservoir Campground', 'Pass Creek Campground', 'Pass Creek Overflow Campground', 'Upper Little Truckee Campground', 'White Rock Lake Campground', 'Woodcamp Campground', 'Wheeler Sheep Camp (Oven use only)', 'Boca Campground', 'Boca Rest Campground', 'Boca Springs Campground', 'Boyington Mill Campground', 'Emigrant Group Campground', 'Goose Meadows Campground', 'Granite Flat Campground', 'Lakeside Campground', 'Logger Campground', 'Prosser Family Campground', 'Prosser Ranch Group Campground', 'Sagehen Campground', 'Silver Creek Campground', 'Berger Campground', 'Big Bend Campground', 'Cal Ida Campground', 'Canyon Creek Campground', 'Carlton Flat Campground', 'Carr Lake Campground', 'Feeley Lake Campground', 'Chapman Creek Campground', 'Dark Day Campground', 'Diablo Campground', 'Fiddle Creek Campground', 'Fuller Lake Day Use Area', 'Garden Point Campground', 'Grouse Ridge Campground', 'Hampshire Rocks Campground', 'Hornswoggle Campground', 'Indian Springs Campground', 'Indian Valley Campground', 'Jackson Creek Campground', 'Lindsey Lake Campground', 'Loganville Campground', 'Packsaddle Campground', 'Pierce Creek Campground', 'Rocky Rest Campground', 'Rucker Lake Campground', 'Salmon Creek Campground', 'Sardine Campground', 'Schoolhouse Campground', 'Skillman Campground', 'Snag Lake Campground', 'Union Flat Campground', 'White Cloud Campground', 'Wild Plum Campground'], developedSitesComplete: true, noticeUpdated: '2026-09-28', boundary: { source: 'usfs', match: 'Tahoe National Forest' }, wildernessNote: 'No wilderness exemption — no campfires in Granite Chief Wilderness (not an Exhibit A site).', name: 'Tahoe NF', agency: 'USFS', lat: 39.4, lng: -120.6, radiusKm: 50,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-26', expires: '2026-10-31', orderNumber: '17-26-15',
    sourceUrl: 'https://www.fs.usda.gov/r05/tahoe/alerts/stage-1-fire-restrictions',
    notes: 'Reduced from Stage 2 to Stage 1 effective Sep 28, 2026 (forest release carried by YubaNet: yubanet.com/regional/fire-restrictions-lowered-to-stage-1-on-tahoe-national-forest/); Order 17-26-15 (Jun 26 – Oct 31) is the posted restriction again. Wood and charcoal fires only in the grills and rings provided at the 85 Exhibit A sites (all four districts transcribed; Wheeler Sheep Camp is oven use only). Gas stoves, lanterns and portable propane pits OK anywhere with a CA Campfire Permit, 3 ft from flammables. Separately, Order 17-25-05 (through Jun 2028) bans camping and all fires outside Forest Service campgrounds and designated dispersed sites in the Truckee and Sierraville restricted-use areas.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-eldorado', pageFireHash: 'v6:1hqdb0n:yw', developedSitesListed: ['Pardoes Point', 'Pipi', 'Camp Winton (Boy Scouts of America)', 'Kit Carson Lodge', 'Caples Lake Resort', 'Two-Sentinels Girl Scout Camp', 'Crystal Administrative Site', 'Ice House', 'Mountain Camp II', 'Deer Crossing Wilderness Camp', 'Power Pines Camp', 'Lover\'s Leap', 'Sand Flat Campground', 'Sly Park Education Center', 'Camp Sacramento', 'Sierra Pines Camp'], developedSitesComplete: true, noticeUpdated: '2026-09-30', confidence: 'medium', confidenceNote: 'The alert page\'s transcription of Exhibit A still lists Silver Lake East Campground; the signed order\'s exhibit does not. This entry follows the signed order.', boundary: { source: 'usfs', match: 'Eldorado National Forest' }, wildernessNote: 'No fires in Desolation or Mokelumne Wilderness.', name: 'Eldorado NF', agency: 'USFS', lat: 38.8, lng: -120.3, radiusKm: 45,
    stage: 'stage2', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-09-30', expires: '2026-11-29', orderNumber: '03-26-08',
    sourceUrl: 'https://www.fs.usda.gov/r05/eldorado/alerts/fire-restrictions-are-effect-forest-wide',
    notes: 'Order 03-26-08 (Sep 30 – Nov 29, 2026; supersedes 03-26-07) cuts Exhibit A from 35 sites to 16 as campgrounds close for the season. Public campgrounds still listed: Pardoes Point, Pipi, Ice House, Lover\'s Leap and Sand Flat; the rest are resorts, organization camps and an administrative site. No wood or charcoal fires anywhere else, including Caples Lake, Kirkwood Lake, Silver Lake East, Gerle Creek, Loon Lake, Wrights Lake, Wolf Creek, Wench Creek, Sunset, Fashoda, Yellowjacket, West Point, Silver Fork, China Flat and Bridal Veil. The alert says the ring must be at a site actively serviced by a camp host. Gas stoves, lanterns and propane fire pits are OK with a CA Campfire Permit. No wilderness exemption (Desolation never allows wood fires).', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-ltbmu', pageFireHash: 'v6:1ktm0bg:1ou', developedSitesListed: ['Berkeley Camp', 'Blackwood Campground', 'Camp Concord', 'Camp Richardson Resort Campgrounds', 'Camp Richardson Stables', 'Camp Shelly', 'Fallen Leaf Campground', 'Kaspian Campground', 'Luther Campground', 'Meeks Bay Campground', 'Meeks Bay Resort and Campground', 'Nevada Beach Campground', 'Nevada Beach Day Use Area', 'Zephyr Cove Resort Campground', 'Watson Lake Campground', 'William Kent Campground', 'William Kent Day Use Area'], developedSitesComplete: true, noticeUpdated: '2026-09-11', confidence: 'medium', confidenceNote: 'Permanent 2024 order (page refreshed Aug 20, 2026; no new 2026 order), but local fire districts around the lake issue their own bans.', boundary: { source: 'usfs', match: 'Lake Tahoe Basin Management Unit' }, wildernessNote: 'Desolation Wilderness: never any wood fires.', name: 'Lake Tahoe Basin', agency: 'USFS', lat: 39.0, lng: -120.05, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2024-06-28', expires: '2027-12-01', orderNumber: '19-24-04',
    sourceUrl: 'https://fs.usda.gov/r05/laketahoebasin/alerts/campfire-restrictions',
    notes: 'Permanent order: wood fires only in installed rings at 17 listed campgrounds. Never in Desolation Wilderness, Meiss Country, along the PCT/TRT, beaches or general forest. Local fire districts add their own bans.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-stanislaus', pageFireHash: 'v6:s0ddb1:zg', developedSitesListed: ['Fraser Flat Campground', 'River Ranch Campground', 'Riverside Day Use Area', 'North Fork Day Use Area', 'Sand Bar Flat Campground', 'Crandall OHV Campground', 'Waka Luu Hep Yoo Campground', 'Sourgrass Day Use Area', 'Cascade Campground', 'Beardsley Lake Day Use Area', 'Beardsley Campground', 'Teleli puLaya Campground', 'Carlon Day Use Area', 'Dimond O Campground', 'Lost Claim Campground', 'Rainbow Pool Day Use Area', 'Sweetwater Campground', 'The Pines Campground', 'Peach Growers Tract', 'Cherry Valley Campground', 'Hull Creek Campground', 'Big Meadow Campground', 'Cottonwood Picnic Area', 'Clark Fork Campground', 'Clark Fork Horse Camp', 'Crabtree Campground', 'Donnell Vista Picnic Area', 'Fence Creek Campground', 'Herring Creek Campground', 'Herring Creek Reservoir Campground', 'Kerrick Corral Horse Camp', 'Meadowview Campground', 'Mill Creek Campground', 'Pioneer Trail Group Campground', 'Pinecrest Campground', 'Pinecrest Lake Picnic Area', 'Pine Valley Horse Camp', 'Sand Flat Campground'], developedSitesComplete: true, noticeUpdated: '2026-07-17', boundary: { source: 'usfs', match: 'Stanislaus National Forest' }, wildernessNote: 'Emigrant, Carson-Iceberg and Mokelumne have permanent elevation/area limits under separate orders.', name: 'Stanislaus NF', agency: 'USFS', lat: 38.2, lng: -120.0, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-17', expires: '2026-12-31', orderNumber: 'STF-16-2026-11 / -12',
    sourceUrl: 'https://www.fs.usda.gov/r05/stanislaus/alerts/temporary-fire-restrictions-high-hazard-area-stanislaus-national-forest',
    notes: 'Two zone orders — STF-16-2026-12 (High Hazard, 20 sites) and -11 (Moderate Hazard, 18 sites) — both limit campfires to Exhibit C developed sites through Dec 31. Emigrant and Mokelumne Wildernesses lie outside the High Hazard zone; their permanent elevation limits still apply — check your wilderness permit.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-sierra', pageFireHash: 'v6:56tpt4:ws', developedSitesListed: ['Big Sandy Campground', 'Chilkoot Campground', 'Clover Meadow Campground', 'Denver Church Picnic Site', 'The Falls Picnic Site', 'Forks Campground', 'Fresno Dome Campground', 'Gaggs Campground', 'Greys Mountain Campground', 'Granite Creek Campground', 'Jerseydale Campground', 'Kelty Meadows', 'Lakeside Picnic Site', 'Little Denver Picnic Site', 'Lower Chiquito Campground', 'Lone Sequoia Campground', 'Lupine Cedar Bluff Campground', 'Nelder Grove Campground', 'Pine Point Picnic Site', 'Pine Slope Picnic Site', 'Recreation Point Group Campground', 'Rocky Point Picnic Site', 'Spring Cove Campground', 'Soquel Campground', 'Summerdale Campground', 'Whisky Falls Campground', 'Whiskers Campground', 'Wishon Point Campground', 'Badger Flat Campground', 'Badger Flat Group Site', 'Bald Mountain Base Camp', 'Bear Wallow Camping Area', 'Billy Creek Lower Campground', 'Billy Creek Upper Campground', 'Billy Creek Picnic Site', 'Bolsillo Campground', 'Bretz Mill Campground', 'Buck Meadow Campground', 'Catavee Campground', 'College Campground', 'Deer Creek Campground', 'Dinkey Creek Campground', 'Dorabelle Campground', 'Dorabelle Picnic Site', 'Dowville Picnic Site', 'Florence Lake Picnic Site', 'Gravel Flat Camping Area', 'Jackass Meadows Campground', 'Kirch Flat Campground', 'Kirch Flat Group Site', 'Lily Pad Campground', 'Marmot Rock Campground', 'Midge Creek Group Campground', 'Mono Creek Campground', 'Mono Creek Trailhead Campground', 'Portal Forebay Campground', 'Rancheria Campground', 'Sample Meadow Campground', 'Swanson Meadow Campground', 'Trapper Springs Campground', 'Upper Kings Group Campground', 'Vermillion Campground', 'Voyager Rock Camping Area', 'Ward Lake Campground', 'West Kaiser Campground', 'Wishon Village Campground'], developedSitesComplete: true, noticeUpdated: '2026-09-10', boundary: { source: 'usfs', match: 'Sierra National Forest' }, wildernessExempt: ['Ansel Adams Wilderness', 'John Muir Wilderness', 'Kaiser Wilderness', 'Dinkey Lakes Wilderness', 'Monarch Wilderness'], wildernessNote: 'Per Exhibit B map: no fires above 10,000 ft, nor at ~28 named lakes/meadows (Sadler, Rutherford, Chittenden, Lady, Jackass, Margaret Lakes, Devils Bathtub, Rae, Woodchuck, Crown, Portal Lake, etc.). Wilderness permit with campfire authorization still applies.', name: 'Sierra NF', agency: 'USFS', lat: 37.3, lng: -119.3, radiusKm: 50,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-08-07', expires: '2026-11-14', orderNumber: '05-15-00-26-10',
    sourceUrl: 'https://www.fs.usda.gov/r05/sierra/alerts/sierra-national-forest-fire-restrictions',
    notes: 'Campfires still allowed inside designated wilderness, except above 10,000 ft (north) / 10,400 ft (south) in Ansel Adams and John Muir (order 05-15-00-26-09).', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-inyo', pageFireHash: 'v6:1nmweou:xy', noticeUpdated: '2026-09-24', developedSitesListed: ['Aerie Crag Campground', 'Aspen Campground', 'Big Bend Campground', 'Big Springs Campground', 'Deadman Campground', 'Ellery Lake Campground', 'Glass Creek Campground', 'Grant Lake Marina/Campground', 'Gull Lake Campground', 'Hartley Springs Campground', 'Junction Campground', 'June Lake Campground', 'Lower Lee Vining Campground', 'Moraine Campground', 'Obsidian Flat Campground', 'Oh! Ridge Campground', 'Reversed Creek Campground', 'Silver Lake Campground', 'Sawmill Campground', 'Tioga Lake Campground', 'Saddlebag Lake Campground', 'Walker Lake Trailhead', 'Agnew Meadows Campground', 'Coldwater Campground', 'Convict Lake Campground', 'Lake George Campground', 'Lake Mary Campground', 'Minaret Falls Campground', 'New Shady Rest Campground', 'Old Shady Rest Campground', 'Pine City Campground', 'Pine Glen Campground', 'Pumice Flat Campground', 'Reds Meadow Campground', 'Shady Rest Day Use Area', 'Sherwin Creek Campground', 'Twin Lakes Campground', 'Upper Soda Springs Campground', 'Aspen Campground', 'Big Meadow Campground', 'Big Pine Creek Campground', 'Big Trees Campground', 'Bishop Park Campground', 'Bitterbrush Campground', 'Clyde Glacier Campground', 'East Fork Campground', 'Ferguson Campground', 'Forks Campground', 'Four Jeffery Campground', 'French Camp Campground', 'Grandview Campground', 'Holiday Campground', 'Intake 2 (walk-in) Campground', 'Intake 2 Upper Campground', 'Iris Meadow Campground', 'McGee Creek Campground', 'Mosquito Flat Trailhead Campground', 'Mountain Glen Campground', 'Nelson Campground', 'Noren Campground', 'North Lake Campground', 'Palisade Glacier Campground', 'Pine Grove Campground', 'Rock Creek Lake Campground', 'Rock Creek Lake Group Campground', 'Sabrina Campground', 'Sage Flat Campground', 'Table Mountain Campground', 'Tuff Campground', 'Upper Pine Grove Campground', 'Upper Sage Flat Campground', 'Willow Campground', 'Cottonwood Lakes Backpacker Campground', 'Cottonwood Pass Backpacker', 'Horseshoe Meadow Equestrian Campground', 'Lone Pine Campground', 'Lone Pine Group Campground', 'Lower Grays Meadow Campground', 'Onion Valley Campground', 'Upper Grays Meadow Campground', 'Whitney Portal Campground', 'Whitney Portal Group Campground', 'Whitney Trailhead Campground', 'Four Jeffrey Campground'], developedSitesComplete: true, boundary: { source: 'usfs', match: 'Inyo National Forest' }, wildernessNote: 'No wilderness exemption: no campfires anywhere in Inyo wilderness under this order. Charcoal briquettes count as fires. Stoves must be pressurized gas/LPG with a shut-off valve.', name: 'Inyo NF', agency: 'USFS', lat: 37.4, lng: -118.6, radiusKm: 60,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-22', expires: '2026-12-31', orderNumber: '05-04-50-26-23',
    sourceUrl: 'https://www.fs.usda.gov/r05/inyo/alerts/stage-1-fire-restrictions-effect',
    notes: 'Charcoal banned outside Exhibit A sites. Permanent wilderness elevation bans (no fires above ~10,000 ft in John Muir/Ansel Adams) remain. Rock Fire area closure through Dec 31.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-htnf-carson', pageFireHash: 'v6:s9ntmd:uk', developedSitesRule: 'any_developed', noticeUpdated: '2026-06-29', boundary: { source: 'usfs', match: 'Humboldt-Toiyabe National Forest' }, name: 'Humboldt-Toiyabe — Carson RD', agency: 'USFS', lat: 38.7, lng: -119.8, radiusKm: 35,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-29', expires: '2026-10-31', orderNumber: '04-17-01-26-04',
    sourceUrl: 'https://www.fs.usda.gov/r04/humboldt-toiyabe/alerts/stage-1-fire-restrictions-carson-ranger-district',
    notes: 'No chainsaws or engine tools 1 pm–1 am. CA Campfire Permit required on the California side.', verifiedOn: '2026-10-05',
  },
  {
    id: 'usfs-htnf-bridgeport', pageFireHash: 'v6:l37i9g:24q', developedSitesRule: 'any_developed', noticeUpdated: '2026-10-05', name: 'Humboldt-Toiyabe — Bridgeport RD', agency: 'USFS', lat: 38.2, lng: -119.4, radiusKm: 35,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-29', expires: '2026-10-31', orderNumber: '04-17-02-26-03',
    sourceUrl: 'https://www.fs.usda.gov/r04/humboldt-toiyabe/fire/fire-restrictions',
    notes: 'Hoover Wilderness: no dispersed fires under Stage 1.', verifiedOn: V,
  },

  // ───────────── BLM California ─────────────
  {
    id: 'blm-redding', statusHash: 's1:blm:v6:hkpnry:o3', pageFireHash: 'v6:1lz981i:12o', checkUrl: 'https://www.blm.gov/announcement/blm-announces-seasonal-fire-restrictions-northwest-california-public-lands-0', orderNumber: 'CA-360-26-01', developedSitesListed: ['Shasta Campground', 'Ohl Olsen Campground', 'Bohemotash Primitive Campground', 'Junction City Campground', 'Steel Bridge Campground', 'Douglas City Campground', 'Reading Island Campground'], developedSitesComplete: true, noticeUpdated: '2026-06-28', boundary: { source: 'blm', match: 'Redding Field Office' }, name: 'BLM Redding Field Office', agency: 'BLM', lat: 40.6, lng: -122.4, radiusKm: 40,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-28', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-06/BLM-CA-2026-Fire-Restrictions-Order_Redding.pdf',
    notes: 'Campfires only at Shasta, Bohemotash, Ohl Olsen, Junction City, Steel Bridge, Douglas City and Reading Island sites; none in Butte County. Chainsaws until 1 pm; target shooting until noon.', verifiedOn: '2026-10-05',
  },
  {
    id: 'blm-arcata', statusHash: 's1:blm:v6:tzvvor:r6', pageFireHash: 'v6:1m1h2av:zw', checkUrl: 'https://www.blm.gov/announcement/blm-announces-seasonal-fire-restrictions-north-coast-public-lands-0', orderNumber: 'CA-330-26-01', developedSitesRule: 'any_developed', noticeUpdated: '2026-06-28', boundary: { source: 'blm', match: 'Arcata Field Office' }, name: 'BLM Arcata Field Office (King Range / Lost Coast)', agency: 'BLM', lat: 40.2, lng: -124.0, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-28', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-06/BLM-CA-ArcataFO-Fire-Restrictions-2026_508.pdf',
    notes: 'Wood fires only in agency rings at developed sites. Applies to the Lost Coast Trail — no beach fires.', verifiedOn: '2026-10-05',
  },
  {
    id: 'blm-ukiah', statusHash: 's1:blm:v6:5s1nss:iy', pageFireHash: 'v6:13djqfu:u9', noticeUpdated: '2026-06-05', boundary: { source: 'blm', match: 'Ukiah Field Office' }, name: 'BLM Ukiah Field Office (Cow Mtn, Cache Creek)', agency: 'BLM', lat: 39.1, lng: -122.9, radiusKm: 45,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-05', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-ukiah-field-office-issues-seasonal-fire-restrictions',
    notes: 'No campfires or open flame even in established campgrounds. Target shooting banned. Covers BLM portions of Berryessa Snow Mountain NM.', verifiedOn: '2026-10-05',
  },
  {
    id: 'blm-eagle-lake', statusHash: 's1:blm:v6:1omywee:b0', pageFireHash: 'v6:4fsxe6:ad8', checkUrl: 'https://www.blm.gov/programs/public-safety-and-fire/fire-and-aviation/regional-info/california/fire-restrictions', developedSitesListed: ['North Eagle Lake Campground', 'Hobo Camp Day Use Area', 'Fort Sage Off-Highway Vehicle Area', 'Dodge Reservoir Campground', 'Ramhorn Springs Campground', 'Rice Canyon Off-Highway Vehicle Area'], developedSitesComplete: true, noticeUpdated: '2026-07-14', boundary: { source: 'blm', match: 'Eagle Lake Field Office' }, name: 'BLM Eagle Lake Field Office', agency: 'BLM', lat: 40.6, lng: -120.5, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-15', expires: 'until_rescinded', orderNumber: 'CAN-050-26-01',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-07/2026%20ELFO%20Fire%20Prevention%20Order_signed.pdf',
    notes: 'Campfires only at N. Eagle Lake CG, Hobo Camp, Fort Sage OHV, Dodge Reservoir CG, Ramhorn Springs CG and Rice Canyon OHV.', verifiedOn: '2026-10-05',
  },
  {
    id: 'blm-applegate', statusHash: 's1:blm:v6:1omywee:b0', pageFireHash: 'v6:4fsxe6:ad8', checkUrl: 'https://www.blm.gov/programs/public-safety-and-fire/fire-and-aviation/regional-info/california/fire-restrictions', developedSitesListed: ['Pit River', 'Boulder Reservoir'], developedSitesComplete: true, noticeUpdated: '2026-07-14', boundary: { source: 'blm', match: 'Applegate Field Office' }, name: 'BLM Applegate Field Office (Alturas)', agency: 'BLM', lat: 41.5, lng: -120.5, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-15', expires: 'until_rescinded', orderNumber: 'CA-320-26-01',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-07/2026%20AGFO%20Fire%20Prevention%20Order_signed.pdf',
    notes: 'Campfires only at Pit River and Boulder Reservoir recreation sites. No vehicles off established roads.', verifiedOn: '2026-10-05',
  },
  {
    id: 'blm-mother-lode', statusHash: 's1:blm:v6:tzvq9u:z2', pageFireHash: 'v6:4fsxe6:ad8', checkUrl: 'https://www.blm.gov/programs/public-safety-and-fire/fire-and-aviation/regional-info/california/fire-restrictions', noticeUpdated: '2026-05-15', boundary: { source: 'blm', match: 'Mother Lode Field Office' }, name: 'BLM Mother Lode Field Office', agency: 'BLM', lat: 38.5, lng: -120.6, radiusKm: 55,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-05-15', expires: 'until_rescinded', orderNumber: 'CAC08000-26-05',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-05/MLFO_Fire_Restriction_Order_2026_508.pdf',
    notes: 'No campfire or open flame of any kind. Target shooting banned. Sierra foothills from Yuba/Nevada to Mariposa incl. Merced River, Cosumnes, South Yuba.', verifiedOn: '2026-10-05',
  },
  {
    id: 'blm-bishop', statusHash: 's1:blm:v6:a4saie:p3', pageFireHash: 'v6:12uiz25:158', checkUrl: 'https://www.blm.gov/announcement/blm-announces-seasonal-fire-restrictions-eastern-sierra-0', noticeUpdated: '2026-06-22', boundary: { source: 'blm', match: 'Bishop Field Office' }, name: 'BLM Bishop Field Office', agency: 'BLM', lat: 37.6, lng: -118.4, radiusKm: 50,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-22', expires: 'until_rescinded', orderNumber: 'CAC09000-26-06',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-06/BIFO_Fire_Restriction_Order_June_2026_508_signed.pdf',
    notes: "Signed order CAC09000-26-06 bans campfires and open flame of any kind — including in developed campgrounds; the press release reads looser than the order. Gas stoves OK with a CA Campfire Permit. Inyo, Mono and part of Alpine counties. Target shooting banned.", verifiedOn: '2026-10-05',
  },

  // ───────────── National Park Service ─────────────
  {
    id: 'nps-yosemite', statusHash: 's1:nps:none', pageFireHash: 'v6:ac8ozh:2ai', developedSitesRule: 'any_developed', noticeUpdated: '2026-08-02', boundary: { source: 'nps', match: 'Yosemite National Park' }, name: 'Yosemite NP', agency: 'NPS', lat: 37.85, lng: -119.55, radiusKm: 45,
    stage: 'stage2', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'prohibited',
    effective: '2026-08-02', expires: 'until_rescinded', orderNumber: "Superintendent's Stage 2",
    sourceUrl: 'https://www.nps.gov/yose/planyourvisit/firerestrictions.htm',
    notes: 'Stage 2 applies below 8,000 ft. Between 8,000 and 9,600 ft: existing rings only, 100 ft from water/trail. Never above 9,600 ft. Twig stoves banned; gas/alcohol/tablet stoves OK.', verifiedOn: '2026-10-05',
  },
  {
    id: 'nps-lassen-volcanic', statusHash: 's1:nps:none', pageFireHash: 'v6:1e2wwai:nz', noticeUpdated: '2026-09-03', confidence: 'medium', confidenceNote: 'No rescission notice was published. The park says any current restriction is posted as an alert, and its alert feed has listed none since Sep 3, 2026. The visitor phone line is intermittent — email lavo_information@nps.gov to confirm.', boundary: { source: 'nps', match: 'Lassen Volcanic National Park' }, name: 'Lassen Volcanic NP', agency: 'NPS', lat: 40.5, lng: -121.45, radiusKm: 20,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-09-03', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/lavo/learn/management/fire-regulations-and-restrictions.htm',
    notes: 'Stage 2 (Jul 31, 2026: no wood or charcoal fires in any campground) appears lifted as of Sep 3. Standing park rules: fires only in park-provided grills and rings at established frontcountry campgrounds and day-use areas — never in the backcountry or wilderness, where only small gas or liquid-fuel stoves are allowed. Juniper Lake Campground is closed.', verifiedOn: '2026-10-05',
  },
  {
    id: 'nps-lava-beds', statusHash: 's1:nps:none', pageFireHash: 'v6:1fft04j:6n', confidence: 'medium', confidenceNote: 'Lifting is stated on the conditions page only; no formal rescission notice found. Call 530-667-8113 to confirm.', noticeUpdated: '2026-09-02', boundary: { source: 'nps', match: 'Lava Beds National Monument' }, name: 'Lava Beds NM', agency: 'NPS', lat: 41.75, lng: -121.5, radiusKm: 15,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-09-02', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/labe/planyourvisit/conditions.htm',
    notes: 'Closure Order 26-001 (Jul 31, 2026) banned all wood/charcoal fires; the park conditions page now says: "Effective Sept. 2, 2026 - No fire restrictions are in place in the campground." Fires in Indian Well Campground rings only — no fires elsewhere in the monument; gas stoves OK.', verifiedOn: '2026-10-05',
  },
  {
    id: 'nps-redwood', statusHash: 's1:nps:none', pageFireHash: 'v6:kdh5mk:3f', noticeUpdated: '2026-09-10', confidence: 'low', confidenceNote: 'No 2026 fire order found on nps.gov (conditions page edited Aug 31 and Sep 2, still no order; no fire alerts posted). Status is inferred, not confirmed.', boundary: { source: 'nps', match: 'Redwood National Park' }, name: 'Redwood National & State Parks', agency: 'NPS', lat: 41.3, lng: -124.0, radiusKm: 30,
    stage: 'unknown', campfiresDeveloped: 'allowed', campfiresDispersed: 'unknown', stoves: 'allowed', smoking: 'unknown',
    expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/redw/planyourvisit/conditions.htm',
    notes: 'No 2026 park-wide order posted as of Aug 28. Campground rings normally OK; backcountry fires often banned late summer. Call 707-464-6101.', verifiedOn: '2026-10-05',
  },
  {
    id: 'nps-whiskeytown', statusHash: 's1:nps:wood charcoal burn ban', pageFireHash: 'v6:3g:1', boundary: { source: 'nps', match: 'Whiskeytown-Shasta-Trinity National Recreation Area' }, noticeUpdated: '2026-09-24', confidence: 'medium', confidenceNote: 'The park announced the end of the ban only on its Facebook page (Sep 24, 2026 post: the seasonal ban ends Friday, Sep 25). As of Oct 7 the "Wood & Charcoal Burn Ban" alert still shows in the park\'s alert feed on every nps.gov/whis page. This entry follows the announcement; call 530-242-3400 to confirm.', name: 'Whiskeytown NRA', agency: 'NPS', lat: 40.63, lng: -122.6, radiusKm: 15,
    stage: 'none', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-09-25', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/whis/planyourvisit/conditions.htm',
    notes: 'Seasonal wood and charcoal ban ended Fri, Sep 25, 2026, per the park\'s Facebook post of Sep 24 (facebook.com/WhiskeytownNationalRecreationArea): "the seasonal temporary ban on campfires and charcoal barbequing ends Friday, September 25." Campfires are permitted only in designated fire rings; charcoal grills and gas stoves OK. The park never posted a news release, and its stale "Wood & Charcoal Burn Ban" alert was still in the alert feed on Oct 7.', verifiedOn: V,
  },
  {
    id: 'nps-point-reyes', statusHash: 's1:nps:none', pageFireHash: 'v6:10b5c7y:1uj', noticeUpdated: '2026-08-28', confidence: 'medium', confidenceNote: 'Beach-fire permits are suspended day-by-day on high fire-danger days — call 415-464-5100 the morning of.', boundary: { source: 'nps', match: 'Point Reyes National Seashore' }, name: 'Point Reyes NS', agency: 'NPS', lat: 38.07, lng: -122.88, radiusKm: 20,
    stage: 'none', campfiresDeveloped: 'prohibited', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed', smoking: 'allowed',
    expires: 'until_rescinded', orderNumber: "Superintendent's Compendium",
    sourceUrl: 'https://www.nps.gov/pore/planyourvisit/beachfires.htm',
    notes: 'Beach fires only, with a free permit, below the high-tide line, 30 ft from vegetation, out by 10 pm; not on Drakes Beach. Suspended on any High fire-danger day — call 415-464-5100. No wood fires at backcountry camps.', verifiedOn: '2026-10-05',
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
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-tgu', pageFireHash: 'v6:1ewz05i:o8', name: 'CAL FIRE Tehama-Glenn Unit', agency: 'CAL FIRE', lat: 39.9, lng: -122.3, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-huu', pageFireHash: 'v6:1ewz05i:o8', name: 'CAL FIRE Humboldt-Del Norte Unit', agency: 'CAL FIRE', lat: 40.8, lng: -123.9, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-btu', pageFireHash: 'v6:1ewz05i:o8', name: 'CAL FIRE Butte Unit', agency: 'CAL FIRE', lat: 39.7, lng: -121.6, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-sku', pageFireHash: 'v6:1ewz05i:o8', name: 'CAL FIRE Siskiyou Unit', agency: 'CAL FIRE', lat: 41.7, lng: -122.4, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-lnu', pageFireHash: 'v6:a2sapy:6t', name: 'CAL FIRE Sonoma-Lake-Napa Unit', agency: 'CAL FIRE', lat: 38.6, lng: -122.6, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://permitsonoma.org/sonomacountyannouncesburnsuspensiononjune15',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-meu', pageFireHash: 'v6:1k724y7:ah', name: 'CAL FIRE Mendocino Unit', agency: 'CAL FIRE', lat: 39.3, lng: -123.4, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-16', expires: 'until_rescinded', noticeUpdated: '2026-06-16', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://mendovoice.com/2026/06/cal-fire-suspends-burn-permits-for-mendocino-county/',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-neu', pageFireHash: 'v6:16vpy7x:gv', name: 'CAL FIRE Nevada-Yuba-Placer Unit', agency: 'CAL FIRE', lat: 39.2, lng: -121.1, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://yubanet.com/regional/cal-fire-suspends-burn-permits-in-nevada-yuba-placer-and-sierra-counties-on-june-15-2026/',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-aeu', pageFireHash: 'v6:1w2f1b1:ri', name: 'CAL FIRE Amador-El Dorado Unit', agency: 'CAL FIRE', lat: 38.6, lng: -120.9, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://www.eldoradocountyfire.com/cal-fire-implements-burn-permit-suspension-in-el-dorado-county-due-to-high-fire-danger',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-tcu', pageFireHash: 'v6:11ypn24:m1', name: 'CAL FIRE Tuolumne-Calaveras Unit', agency: 'CAL FIRE', lat: 38.1, lng: -120.5, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-15', expires: 'until_rescinded', noticeUpdated: '2026-06-15', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://new.thepinetree.net/?p=202470',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  {
    id: 'calfire-lmu', pageFireHash: 'v6:1xjicry:ol', name: 'CAL FIRE Lassen-Modoc Unit', agency: 'CAL FIRE', lat: 40.9, lng: -120.9, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-06-17', expires: 'until_rescinded', noticeUpdated: '2026-06-17', confidence: 'medium', confidenceNote: CALFIRE_CONFIDENCE_NOTE,
    sourceUrl: 'https://plumassun.org/2026/06/15/cal-fire-suspends-residential-burn-permits-june-17/',
    notes: CALFIRE_NOTES, verifiedOn: '2026-10-05',
  },
  // ───────────── State Parks ─────────────
  {
    id: 'csp-folsom-peninsula', pageFireHash: 'v6:v715r0:95', name: 'Folsom Lake SRA — Peninsula CG', agency: 'State Parks', lat: 38.75, lng: -121.1, radiusKm: 8,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-06-10', expires: '2026-12-31',
    sourceUrl: 'https://www.parks.ca.gov/post/113',
    notes: 'Campfires, wood/charcoal cooking and liquid-fuel torches prohibited for the rest of the 2026 season. Other state parks: no statewide order — fires only in provided rings; check each park.', verifiedOn: '2026-10-05',
  },
  {
    id: 'csp-auburn', pageFireHash: 'v6:127jfoa:5c', confidence: 'low', confidenceNote: '2026 district order not located; based on the pattern of prior years.', name: 'Auburn SRA', agency: 'State Parks', lat: 38.92, lng: -121.0, radiusKm: 12,
    stage: 'unknown', campfiresDeveloped: 'unknown', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    expires: 'until_rescinded',
    sourceUrl: 'https://www.parks.ca.gov/?page_id=502',
    notes: 'Gold Fields District has banned all campfires here every summer (2025 order 690-058). 2026 order not located — assume banned until the district confirms.', verifiedOn: '2026-10-05',
  },
]
