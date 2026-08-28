import type { Jurisdiction } from '../types'

/**
 * Hand-verified from agency forest orders / fire prevention orders on 2026-08-28.
 * Agencies publish these as PDFs, not APIs — re-verify weekly through fire season.
 * See README "Updating restrictions".
 */
export const DATA_VERIFIED_ON = '2026-08-28'
const V = DATA_VERIFIED_ON

export const JURISDICTIONS: Jurisdiction[] = [
  // ───────────── USFS Region 5 ─────────────
  {
    id: 'usfs-shasta-trinity', noticeUpdated: '2026-08-20', siteNotes: { 'Gumboot Campground': "The USFS page for Gumboot (updated Jul 21, 2026) says permit holders may have campfires, but Gumboot is not on order 14-26-07's exhibit and on-site signs in Aug 2026 said no campfires. Trust the order and the signs; call Mt. Shasta RD (530-926-4511) if in doubt." }, boundary: { source: 'usfs', match: 'Shasta-Trinity National Forest' }, developedSitesListed: ['Basin Gulch (Fee Area)', 'Deerlick Springs', 'Gemmill Gulch Picnic Area', 'Post Creek Rental Cabin', 'Tomhead Saddle', 'Big Slide Campground', 'Forest Glen (Fee Area)', 'Forest Glen Rental Cabin', 'Hell Gate (Fee Area)', 'Philpot', 'Scotts Flat', 'Slide Creek', 'Ackerman', 'Alpine View', 'Bridge Camp', 'Bushytail Group Camp', 'Captains Point', 'Clark Springs', 'Cooper Gulch', 'Eagle Creek', 'East Weaver', 'Fawn Group Camp', 'Goldfield', 'Hayward Flat', 'Horse Flat', 'Jackass Springs', 'Mariners Roost', 'Mary Smith', 'Minersville', 'Pine Cove Boat Ramp', 'Preacher Meadow', 'Ridgeville Island', 'Rush Creek', 'Scott Mountain', 'Stoney Creek Group Camp', 'Stoney Point', 'Tanbark Picnic Area', 'Tannery', 'Trinity River', 'Big Bar', 'Big Flat', 'Burnt Ranch', 'Cedar Flat Picnic Area', 'Denny', 'Hayden Flat', 'Hobo Gulch', 'Pigeon Point', 'Ripstein', 'Skunk Point Group Camp', 'White\'s Bar Picnic Area', 'Antlers', 'Arbuckle Flat Boat-in Camp', 'Bailey Cove', 'Chirpchatter', 'Deadlun', 'Dekkas Rock Group Campground', 'Dekkas Rock Picnic Area', 'Ellery Creek', 'Fisherman\'s Point Picnic Area', 'Greens Creek Boat-in Camp', 'Gregory Creek Group Campground', 'Gooseneck Boat-in Camp', 'Hirz Bay', 'Hirz Bay Group Camp No. 1', 'Hirz Bay Group Camp No. 2', 'Lakeshore', 'Lakeshore East', 'Lower Jones Valley', 'McCloud Bridge', 'Moore Creek', 'Nelson Point', 'Pine Point', 'Ski Island Boat-in Camp', 'Upper Jones Valley', 'Castle Lake', 'Girard Ridge Lookout', 'McBride Springs', 'Panther Meadows', 'Red Fir Flat Group Camp', 'Sims Flat', 'Ah-Di-Na', 'Algoma', 'Camp 4', 'Cattle Camp', 'Fowlers Camp', 'Harris Springs', 'Little Mount Hoffman Lookout', 'Lower Falls Picnic Area', 'Trout Creek'], developedSitesComplete: true, wildernessExempt: ['Yolla Bolly-Middle Eel Wilderness', 'Chanchelulla Wilderness', 'Castle Crags Wilderness', 'Trinity Alps Wilderness'], wildernessNote: 'Mt. Shasta Wilderness is NOT exempt. Also OK with a permit within 10 ft of Shasta Lake, Trinity Lake or Iron Canyon Reservoir, 50+ ft from vegetation, and at Exhibit B fire-safe sites.', name: 'Shasta-Trinity NF', agency: 'USFS', lat: 40.9, lng: -122.6, radiusKm: 70,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-01', expires: '2026-12-31', orderNumber: '14-26-07',
    sourceUrl: 'https://www.fs.usda.gov/r05/shasta-trinity/alerts/2026-fire-restrictions-forest-order',
    notes: 'Ring fires are allowed ONLY at developed sites listed in Exhibit A — free/undeveloped campgrounds like Gumboot are not listed, so no wood fires there. (Mt. Shasta RD listed sites: Castle Lake, Girard Ridge, McBride Springs, Panther Meadows, Red Fir Flat, Sims Flat; other districts not transcribed yet.) Exceptions with a CA Campfire Permit: wood fires within 10 ft of Shasta Lake, Trinity Lake or Iron Canyon Res. (50 ft from vegetation), and inside the Yolla Bolly, Chanchelulla, Castle Crags, Mt. Shasta and Trinity Alps Wildernesses. Smoking only in a vehicle/building or a 3-ft cleared spot. Separately, Order 14-26-06 (Jul 29, 2026 – Jul 29, 2027) bans camping and ALL fires and stoves outside developed sites in the Mt. Shasta Plantation area around Mount Shasta city — no campfire-permit exemption there.', verifiedOn: V,
  },
  {
    id: 'usfs-klamath', noticeUpdated: '2026-07-21', developedSitesListed: ['Curly Jack Campground', 'Grider Creek Campground', 'Norcross Trailhead', 'Sarah Totten Campground', 'Sulphur Springs Campground', 'Beaver Creek Campground', 'Grouse Gap Shelter', 'Mount Ashland Campground', 'Tree of Heaven Campground', 'Carter Meadows Group Campground', 'Hidden Horse Campground', 'Idlewild Campground', 'Indian Scotty Campground', 'Jones Beach Picnic Area', 'Kangaroo Lake Campground and Picnic Area', 'Trail Creek Campground', 'Juanita Lake Day Use Area, Campground, and Group Site', 'Martin\'s Dairy Campground', 'Martin\'s Dairy Horse Campground', 'Orr Lake Campground', 'Shafter Campground'], developedSitesComplete: true, boundary: { source: 'usfs', match: 'Klamath National Forest' }, wildernessNote: 'No wilderness exemption: Marble Mountain, Russian and Siskiyou Wildernesses are under Stage 1 too.', name: 'Klamath NF', agency: 'USFS', lat: 41.6, lng: -123.0, radiusKm: 60,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-21', expires: '2026-10-30', orderNumber: '05-05-00-26-07',
    sourceUrl: 'https://www.fs.usda.gov/r05/klamath/alerts/fire-restrictions-effect-klamath-national-forest',
    notes: 'No wilderness campfire exemption (Marble Mountain, Russian, Siskiyou). Campfires only in Exhibit A developed sites. Ukonom RD follows the Six Rivers order.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-six-rivers', noticeUpdated: '2026-08-20', developedSitesListed: ['Panther Flat Campground', 'Big Flat Campground', 'North Fork Campground', 'Pearch Creek Campground', 'Fish Lake Campground', 'E-Ne-Nuck Campground', 'Aikens Creek Campground', 'Oak Bottom Campground', 'Dillon Creek Campground', 'Nordheimer Campground', 'Lake Ogaromtoc (Frog pond)', 'Beans Camp', 'Mad River Campground', 'Fir Cove Campground', 'Bailey Canyon Campground', 'Bear Basin Lookout Campsite', 'Flat Camp', 'Letter Buck Trailhead', 'Haypress Trailhead', 'Stanshaw Trailhead', 'Ten Bear Trailhead', 'Elk Valley', 'Louse Camp', 'Cedar Camp', 'Clear Lake Campsite', '23 Mile Camp', 'Happy Camp Campsite', 'Groves Prairie Campsite', 'Bear Hole Trailhead', 'Red Cap Trailhead', 'Grizzly Camp Trailhead', 'Cow Chip Springs Camp', 'Mill Creek Lake Trailhead', 'Watts Lake Campsite', 'Brown Canyon', '3 Forks', 'Crook Creek'], developedSitesComplete: true, boundary: { source: 'usfs', match: 'Six Rivers National Forest' }, wildernessExempt: ['Siskiyou Wilderness', 'North Fork Wilderness', 'Mount Lassic Wilderness', 'Trinity Alps Wilderness', 'Yolla Bolly-Middle Eel Wilderness', 'Marble Mountain Wilderness'], name: 'Six Rivers NF', agency: 'USFS', lat: 41.0, lng: -123.7, radiusKm: 55,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-03', expires: '2026-11-16', orderNumber: '10-26-05',
    sourceUrl: 'https://www.fs.usda.gov/r05/sixrivers/alerts/forest-fire-restrictions',
    notes: 'Campfires allowed with a CA Campfire Permit in the six wilderness areas (incl. Marble Mountain via Ukonom RD) and at Designated Fire Safe Sites. Exhibit A updated Aug 20, 2026: Patrick Creek, Grassy Flat, Boise Creek and East Fork campgrounds were removed — no campfires there now.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-mendocino', developedSitesListed: ['Three Prong Campground', 'Lake Red Bluff Recreation Area', 'Letts Lake Campground', 'Big Springs Day Use Area', 'Grey Pine Campground', 'Mill Creek Campground', 'Fouts Springs Campground', 'Davis Flat Campground', 'South Fork Campground', 'North Fork Campground', 'Old Mill Campground', 'Black Bear Campground', 'Del Harleson Campground', 'One Bee Campground', 'Mill Valley Campground', 'Dixie Glade Campground', 'Sugar Springs Campground', 'Sugarfoot Glade Campground', 'Whitlock Campground', 'Kingsley Glade Campground', 'Toomes Camp Campground', 'Ides Cove Horsepacker Campground', 'Masterson Campground', 'Plasket Meadow Day Use Area', 'Little Stony Campground', 'Wilson Camp Campground', 'Green Flat Campground', 'Pacific Ridge Campground', 'West Crockett Campground', 'Green Springs Campground', 'Wells Cabin Campground', 'Brewer Oak Campground', 'Fuller Grove Campground', 'Fuller Grove Group Campground', 'Navy Camp Campground', 'Pine Mountain Lookout', 'Pogie Point Campground', 'Oak Flat Campground', 'Sunset Campground', 'Middle Creek Campground', 'Deer Valley Campground', 'Penny Pines Campground', 'Pine Mountain Hunter Camp', 'Dry Oak Camp', 'Lakeview Camp', 'Eel River Campground', 'Little Doe Campground', 'Howard Lake Campground', 'Howard Meadows Campground', 'Atchison Campground', 'Grizzly Flat Campground'], developedSitesComplete: true, noticeUpdated: '2026-07-28', boundary: { source: 'usfs', match: 'Mendocino National Forest' }, wildernessExempt: ['Yolla Bolly-Middle Eel Wilderness', 'Snow Mountain Wilderness', 'Yuki Wilderness', 'Sanhedrin Wilderness'], name: 'Mendocino NF', agency: 'USFS', lat: 39.6, lng: -122.9, radiusKm: 55,
    stage: 'stage1', campfiresDeveloped: 'allowed_with_permit', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-28', expires: '2026-12-01', orderNumber: '08-26-08',
    sourceUrl: 'https://www.fs.usda.gov/r05/mendocino/alerts/fire-restrictions-effect',
    notes: 'With a permit: campfires at Exhibit A fire-safe sites and inside Yolla Bolly, Snow Mountain, Yuki and Sanhedrin Wildernesses.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-modoc', developedSitesListed: ['A.H. Hogue Campground', 'Ash Creek Campground', 'Big Sage Campground', 'Blanche Lake Campground', 'Blue Lake Campground', 'Bullseye Lake Campground', 'Cave Lake Campground', 'East Creek Campground', 'Emerson Campground', 'Headquarters Campground', 'Hemlock Campground', 'Howard\'s Gulch Campground', 'Janes Reservoir Campground', 'Lassen Creek Campground', 'Lily Lake Day Use Area (FS-Provided Grills Only)', 'Little Medicine Lake Campground', 'Medicine Campground', 'Medicine Lake Day Use Area (FS-Provided Grills Only)', 'Medicine Lake Swim Beach', 'Mill Creek Falls Campground', 'Patterson Campground', 'Paynes Springs Campground', 'Pepperdine Campground', 'Reservoir C Campground', 'Reservoir F Campground', 'Soup Springs Campground', 'Stough Reservoir Campground', 'Willow Creek Campground & Day Use'], developedSitesComplete: true, noticeUpdated: '2026-07-23', confidence: 'medium', confidenceNote: 'Alert page says the order ends Nov 3; the signed order says Oct 31.', boundary: { source: 'usfs', match: 'Modoc National Forest' }, wildernessExempt: ['South Warner Wilderness'], name: 'Modoc NF', agency: 'USFS', lat: 41.6, lng: -120.8, radiusKm: 65,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-23', expires: '2026-10-31', orderNumber: '09-26-01',
    sourceUrl: 'https://www.fs.usda.gov/r05/modoc/alerts/forest-fire-restrictions-2026',
    notes: 'Campfires still allowed in the South Warner Wilderness. Alert page says Nov 3; the signed order says Oct 31.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-lassen', developedSitesListed: ['Crater Lake Campground', 'Eagle Campground', 'Merrill Campground', 'Christie Campground', 'West Eagle Group Campground', 'Aspen Grove Campground', 'Goumaz Campground', 'Bogard Campground', 'Roxie Peconom Campground', 'Butte Creek Campground', 'Bridge Campground', 'Hat Creek Campground', 'Cave Campground', 'Hat Creek Group Campground', 'Big Pine Campground', 'Honn Campground', 'Rocky Campground', 'Almanor North Campground', 'Almanor South Campground', 'Gurnsey Creek Campground', 'Black Rock Campground', 'Elam Campground', 'Hole-in-the-Ground Campground', 'Potato Patch Campground', 'Legacy Campground', 'Cherry Hill Campground', 'Butte Meadows Campground', 'Domingo Springs Campground', 'Almanor Group Campground', 'Little Grizzly Campground', 'Silver Bowl Campground', 'Soldier Meadows Campground', 'Rocky Knoll Campground'], developedSitesComplete: true, noticeUpdated: '2026-08-10', confidence: 'medium', confidenceNote: 'Local press reported the order ends Sep 30; the signed order says Dec 1. Forest said it may rescind early after fall rain.', boundary: { source: 'usfs', match: 'Lassen National Forest' }, wildernessExempt: ['Caribou Wilderness', 'Thousand Lakes Wilderness', 'Ishi Wilderness'], name: 'Lassen NF', agency: 'USFS', lat: 40.5, lng: -121.3, radiusKm: 50,
    stage: 'stage1', campfiresDeveloped: 'allowed_with_permit', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-08-10', expires: '2026-12-01', orderNumber: '06-26-05',
    sourceUrl: 'https://www.fs.usda.gov/r05/lassen/alerts/fire-restrictions',
    notes: 'Wood fires with a permit only at the Exhibit A campgrounds (transcribed) and in federally designated wilderness (Caribou, Thousand Lakes, Ishi — the order references an Exhibit B map that is not published). Forest says it will consider early rescission after fall moisture.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-plumas', developedSitesListed: ['Big Cove Campground', 'Chilcoot Campground', 'Cottonwood Group Campground', 'Cottonwood Springs Campground', 'Frenchman Campground', 'Frenchman Picnic Area', 'Gold Lake Campground', 'Grasshopper Flat Campground', 'Grizzly Campground', 'Lakes Basin Campground', 'Lightning Tree Campground', 'Spring Creek Campground', 'Boulder Creek Campground', 'Gansner Bar Campground', 'Hallsted Campground', 'Lone Rock Campground', 'Long Point Campground', 'Long Point Group Campground', 'Mill Creek Campground', 'Queen Lily Campground', 'North Fork Campground', 'Sandy Point Day Use Area', 'Spanish Creek Campground', 'Sundew Campground', 'Cottage Creek Campground', 'Red Feather Campground'], developedSitesComplete: true, noticeUpdated: '2026-08-20', boundary: { source: 'usfs', match: 'Plumas National Forest' }, wildernessNote: 'Stage II: no fires in Bucks Lake Wilderness.', name: 'Plumas NF', agency: 'USFS', lat: 39.9, lng: -120.9, radiusKm: 50,
    stage: 'stage2', campfiresDeveloped: 'allowed_with_permit', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-08-06', expires: '2026-11-01', orderNumber: '05-11-26-03',
    sourceUrl: 'https://www.fs.usda.gov/r05/plumas/alerts/stage-ii-fire-restrictions-plumas-national-forest',
    notes: 'Stage II: wood fires ONLY in the Exhibit A campgrounds (transcribed) and only while a campground host is present; Sandy Point is BBQs only. No wilderness fires. Carry a shovel and water. Gas stoves with shutoff OK with permit.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-tahoe', developedSitesListed: ['Big Reservoir Campground', 'French Meadows Campground', 'Giant Gap Campground', 'Morning Star Campground', 'North Fork Campground', 'Shirttail Creek Campground', 'Cottonwood Campground', 'Lower Little Truckee Campground', 'Meadow Lake Campground', 'Upper Little Truckee Campground', 'Woodcamp Campground', 'Boca Campground', 'Boca Rest Campground', 'Goose Meadows Campground', 'Granite Flat Campground', 'Lakeside Campground', 'Logger Campground', 'Prosser Family Campground', 'Silver Creek Campground', 'Cal Ida Campground', 'Carr Lake Campground', 'Feeley Lake Campground', 'Hampshire Rocks Campground', 'Indian Springs Campground', 'Indian Valley Campground', 'Lower Lindsey Lake Campground', 'Loganville Campground', 'Rucker Lake Campground', 'Salmon Creek Campground', 'Sardine Campground', 'Schoolhouse Campground', 'Wild Plum Campground'], developedSitesComplete: true, noticeUpdated: '2026-08-14', boundary: { source: 'usfs', match: 'Tahoe National Forest' }, wildernessNote: 'Stage 2: no fires in Granite Chief Wilderness.', name: 'Tahoe NF', agency: 'USFS', lat: 39.4, lng: -120.6, radiusKm: 50,
    stage: 'stage2', campfiresDeveloped: 'allowed_with_permit', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-08-14', expires: '2026-10-31', orderNumber: '17-26-17 – 17-26-20',
    sourceUrl: 'https://fs.usda.gov/r05/tahoe/alerts/stage-2-fire-restrictions',
    notes: 'Stage 2: wood fires only in rings at campgrounds maintained by a host. Gas stove/lantern with shutoff OK with permit, 3 ft clearance.', verifiedOn: V,
  },
  {
    id: 'usfs-eldorado', developedSitesListed: ['Bear River Group Campground', 'South Shore Campground', 'Pardoes Point', 'Pipi', 'Caples Lake Campground', 'Caples Lake Boat Launch', 'Silver Lake East Campground', 'Kirkwood Lake', 'Woods Lake', 'Camp Winton (Boy Scouts of America)', 'Kit Carson Lodge', 'Caples Lake Resort', 'Two-Sentinels Girl Scout Camp', 'Black Oak Group Campground', 'Big Meadows Campground', 'Stumpy Meadows', 'Ponderosa Cove Group Campground', 'Crystal Administrative Site', 'Ice House', 'Fashoda', 'Sunset', 'Wench Creek', 'Wolf Creek', 'Yellowjacket Campground', 'Mountain Camp II', 'West Point', 'Gerle Creek', 'Loon Lake', 'Red Fir Group Campground', 'Northshore Campground', 'Wrights Lake', 'Deer Crossing Wilderness Camp', 'Power Pines Camp', 'Lover\'s Leap', 'Bridal Veil', 'Sand Flat Campground', 'China Flat Campground', 'Silver Fork Campground', 'Sly Park Education Center', 'Camp Sacramento', 'Sierra Pines Camp'], developedSitesComplete: true, noticeUpdated: '2026-08-20', boundary: { source: 'usfs', match: 'Eldorado National Forest' }, wildernessNote: 'No fires in Desolation or Mokelumne Wilderness.', name: 'Eldorado NF', agency: 'USFS', lat: 38.8, lng: -120.3, radiusKm: 45,
    stage: 'stage2', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-08-20', expires: '2026-11-29', orderNumber: '03-26-06',
    sourceUrl: 'https://www.fs.usda.gov/r05/eldorado/alerts/fire-restrictions-are-effect-forest-wide',
    notes: 'Aug 20 revision (supersedes 03-26-05) bans charcoal everywhere. Wood fires only in Exhibit A rings; the exhibit bundles facilities under one name (e.g. Ice House: campground, boat ramp, day use) so all rings at that complex qualify. No wilderness exemption (Desolation never allows wood fires).', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-ltbmu', developedSitesListed: ['Berkeley Camp', 'Blackwood Campground', 'Camp Concord', 'Camp Richardson Resort Campgrounds', 'Camp Richardson Stables', 'Camp Shelly', 'Fallen Leaf Campground', 'Kaspian Campground', 'Luther Campground', 'Meeks Bay Campground', 'Meeks Bay Resort and Campground', 'Nevada Beach Campground', 'Nevada Beach Day Use Area', 'Zephyr Cove Resort Campground', 'Watson Lake Campground', 'William Kent Campground', 'William Kent Day Use Area'], developedSitesComplete: true, noticeUpdated: '2026-08-20', confidence: 'medium', confidenceNote: 'Permanent 2024 order (page refreshed Aug 20, 2026; no new 2026 order), but local fire districts around the lake issue their own bans.', boundary: { source: 'usfs', match: 'Lake Tahoe Basin Management Unit' }, wildernessNote: 'Desolation Wilderness: never any wood fires.', name: 'Lake Tahoe Basin', agency: 'USFS', lat: 39.0, lng: -120.05, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2024-06-28', expires: '2027-12-01', orderNumber: '19-24-04',
    sourceUrl: 'https://fs.usda.gov/r05/laketahoebasin/alerts/campfire-restrictions',
    notes: 'Permanent order: wood fires only in installed rings at 17 listed campgrounds. Never in Desolation Wilderness, Meiss Country, along the PCT/TRT, beaches or general forest. Local fire districts add their own bans.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-stanislaus', developedSitesListed: ['Fraser Flat Campground', 'River Ranch Campground', 'Riverside Day Use Area', 'North Fork Day Use Area', 'Sand Bar Flat Campground', 'Crandall OHV Campground', 'Waka Luu Hep Yoo Campground', 'Sourgrass Day Use Area', 'Cascade Campground', 'Beardsley Lake Day Use Area', 'Beardsley Campground', 'Teleli puLaya Campground', 'Carlon Day Use Area', 'Dimond O Campground', 'Lost Claim Campground', 'Rainbow Pool Day Use Area', 'Sweetwater Campground', 'The Pines Campground', 'Peach Growers Tract', 'Cherry Valley Campground', 'Hull Creek Campground', 'Big Meadow Campground', 'Cottonwood Picnic Area', 'Clark Fork Campground', 'Clark Fork Horse Camp', 'Crabtree Campground', 'Donnell Vista Picnic Area', 'Fence Creek Campground', 'Herring Creek Campground', 'Herring Creek Reservoir Campground', 'Kerrick Corral Horse Camp', 'Meadowview Campground', 'Mill Creek Campground', 'Pioneer Trail Group Campground', 'Pinecrest Campground', 'Pinecrest Lake Picnic Area', 'Pine Valley Horse Camp', 'Sand Flat Campground'], developedSitesComplete: true, noticeUpdated: '2026-07-17', boundary: { source: 'usfs', match: 'Stanislaus National Forest' }, wildernessNote: 'Emigrant, Carson-Iceberg and Mokelumne have permanent elevation/area limits under separate orders.', name: 'Stanislaus NF', agency: 'USFS', lat: 38.2, lng: -120.0, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-17', expires: '2026-12-31', orderNumber: 'STF-16-2026-11 / -12',
    sourceUrl: 'https://www.fs.usda.gov/r05/stanislaus/alerts/temporary-fire-restrictions-high-hazard-area-stanislaus-national-forest',
    notes: 'Two zone orders — STF-16-2026-12 (High Hazard, 20 sites) and -11 (Moderate Hazard, 18 sites) — both limit campfires to Exhibit C developed sites through Dec 31. Emigrant and Mokelumne Wildernesses lie outside the High Hazard zone; their permanent elevation limits still apply — check your wilderness permit.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-sierra', developedSitesListed: ['Big Sandy Campground', 'Chilkoot Campground', 'Clover Meadow Campground', 'Denver Church Picnic Site', 'The Falls Picnic Site', 'Forks Campground', 'Fresno Dome Campground', 'Gaggs Campground', 'Greys Mountain Campground', 'Granite Creek Campground', 'Jerseydale Campground', 'Kelty Meadows', 'Lakeside Picnic Site', 'Little Denver Picnic Site', 'Lower Chiquito Campground', 'Lone Sequoia Campground', 'Lupine Cedar Bluff Campground', 'Nelder Grove Campground', 'Pine Point Picnic Site', 'Pine Slope Picnic Site', 'Recreation Point Group Campground', 'Rocky Point Picnic Site', 'Spring Cove Campground', 'Soquel Campground', 'Summerdale Campground', 'Whisky Falls Campground', 'Whiskers Campground', 'Wishon Point Campground', 'Badger Flat Campground', 'Badger Flat Group Site', 'Bald Mountain Base Camp', 'Bear Wallow Camping Area', 'Billy Creek Lower Campground', 'Billy Creek Upper Campground', 'Billy Creek Picnic Site', 'Bolsillo Campground', 'Bretz Mill Campground', 'Buck Meadow Campground', 'Catavee Campground', 'College Campground', 'Deer Creek Campground', 'Dinkey Creek Campground', 'Dorabelle Campground', 'Dorabelle Picnic Site', 'Dowville Picnic Site', 'Florence Lake Picnic Site', 'Gravel Flat Camping Area', 'Jackass Meadows Campground', 'Kirch Flat Campground', 'Kirch Flat Group Site', 'Lily Pad Campground', 'Marmot Rock Campground', 'Midge Creek Group Campground', 'Mono Creek Campground', 'Mono Creek Trailhead Campground', 'Portal Forebay Campground', 'Rancheria Campground', 'Sample Meadow Campground', 'Swanson Meadow Campground', 'Trapper Springs Campground', 'Upper Kings Group Campground', 'Vermillion Campground', 'Voyager Rock Camping Area', 'Ward Lake Campground', 'West Kaiser Campground', 'Wishon Village Campground'], developedSitesComplete: true, noticeUpdated: '2026-08-07', boundary: { source: 'usfs', match: 'Sierra National Forest' }, wildernessExempt: ['Ansel Adams Wilderness', 'John Muir Wilderness', 'Kaiser Wilderness', 'Dinkey Lakes Wilderness', 'Monarch Wilderness'], wildernessNote: 'Per Exhibit B map: no fires above 10,000 ft, nor at ~28 named lakes/meadows (Sadler, Rutherford, Chittenden, Lady, Jackass, Margaret Lakes, Devils Bathtub, Rae, Woodchuck, Crown, Portal Lake, etc.). Wilderness permit with campfire authorization still applies.', name: 'Sierra NF', agency: 'USFS', lat: 37.3, lng: -119.3, radiusKm: 50,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-08-07', expires: '2026-11-14', orderNumber: '05-15-00-26-10',
    sourceUrl: 'https://www.fs.usda.gov/r05/sierra/alerts/sierra-national-forest-fire-restrictions',
    notes: 'Campfires still allowed inside designated wilderness, except above 10,000 ft (north) / 10,400 ft (south) in Ansel Adams and John Muir (order 05-15-00-26-09).', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-inyo', noticeUpdated: '2026-08-12', developedSitesListed: ['Aerie Crag Campground', 'Aspen Campground', 'Big Bend Campground', 'Big Springs Campground', 'Deadman Campground', 'Ellery Lake Campground', 'Glass Creek Campground', 'Grant Lake Marina/Campground', 'Gull Lake Campground', 'Hartley Springs Campground', 'Junction Campground', 'June Lake Campground', 'Lower Lee Vining Campground', 'Moraine Campground', 'Obsidian Flat Campground', 'Oh! Ridge Campground', 'Reversed Creek Campground', 'Silver Lake Campground', 'Sawmill Campground', 'Tioga Lake Campground', 'Saddlebag Lake Campground', 'Walker Lake Trailhead', 'Agnew Meadows Campground', 'Coldwater Campground', 'Convict Lake Campground', 'Lake George Campground', 'Lake Mary Campground', 'Minaret Falls Campground', 'New Shady Rest Campground', 'Old Shady Rest Campground', 'Pine City Campground', 'Pine Glen Campground', 'Pumice Flat Campground', 'Reds Meadow Campground', 'Shady Rest Day Use Area', 'Sherwin Creek Campground', 'Twin Lakes Campground', 'Upper Soda Springs Campground', 'Aspen Campground', 'Big Meadow Campground', 'Big Pine Creek Campground', 'Big Trees Campground', 'Bishop Park Campground', 'Bitterbrush Campground', 'Clyde Glacier Campground', 'East Fork Campground', 'Ferguson Campground', 'Forks Campground', 'Four Jeffery Campground', 'French Camp Campground', 'Grandview Campground', 'Holiday Campground', 'Intake 2 (walk-in) Campground', 'Intake 2 Upper Campground', 'Iris Meadow Campground', 'McGee Creek Campground', 'Mosquito Flat Trailhead Campground', 'Mountain Glen Campground', 'Nelson Campground', 'Noren Campground', 'North Lake Campground', 'Palisade Glacier Campground', 'Pine Grove Campground', 'Rock Creek Lake Campground', 'Rock Creek Lake Group Campground', 'Sabrina Campground', 'Sage Flat Campground', 'Table Mountain Campground', 'Tuff Campground', 'Upper Pine Grove Campground', 'Upper Sage Flat Campground', 'Willow Campground', 'Cottonwood Lakes Backpacker Campground', 'Cottonwood Pass Backpacker', 'Horseshoe Meadow Equestrian Campground', 'Lone Pine Campground', 'Lone Pine Group Campground', 'Lower Grays Meadow Campground', 'Onion Valley Campground', 'Upper Grays Meadow Campground', 'Whitney Portal Campground', 'Whitney Portal Group Campground', 'Whitney Trailhead Campground', 'Four Jeffrey Campground'], developedSitesComplete: true, boundary: { source: 'usfs', match: 'Inyo National Forest' }, wildernessNote: 'No wilderness exemption: no campfires anywhere in Inyo wilderness under this order. Charcoal briquettes count as fires. Stoves must be pressurized gas/LPG with a shut-off valve.', name: 'Inyo NF', agency: 'USFS', lat: 37.4, lng: -118.6, radiusKm: 60,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-22', expires: '2026-12-31', orderNumber: '05-04-50-26-23',
    sourceUrl: 'https://www.fs.usda.gov/r05/inyo/alerts/stage-1-fire-restrictions-effect',
    notes: 'Charcoal banned outside Exhibit A sites. Permanent wilderness elevation bans (no fires above ~10,000 ft in John Muir/Ansel Adams) remain. Rock Fire area closure through Dec 31.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-htnf-carson', developedSitesRule: 'any_developed', noticeUpdated: '2026-06-29', boundary: { source: 'usfs', match: 'Humboldt-Toiyabe National Forest' }, name: 'Humboldt-Toiyabe — Carson RD', agency: 'USFS', lat: 38.7, lng: -119.8, radiusKm: 35,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-29', expires: '2026-10-31', orderNumber: '04-17-01-26-04',
    sourceUrl: 'https://www.fs.usda.gov/r04/humboldt-toiyabe/alerts/stage-1-fire-restrictions-carson-ranger-district',
    notes: 'No chainsaws or engine tools 1 pm–1 am. CA Campfire Permit required on the California side.', verifiedOn: '2026-08-28',
  },
  {
    id: 'usfs-htnf-bridgeport', developedSitesRule: 'any_developed', noticeUpdated: '2026-06-29', name: 'Humboldt-Toiyabe — Bridgeport RD', agency: 'USFS', lat: 38.2, lng: -119.4, radiusKm: 35,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-29', expires: '2026-10-31', orderNumber: '04-17-02-26-03',
    sourceUrl: 'https://www.fs.usda.gov/r04/humboldt-toiyabe/fire/fire-restrictions',
    notes: 'Hoover Wilderness: no dispersed fires under Stage 1.', verifiedOn: V,
  },

  // ───────────── BLM California ─────────────
  {
    id: 'blm-redding', orderNumber: 'CA-360-26-01', developedSitesListed: ['Shasta Campground', 'Ohl Olsen Campground', 'Bohemotash Primitive Campground', 'Junction City Campground', 'Steel Bridge Campground', 'Douglas City Campground', 'Reading Island Campground'], developedSitesComplete: true, noticeUpdated: '2026-06-28', boundary: { source: 'blm', match: 'Redding Field Office' }, name: 'BLM Redding Field Office', agency: 'BLM', lat: 40.6, lng: -122.4, radiusKm: 40,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-28', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-06/BLM-CA-2026-Fire-Restrictions-Order_Redding.pdf',
    notes: 'Campfires only at Shasta, Bohemotash, Ohl Olsen, Junction City, Steel Bridge, Douglas City and Reading Island sites; none in Butte County. Chainsaws until 1 pm; target shooting until noon.', verifiedOn: '2026-08-28',
  },
  {
    id: 'blm-arcata', orderNumber: 'CA-330-26-01', developedSitesRule: 'any_developed', noticeUpdated: '2026-06-28', boundary: { source: 'blm', match: 'Arcata Field Office' }, name: 'BLM Arcata Field Office (King Range / Lost Coast)', agency: 'BLM', lat: 40.2, lng: -124.0, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-28', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-06/BLM-CA-ArcataFO-Fire-Restrictions-2026_508.pdf',
    notes: 'Wood fires only in agency rings at developed sites. Applies to the Lost Coast Trail — no beach fires.', verifiedOn: '2026-08-28',
  },
  {
    id: 'blm-ukiah', noticeUpdated: '2026-06-05', boundary: { source: 'blm', match: 'Ukiah Field Office' }, name: 'BLM Ukiah Field Office (Cow Mtn, Cache Creek)', agency: 'BLM', lat: 39.1, lng: -122.9, radiusKm: 45,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-05', expires: 'until_rescinded',
    sourceUrl: 'https://www.blm.gov/announcement/blm-ukiah-field-office-issues-seasonal-fire-restrictions',
    notes: 'No campfires or open flame even in established campgrounds. Target shooting banned. Covers BLM portions of Berryessa Snow Mountain NM.', verifiedOn: '2026-08-28',
  },
  {
    id: 'blm-eagle-lake', developedSitesListed: ['North Eagle Lake Campground', 'Hobo Camp Day Use Area', 'Fort Sage Off-Highway Vehicle Area', 'Dodge Reservoir Campground', 'Ramhorn Springs Campground', 'Rice Canyon Off-Highway Vehicle Area'], developedSitesComplete: true, noticeUpdated: '2026-07-14', boundary: { source: 'blm', match: 'Eagle Lake Field Office' }, name: 'BLM Eagle Lake Field Office', agency: 'BLM', lat: 40.6, lng: -120.5, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-15', expires: 'until_rescinded', orderNumber: 'CAN-050-26-01',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-07/2026%20ELFO%20Fire%20Prevention%20Order_signed.pdf',
    notes: 'Campfires only at N. Eagle Lake CG, Hobo Camp, Fort Sage OHV, Dodge Reservoir CG, Ramhorn Springs CG and Rice Canyon OHV.', verifiedOn: '2026-08-28',
  },
  {
    id: 'blm-applegate', developedSitesListed: ['Pit River', 'Boulder Reservoir'], developedSitesComplete: true, noticeUpdated: '2026-07-14', boundary: { source: 'blm', match: 'Applegate Field Office' }, name: 'BLM Applegate Field Office (Alturas)', agency: 'BLM', lat: 41.5, lng: -120.5, radiusKm: 45,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-07-15', expires: 'until_rescinded', orderNumber: 'CA-320-26-01',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-07/2026%20AGFO%20Fire%20Prevention%20Order_signed.pdf',
    notes: 'Campfires only at Pit River and Boulder Reservoir recreation sites. No vehicles off established roads.', verifiedOn: '2026-08-28',
  },
  {
    id: 'blm-mother-lode', noticeUpdated: '2026-05-15', boundary: { source: 'blm', match: 'Mother Lode Field Office' }, name: 'BLM Mother Lode Field Office', agency: 'BLM', lat: 38.5, lng: -120.6, radiusKm: 55,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-05-15', expires: 'until_rescinded', orderNumber: 'CAC08000-26-05',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-05/MLFO_Fire_Restriction_Order_2026_508.pdf',
    notes: 'No campfire or open flame of any kind. Target shooting banned. Sierra foothills from Yuba/Nevada to Mariposa incl. Merced River, Cosumnes, South Yuba.', verifiedOn: '2026-08-28',
  },
  {
    id: 'blm-bishop', noticeUpdated: '2026-06-22', boundary: { source: 'blm', match: 'Bishop Field Office' }, name: 'BLM Bishop Field Office', agency: 'BLM', lat: 37.6, lng: -118.4, radiusKm: 50,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'prohibited',
    effective: '2026-06-22', expires: 'until_rescinded', orderNumber: 'CAC09000-26-06',
    sourceUrl: 'https://www.blm.gov/sites/default/files/docs/2026-06/BIFO_Fire_Restriction_Order_June_2026_508_signed.pdf',
    notes: "Signed order CAC09000-26-06 bans campfires and open flame of any kind — including in developed campgrounds; the press release reads looser than the order. Gas stoves OK with a CA Campfire Permit. Inyo, Mono and part of Alpine counties. Target shooting banned.", verifiedOn: '2026-08-28',
  },

  // ───────────── National Park Service ─────────────
  {
    id: 'nps-yosemite', developedSitesRule: 'any_developed', noticeUpdated: '2026-08-02', boundary: { source: 'nps', match: 'Yosemite National Park' }, name: 'Yosemite NP', agency: 'NPS', lat: 37.85, lng: -119.55, radiusKm: 45,
    stage: 'stage2', campfiresDeveloped: 'allowed', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'prohibited',
    effective: '2026-08-02', expires: 'until_rescinded', orderNumber: "Superintendent's Stage 2",
    sourceUrl: 'https://www.nps.gov/yose/planyourvisit/firerestrictions.htm',
    notes: 'Stage 2 applies below 8,000 ft. Between 8,000 and 9,600 ft: existing rings only, 100 ft from water/trail. Never above 9,600 ft. Twig stoves banned; gas/alcohol/tablet stoves OK.', verifiedOn: '2026-08-28',
  },
  {
    id: 'nps-lassen-volcanic', noticeUpdated: '2026-07-30', boundary: { source: 'nps', match: 'Lassen Volcanic National Park' }, name: 'Lassen Volcanic NP', agency: 'NPS', lat: 40.5, lng: -121.45, radiusKm: 20,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'prohibited',
    effective: '2026-07-31', expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/lavo/learn/news/llassen-volcanic-national-park-implements-stage-2-fire-restrictions.htm',
    notes: 'No wood or charcoal fires in any campground. Self-contained propane/petroleum stoves and lanterns OK.', verifiedOn: '2026-08-28',
  },
  {
    id: 'nps-lava-beds', noticeUpdated: '2026-08-25', boundary: { source: 'nps', match: 'Lava Beds National Monument' }, name: 'Lava Beds NM', agency: 'NPS', lat: 41.75, lng: -121.5, radiusKm: 15,
    stage: 'full_ban', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective: '2026-07-31', expires: 'until_rescinded', orderNumber: 'Closure Order 26-001',
    sourceUrl: 'https://www.nps.gov/labe/planyourvisit/conditions.htm',
    notes: 'Closure Order 26-001: no wood, charcoal, pellet or biomass fire anywhere, including Indian Well Campground rings. Gas/pressurized stoves with an integrated shut-off valve are allowed.', verifiedOn: '2026-08-28',
  },
  {
    id: 'nps-redwood', noticeUpdated: '2026-08-04', confidence: 'low', confidenceNote: 'No 2026 fire order found on nps.gov (conditions page dated Aug 4). Status is inferred, not confirmed.', boundary: { source: 'nps', match: 'Redwood National Park' }, name: 'Redwood National & State Parks', agency: 'NPS', lat: 41.3, lng: -124.0, radiusKm: 30,
    stage: 'unknown', campfiresDeveloped: 'allowed', campfiresDispersed: 'unknown', stoves: 'allowed', smoking: 'unknown',
    expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/redw/planyourvisit/conditions.htm',
    notes: 'No 2026 park-wide order posted as of Aug 28. Campground rings normally OK; backcountry fires often banned late summer. Call 707-464-6101.', verifiedOn: '2026-08-28',
  },
  {
    id: 'nps-whiskeytown', noticeUpdated: '2025-11-25', confidence: 'low', confidenceNote: 'nps.gov conditions page has not been updated since Nov 2025, yet Recreation.gov shows a 2026 gas-stove-only notice. Assume campfires are banned until the park says otherwise.', name: 'Whiskeytown NRA', agency: 'NPS', lat: 40.63, lng: -122.6, radiusKm: 15,
    stage: 'unknown', campfiresDeveloped: 'unknown', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    expires: 'until_rescinded',
    sourceUrl: 'https://www.nps.gov/whis/planyourvisit/conditions.htm',
    notes: 'Park has banned campfires each summer 2021–2025; a Recreation.gov note lists "gas stoves only" through Sep 1, 2026 but nps.gov shows no order. Call 530-242-3400.', verifiedOn: V,
  },
  {
    id: 'nps-point-reyes', noticeUpdated: '2026-08-28', confidence: 'medium', confidenceNote: 'Beach-fire permits are suspended day-by-day on high fire-danger days — call 415-464-5100 the morning of.', boundary: { source: 'nps', match: 'Point Reyes National Seashore' }, name: 'Point Reyes NS', agency: 'NPS', lat: 38.07, lng: -122.88, radiusKm: 20,
    stage: 'none', campfiresDeveloped: 'prohibited', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed', smoking: 'allowed',
    expires: 'until_rescinded', orderNumber: "Superintendent's Compendium",
    sourceUrl: 'https://www.nps.gov/pore/planyourvisit/beachfires.htm',
    notes: 'Beach fires only, with a free permit, below the high-tide line, 30 ft from vegetation, out by 10 pm; not on Drakes Beach. Suspended on any High fire-danger day — call 415-464-5100. No wood fires at backcountry camps.', verifiedOn: '2026-08-28',
  },

  // ───────────── CAL FIRE units (burn-permit suspensions; SRA / private land) ─────────────
  ...([
    ['shu', 'CAL FIRE Shasta-Trinity Unit', 40.55, -122.1, '2026-06-15', 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday'],
    ['tgu', 'CAL FIRE Tehama-Glenn Unit', 39.9, -122.3, '2026-06-15', 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday'],
    ['huu', 'CAL FIRE Humboldt-Del Norte Unit', 40.8, -123.9, '2026-06-15', 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday'],
    ['btu', 'CAL FIRE Butte Unit', 39.7, -121.6, '2026-06-15', 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday'],
    ['sku', 'CAL FIRE Siskiyou Unit', 41.7, -122.4, '2026-06-15', 'https://krcrtv.com/north-coast-news/eureka-local-news/cal-fire-suspends-burn-permits-across-the-northstate-starting-monday'],
    ['lnu', 'CAL FIRE Sonoma-Lake-Napa Unit', 38.6, -122.6, '2026-06-15', 'https://permitsonoma.org/sonomacountyannouncesburnsuspensiononjune15'],
    ['meu', 'CAL FIRE Mendocino Unit', 39.3, -123.4, '2026-06-15', 'https://mendovoice.com/2026/06/cal-fire-suspends-burn-permits-for-mendocino-county/'],
    ['neu', 'CAL FIRE Nevada-Yuba-Placer Unit', 39.2, -121.1, '2026-06-15', 'https://yubanet.com/regional/cal-fire-suspends-burn-permits-in-nevada-yuba-placer-and-sierra-counties-on-june-15-2026/'],
    ['aeu', 'CAL FIRE Amador-El Dorado Unit', 38.6, -120.9, '2026-06-15', 'https://www.eldoradocountyfire.com/cal-fire-implements-burn-permit-suspension-in-el-dorado-county-due-to-high-fire-danger'],
    ['tcu', 'CAL FIRE Tuolumne-Calaveras Unit', 38.1, -120.5, '2026-06-15', 'https://new.thepinetree.net/?p=202470'],
    ['lmu', 'CAL FIRE Lassen-Modoc Unit', 40.9, -120.9, '2026-06-17', 'https://plumassun.org/2026/06/15/cal-fire-suspends-residential-burn-permits-june-17/'],
  ] as const).map(([code, name, lat, lng, effective, sourceUrl]): Jurisdiction => ({
    id: `calfire-${code}`, name, agency: 'CAL FIRE', lat, lng, radiusKm: 30,
    stage: 'stage1', campfiresDeveloped: 'allowed', campfiresDispersed: 'allowed_with_permit', stoves: 'allowed_with_permit', smoking: 'unknown',
    effective, expires: 'until_rescinded', noticeUpdated: effective, confidence: 'medium', confidenceNote: 'Burn-permit suspensions are announced via press release, not a durable page; county ordinances may add campfire limits.',
    sourceUrl,
    notes: 'Residential debris-burn permits suspended in State Responsibility Area. Campfires in organized campgrounds and on private land with owner permission (and a CA Campfire Permit) remain legal unless a local ordinance says otherwise. This is the trigger counties use for local bans.',
    verifiedOn: V,
  })),

  // ───────────── State Parks ─────────────
  {
    id: 'csp-folsom-peninsula', name: 'Folsom Lake SRA — Peninsula CG', agency: 'State Parks', lat: 38.75, lng: -121.1, radiusKm: 8,
    stage: 'stage2', campfiresDeveloped: 'prohibited', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    effective: '2026-06-10', expires: '2026-12-31',
    sourceUrl: 'https://www.parks.ca.gov/post/113',
    notes: 'Campfires, wood/charcoal cooking and liquid-fuel torches prohibited for the rest of the 2026 season. Other state parks: no statewide order — fires only in provided rings; check each park.', verifiedOn: V,
  },
  {
    id: 'csp-auburn', confidence: 'low', confidenceNote: '2026 district order not located; based on the pattern of prior years.', name: 'Auburn SRA', agency: 'State Parks', lat: 38.92, lng: -121.0, radiusKm: 12,
    stage: 'unknown', campfiresDeveloped: 'unknown', campfiresDispersed: 'prohibited', stoves: 'allowed', smoking: 'unknown',
    expires: 'until_rescinded',
    sourceUrl: 'https://www.parks.ca.gov/?page_id=502',
    notes: 'Gold Fields District has banned all campfires here every summer (2025 order 690-058). 2026 order not located — assume banned until the district confirms.', verifiedOn: V,
  },
]
