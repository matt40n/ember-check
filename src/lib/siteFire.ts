import type { RecSite } from '../api/boundaries'
import type { Jurisdiction, Allow } from '../types'
import { resolveProbe, type BoundarySets } from './probe'
import { STAGE_LABEL } from './stage'

export type FireVerdict = {
  kind: 'ok' | 'permit' | 'check' | 'no' | 'unknown'
  /** Short, e.g. "No campfires" */
  label: string
  /** One sentence for the card */
  detail: string
  jurisdiction: Jurisdiction | null
  wilderness: string | null
}

const RING: Record<FireVerdict['kind'], string> = { ok: '#4CAF50', permit: '#E0A100', check: '#C9B458', no: '#E4572E', unknown: '#8A8F8B' }
const norm = (s: string) => s.toLowerCase().replace(/\b(campground|campgrounds|group|camp|cg|site|sites|recreation|area|day use|picnic|boat-in|boat in|equestrian|horse)\b/g, '').replace(/[^a-z]/g, '')
/** Exhibit names are terse ("Castle Lake"), EDW names verbose ("Castle Lake Campground"); match on the normalized core. */
export const namesMatch = (exhibit: string, edw: string) => {
  const a = norm(exhibit), b = norm(edw)
  return a.length > 2 && b.length > 2 && (a === b || b.startsWith(a) || a.startsWith(b))
}
export const verdictRing = (v: FireVerdict) => RING[v.kind]

function fromAllow(a: Allow): FireVerdict['kind'] {
  return a === 'allowed' ? 'ok' : a === 'allowed_with_permit' ? 'permit' : a === 'prohibited' ? 'no' : 'unknown'
}

/** Can you have a wood/charcoal campfire at this specific site, right now, under the enclosing order? */
export function siteFireVerdict(site: RecSite, all: Jurisdiction[], b: BoundarySets, redFlag = false): FireVerdict {
  const r = resolveProbe(site.lat, site.lng, all, b)
  const j = r.jurisdiction
  const base = { jurisdiction: j, wilderness: r.wilderness }
  if (redFlag) return { ...base, kind: 'no', label: 'No campfires', detail: 'Red Flag Warning active — all open fire prohibited today.' }
  if (!j) return { ...base, kind: 'unknown', label: 'Check locally', detail: 'No tracked fire order covers this site. Ask the ranger district.' }
  // A state park, county park, USACE lake or private campground sitting inside a forest or field-office
  // boundary is not the land that order governs — its own operator sets the campfire rule.
  const otherOperator = site.operator && site.operator !== j.agency && (j.agency === 'USFS' || j.agency === 'BLM') && !['USFS', 'BLM', 'Unknown operator'].includes(site.operator)
  if (otherOperator) {
    return { ...base, kind: 'check', label: `Ask ${site.operator === 'State Parks' ? 'the park' : 'the operator'}`, detail: `${site.operator === 'State Parks' ? 'California State Parks' : site.operator} runs this campground, so ${j.name}'s ${STAGE_LABEL[j.stage]} order doesn't apply here — the park or operator sets its own campfire rule and usually follows CAL FIRE conditions. Check the park page or call ahead; posted signs govern.` }
  }

  const dispersed = site.kind === 'Dispersed Camping'
  if (dispersed && r.wildernessExempt) {
    return { ...base, kind: 'permit', label: 'Campfire OK with permit', detail: `Inside ${r.wilderness}, which ${j.name}'s ${STAGE_LABEL[j.stage]} order exempts. Carry a CA Campfire Permit.${j.wildernessNote ? ` ${j.wildernessNote}` : ''}` }
  }
  // Under a restriction order, "campground rings allowed" applies only to sites named in the order's
  // exhibit of developed sites. Free / undeveloped campgrounds (e.g. Gumboot, Shasta-Trinity) are not.
  if (!dispersed && j.stage !== 'none' && j.stage !== 'unknown' && j.campfiresDeveloped !== 'prohibited' && j.developedSitesRule !== 'any_developed') {
    const listed = j.developedSitesListed?.some((n) => namesMatch(n, site.name))
    if (!listed && j.developedSitesComplete) {
      return {
        ...base,
        kind: 'no',
        label: 'No campfires — not a listed site',
        detail: `${j.name} (${STAGE_LABEL[j.stage]}) allows ring fires only at the developed sites named in order ${j.orderNumber ?? ''}'s exhibit, and this site is not on it. Gas stove ${j.stoves === 'prohibited' ? 'also prohibited' : 'OK with a CA Campfire Permit'}.`,
      }
    }
    if (!listed) {
      const freeHint = /^no fee\b|^free\b/i.test(site.fee ?? '') ? ' This is a no-fee site, which usually means it is not a listed developed site.' : ''
      return {
        ...base,
        kind: 'check',
        label: 'Rings only if listed in order',
        detail: `${j.name} (${STAGE_LABEL[j.stage]}) allows ring fires only at developed sites named in the order's exhibit. This map ${j.developedSitesListed?.length ? "doesn't find this site on the part of that list it knows" : "doesn't have that list"} — assume no wood fires unless the order PDF or posted signs say otherwise.${freeHint} Gas stove ${j.stoves === 'prohibited' ? 'also prohibited' : 'OK with a CA Campfire Permit'}.`,
      }
    }
  }
  const allow = dispersed ? j.campfiresDispersed : j.campfiresDeveloped
  const kind = fromAllow(allow)
  const where = dispersed ? 'This is a dispersed site — it has no agency fire ring' : 'Developed site'
  const detail =
    kind === 'no'
      ? `${where}. ${j.name} is under ${STAGE_LABEL[j.stage]}: ${dispersed ? 'no fires outside developed campground rings' : 'no wood or charcoal fires even in rings'}. Gas stove ${j.stoves === 'prohibited' ? 'also prohibited' : 'OK with a CA Campfire Permit'}.`
      : kind === 'permit'
        ? `${where}. ${j.name} (${STAGE_LABEL[j.stage]}) allows a fire here only with a CA Campfire Permit${dispersed ? '' : ', in the provided ring'}.${!dispersed && j.stage === 'stage2' ? ' Under Stage 2 that usually means only campgrounds with a host on site — confirm when you arrive.' : ''}`
        : kind === 'ok'
          ? `${where}. ${j.name} (${STAGE_LABEL[j.stage]}) allows wood fires ${dispersed ? 'here with a CA Campfire Permit' : 'in the provided rings'}.`
          : `${where}. ${j.name}'s order doesn't state this clearly — call the district.`
  const label = kind === 'no' ? 'No campfires' : kind === 'permit' ? 'Campfire OK with permit' : kind === 'ok' ? (dispersed ? 'Campfire OK with permit' : 'Campfire OK in rings') : 'Check locally'
  return { ...base, kind: kind === 'ok' && dispersed ? 'permit' : kind, label, detail }
}
