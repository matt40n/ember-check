import { describe, expect, test } from 'bun:test'
import { alertCards, alertsIndexFor, fireAlerts, newerFireAlerts } from './alerts'

// The <main> element of the Shasta-Trinity alerts index as served on 2026-10-01: the "Alerts Key" legend (four
// cards with no link or date), one region-wide alert, a sort form labelled "Alert Start Date:", and 20 forest alerts.
const index = await Bun.file(new URL('./__fixtures__/usfs-alerts-index-shasta-trinity.html', import.meta.url)).text()
/** scripts/verify-orders.ts collapses whitespace in everything it fetches */
const collapsed = index.replace(/\s+/g, ' ')
const LIFTED = { title: '2026 fire restrictions lifted', date: '2026-10-02', path: '/r05/shasta-trinity/alerts/2026-fire-restrictions-lifted' }

describe('alertsIndexFor', () => {
  test('an alert page gives its forest\'s alerts index', () => {
    expect(alertsIndexFor('https://www.fs.usda.gov/r05/shasta-trinity/alerts/2026-fire-restrictions-lifted')).toBe('https://www.fs.usda.gov/r05/shasta-trinity/alerts')
  })
  test('a newsroom release gives the same forest\'s alerts index', () => {
    expect(alertsIndexFor('https://www.fs.usda.gov/r05/lassen/newsroom/releases/lassen-national-forest-lift-fire-restrictions')).toBe('https://www.fs.usda.gov/r05/lassen/alerts')
  })
  test('any other page on a forest\'s site does too, in any region, with or without www', () => {
    expect(alertsIndexFor('https://www.fs.usda.gov/r04/humboldt-toiyabe/fire/fire-restrictions')).toBe('https://www.fs.usda.gov/r04/humboldt-toiyabe/alerts')
    expect(alertsIndexFor('https://fs.usda.gov/r05/laketahoebasin/alerts/campfire-restrictions')).toBe('https://fs.usda.gov/r05/laketahoebasin/alerts')
  })
  test('pages that are not on a forest\'s site have no alerts index', () => {
    expect(alertsIndexFor('https://www.nps.gov/lavo/planyourvisit/conditions.htm')).toBeNull()
    expect(alertsIndexFor('https://www.blm.gov/announcement/blm-announces-seasonal-fire-restrictions')).toBeNull()
    expect(alertsIndexFor('https://www.fs.usda.gov/visit/know-before-you-go/fire')).toBeNull()
  })
})

describe('alertCards', () => {
  test('reads every dated alert on the index and skips the legend', () => {
    const cards = alertCards(index)
    expect(cards).toHaveLength(21)
    expect(cards[0]).toEqual({ title: 'Fireworks and Explosives are always Prohibited', date: '2026-04-01', path: '/r05/alerts/fireworks-and-explosives-are-always-prohibited' })
    expect(cards).toContainEqual(LIFTED)
  })
  test('a page with none of the cards yields nothing, which the verify script reports as a markup change', () => {
    // the pre-redesign markup the old regex was written for
    expect(alertCards('<ul><li><a href="/r05/lassen/alerts/fire-restrictions">Fire Restrictions</a> <span>July 3, 2026</span></li></ul>')).toEqual([])
  })
})

describe('fireAlerts', () => {
  test('finds the fire-restriction alerts on the current index, with ISO start dates and link paths', () => {
    expect(fireAlerts(index)).toEqual([
      LIFTED,
      { title: 'Mount Shasta Plantation Area Camping and Fire Restrictions', date: '2026-07-29', path: '/r05/shasta-trinity/alerts/mount-shasta-plantation-area-camping-and-fire-restrictions-0' },
    ])
  })
  test('reads the whitespace-collapsed page the verify script fetches the same way', () => {
    expect(fireAlerts(collapsed)).toEqual(fireAlerts(index))
  })
  test('an alert with no start date is skipped, not paired with the next alert\'s date', () => {
    const card = (title: string, footer: string) => `<li class="usa-card usa-card--flag wfs-alert-flag fire-restriction"> <div class="usa-card__container"> <header class="usa-card__header"> <h3 class="alert_level--fire-restriction"> <a href="/r05/lassen/alerts/${title.toLowerCase().replace(/ /g, '-')}"> <span>${title}</span> </a> </h3> </header> <div class="usa-card__body"> … </div> ${footer} </div> </li>`
    const dated = (d: string) => `<footer class="usa-card__footer"> <div class="grid-row"> <div class="tablet:grid-col"> <strong>Alert Start Date:</strong> ${d} </div> </div> </footer>`
    const html = `<ul>${card('Campfire permits', '')}${card('Stage 2 Fire Restrictions', dated('October 15, 2026'))}</ul>`
    expect(fireAlerts(html)).toEqual([{ title: 'Stage 2 Fire Restrictions', date: '2026-10-15', path: '/r05/lassen/alerts/stage-2-fire-restrictions' }])
  })
  test('titles come back as text: entities decoded', () => {
    const html = `<li class="usa-card usa-card--flag wfs-alert-flag fire-restriction"><h3 class="alert_level--fire-restriction"><a href="/r05/inyo/alerts/x"><span>Campfire &amp; Stove Restrictions</span></a></h3><footer><strong>Alert Start Date:</strong> June 1, 2026</footer></li>`
    expect(fireAlerts(html).map((a) => a.title)).toEqual(['Campfire & Stove Restrictions'])
  })

  // Titles as posted on the 14 tracked forests' indexes, 2026-10-01
  const titled = (title: string) => `<li class="usa-card usa-card--flag wfs-alert-flag information"><h3 class="alert_level--information"><a href="/r05/x/alerts/y"><span>${title}</span></a></h3><footer><strong>Alert Start Date:</strong> October 1, 2026</footer></li>`
  test.each([
    '2026 fire restrictions lifted',
    'Forest Fire Restrictions 2026 have been lifted as of 09/27/2026',
    'Stage I Fire Restrictions - Plumas National Forest',
    'Stage 1 Fire Restrictions, Santa Rosa Ranger District',
    'Campfire Restrictions',
    'Camping and Campfire Restrictions-Truckee and Sierraville Districts',
    'Temporary Moderate Hazard Fire Restrictions Stanislaus National Forest',
    'Fire Restrictions are in Effect Forest Wide',
    'Forest-wide fire ban',
    'Stage 2 in effect Friday',
    'Seasonal restrictions rescinded',
  ])('"%s" is a fire-restriction alert', (title) => {
    expect(fireAlerts(titled(title))).toHaveLength(1)
  })
  test.each([
    'Lucas Fire Area Closure in Effect',
    'Floriston Fire Closure',
    'Fall Prescribed Fire Projects',
    'Safety Tips for Burned Areas: Garnet Fire Area',
    'Fireworks and Explosives are always Prohibited',
    'Mount Shasta-McCloud Seasonal Area and Road Closure',
    'Bailey Cove Road Closure Order',
    'Forest Road Closure Order',
    'Lassen National Forest Camping Restrictions',
    'Mt. Shasta Wilderness Area Restrictions',
    'Emergency Recreation Shooting Order (Carson Ranger District)',
  ])('"%s" is not', (title) => {
    expect(fireAlerts(titled(title))).toEqual([])
  })
})

describe('newerFireAlerts', () => {
  const forest = { name: 'Lassen NF', sourceUrl: 'https://www.fs.usda.gov/r05/lassen/newsroom/releases/lassen-national-forest-lift-fire-restrictions' }
  const alert = (date: string, title = 'Stage 1 Fire Restrictions', path = '/r05/lassen/alerts/stage-1-fire-restrictions') => ({ title, date, path })

  test('an alert that starts after the entry\'s effective date is newer', () => {
    expect(newerFireAlerts([alert('2026-10-15')], { ...forest, effective: '2026-10-01' })).toEqual([alert('2026-10-15')])
  })
  test('an alert that starts on the effective date is not newer, whatever timezone the check runs in', () => {
    expect(newerFireAlerts([alert('2026-10-02')], { ...forest, effective: '2026-10-02' })).toEqual([])
  })
  test('an older alert is not newer', () => {
    expect(newerFireAlerts([alert('2026-07-29')], { ...forest, effective: '2026-10-02' })).toEqual([])
  })
  test('the entry\'s own source alert is left out even when its start date is after the effective date on file', () => {
    const own = { ...forest, sourceUrl: 'https://fs.usda.gov/r05/shasta-trinity/alerts/2026-fire-restrictions-lifted/', effective: '2026-09-30' }
    expect(newerFireAlerts([LIFTED], own)).toEqual([])
    expect(newerFireAlerts([LIFTED], { ...forest, effective: '2026-09-30' })).toEqual([LIFTED])
  })
  test('an entry with no effective date has nothing to compare against', () => {
    expect(newerFireAlerts([alert('2026-10-15')], forest)).toEqual([])
  })

  // Humboldt-Toiyabe posts one alert per ranger district; we track two of its districts as separate entries
  const carson = { name: 'Humboldt-Toiyabe — Carson RD', sourceUrl: 'https://www.fs.usda.gov/r04/humboldt-toiyabe/alerts/stage-1-fire-restrictions-carson-ranger-district', effective: '2026-06-29' }
  const santaRosa = alert('2026-07-01', 'Stage 1 Fire Restrictions, Santa Rosa Ranger District', '/r04/humboldt-toiyabe/alerts/stage-1-fire-restrictions-santa-rosa-ranger-district')
  test('a district entry ignores an alert that names only other ranger districts', () => {
    expect(newerFireAlerts([santaRosa], carson)).toEqual([])
  })
  test('a district entry keeps alerts that name its district, or no district at all', () => {
    const mine = alert('2026-10-20', 'Stage 2 Fire Restrictions, Carson and Bridgeport Ranger Districts', '/r04/humboldt-toiyabe/alerts/stage-2')
    const forestWide = alert('2026-10-20', 'Fire restrictions lifted', '/r04/humboldt-toiyabe/alerts/lifted')
    expect(newerFireAlerts([mine, forestWide], carson)).toEqual([mine, forestWide])
  })
  test('a forest-wide entry keeps district alerts', () => {
    expect(newerFireAlerts([santaRosa], { name: 'Humboldt-Toiyabe NF', sourceUrl: carson.sourceUrl, effective: '2026-06-29' })).toEqual([santaRosa])
  })
})
