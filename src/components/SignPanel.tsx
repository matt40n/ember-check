import { ExternalLink, Flag, Flame, Phone, Trees } from 'lucide-react'
import { reportUrl } from '../lib/report'
import { CAMPFIRE_PERMIT_URL } from '../lib/permit'
import type { Allow, Jurisdiction } from '../types'
import { ALLOW_COLOR, ALLOW_LABEL, STAGE_EXPLAINER, STAGE_LABEL } from '../lib/stage'
import { countdownLabel, expiryText } from '../lib/time'
import type { ProbeResult } from '../lib/probe'
import { Confidence } from './Confidence'

function Row({ label, value, note }: { label: string; value: Allow; note?: string }) {
  return (
    <div className="flex items-center justify-between border-t border-signgold/25 py-1.5">
      <span className="font-display text-base font-semibold uppercase tracking-wide">
        {label}
        {note && <span className="ml-1.5 font-sans text-[11px] font-normal normal-case tracking-normal text-signgold/70">{note}</span>}
      </span>
      <span className="flex items-center gap-2 font-mono text-xs">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ALLOW_COLOR[value] }} />
        {ALLOW_LABEL[value]}
      </span>
    </div>
  )
}

export function SignPanel({ result, redFlag }: { result: ProbeResult; redFlag: boolean }) {
  const j: Jurisdiction | null = result.jurisdiction
  if (!j) {
    return (
      <div className="sign rounded-md p-4">
        <p className="font-display text-2xl font-bold uppercase leading-none">Pick a spot</p>
        <p className="mt-2 text-sm text-signgold/85">
          Click anywhere on the map to see whether a campfire is legal there right now and when that changes.
        </p>
      </div>
    )
  }
  const exp = expiryText(j.expires)
  const exempt = result.wildernessExempt
  const dispersed: Allow = exempt ? 'allowed_with_permit' : j.campfiresDispersed
  const noFires = redFlag || (!exempt && (j.stage === 'stage2' || j.stage === 'full_ban'))
  return (
    <div className="sign rounded-md p-4" aria-live="polite">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-signgold/75">
        {j.agency} · {j.name}
        {result.district && <span className="text-signgold/55"> · {result.district.replace(' Ranger District', ' RD')}</span>}
      </p>
      <p className="mt-1 font-display text-4xl font-extrabold uppercase leading-[0.95]">
        {redFlag ? 'Red flag — no fires' : STAGE_LABEL[j.stage]}
      </p>
      <p className="mt-2 flex items-center gap-2 font-mono text-sm">
        <Flame size={14} className={noFires ? 'text-ember' : 'text-ok'} />
        {countdownLabel(exp.days, exp.past)}
        {exp.days !== null && <span className="text-signgold/60">· {exp.label}</span>}
      </p>
      {(redFlag || result.wilderness) && (
        <p className={`mt-2 rounded p-2 font-display text-lg font-bold uppercase leading-tight ${redFlag || !exempt ? 'bg-ember/20 text-cream' : 'bg-ok/20 text-cream'}`}>
          {redFlag ? 'At this spot today: no fires of any kind' : exempt ? 'At this spot: campfire OK with a CA Campfire Permit' : 'At this spot: no campfires'}
        </p>
      )}
      {j.stale && (
        <p className="mt-2 rounded border border-unknown bg-pine-950/40 p-2 text-xs text-cream">
          <b>Treated as unverified.</b> {j.stale.reason} Last known: {STAGE_LABEL[j.stale.original.stage]}
          {j.stale.original.orderNumber ? ` (order ${j.stale.original.orderNumber})` : ''}. Check the source link below before relying on it.
        </p>
      )}
      {redFlag && (
        <p className="mt-2 rounded border border-ember bg-ember/15 p-2 text-xs text-cream">
          A Red Flag Warning is active for this area. Most agencies prohibit all open fire during a warning regardless of the posted stage.
        </p>
      )}
      {result.wilderness && (
        <p className={`mt-2 flex items-start gap-2 rounded border p-2 text-xs ${exempt ? 'border-ok bg-ok/15 text-cream' : 'border-signgold/40 bg-pine-950/30 text-signgold/85'}`}>
          <Trees size={14} className="mt-0.5 shrink-0" />
          <span>
            <b>Inside {result.wilderness}.</b>{' '}
            {exempt
              ? `This order exempts it: campfires allowed with a CA Campfire Permit.${j.wildernessNote ? ` ${j.wildernessNote}` : ''}`
              : `This wilderness is NOT exempt from the ${STAGE_LABEL[j.stage]} order — no campfires here.${j.wildernessNote ? ` ${j.wildernessNote}` : ''}`}
          </span>
        </p>
      )}
      <p className="mt-3 text-sm leading-snug text-signgold/85">
        {result.wilderness && <b className="text-signgold">{exempt ? 'Elsewhere in the forest (outside exempt wildernesses): ' : 'Forest-wide: '}</b>}
        {STAGE_EXPLAINER[j.stage]}
        {exempt && <span className="text-signgold/70"> The exemption above overrides this where you clicked.</span>}
      </p>
      <div className="mt-3">
        <Row label="Campground rings" value={j.campfiresDeveloped} />
        <Row label="Dispersed / backcountry" value={dispersed} note={exempt ? `here, via ${result.wilderness?.replace(' Wilderness', '')} exemption` : undefined} />
        <Row label="Gas stove" value={j.stoves} />
        <Row label="Smoking" value={j.smoking} />
      </div>
      {(exempt || dispersed === 'allowed_with_permit' || j.stoves === 'allowed_with_permit' || j.campfiresDeveloped === 'allowed_with_permit') && (
        <a href={CAMPFIRE_PERMIT_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded border border-signgold/50 bg-pine-950/30 px-2.5 py-1.5 text-xs font-semibold text-signgold underline-offset-2 hover:underline">
          <ExternalLink size={12} /> Get the free California Campfire Permit (CAL FIRE) — required wherever this sign says "with permit"
        </a>
      )}
      {j.wildernessExempt && j.wildernessExempt.length > 0 && !exempt && (
        <p className="mt-2 text-xs text-signgold/75">
          Backcountry fires still OK (with permit) inside: {j.wildernessExempt.map((w) => w.replace(' Wilderness', '')).join(', ')} — shown green on the map.
        </p>
      )}
      {j.notes && <p className="mt-3 text-xs leading-snug text-signgold/75">{j.notes}</p>}
      <Confidence j={j} />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <a href={j.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
          <ExternalLink size={12} /> {j.orderNumber ? `Order ${j.orderNumber}` : 'Source'}
        </a>
        <span className="inline-flex items-center gap-1 text-signgold/60">
          <Phone size={12} /> confirm with the ranger district before you go
        </span>
        <a href={reportUrl('order', { name: j.name, jurisdictionId: j.id, orderNumber: j.orderNumber, extra: STAGE_LABEL[j.stage] })} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-signgold/60 underline underline-offset-2">
          <Flag size={12} /> report a change
        </a>
      </div>
    </div>
  )
}
