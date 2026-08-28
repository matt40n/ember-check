import { useMemo } from 'react'
import L from 'leaflet'
import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { AlertTriangle, Flag, CalendarDays, Clock, ExternalLink, Flame, Tent, Ticket } from 'lucide-react'
import type { RecSite } from '../api/boundaries'
import { useZoom } from '../hooks/useZoom'
import { feeVerdict } from '../lib/text'
import { siteFreshness } from '../lib/freshness'
import { Confidence } from './Confidence'
import { reportUrl } from '../lib/report'
import { namesMatch, siteFireVerdict, verdictRing, type FireVerdict } from '../lib/siteFire'
import type { BoundarySets } from '../lib/probe'
import type { Jurisdiction } from '../types'

const KIND_COLOR: Record<RecSite['kind'], string> = {
  'Campground Camping': '#F2C94C',
  'Group Camping': '#C9B458',
  'Dispersed Camping': '#8FB8DE',
}
const VERDICT_STYLE: Record<FireVerdict['kind'], string> = {
  ok: 'border-ok bg-ok/20 text-cream',
  permit: 'border-amber bg-amber/20 text-cream',
  check: 'border-[#C9B458] bg-[#C9B458]/15 text-cream',
  no: 'border-ember bg-ember/25 text-cream',
  unknown: 'border-pine-600 bg-pine-700 text-cream-dim',
}
const FEE_STYLE = {
  free: 'bg-ok/20 text-ok border-ok/50',
  paid: 'bg-signgold/15 text-signgold border-signgold/50',
  unknown: 'bg-pine-700 text-cream-dim border-pine-600',
}

export function SitePopup({ s, v, inline = false }: { s: RecSite; v: FireVerdict; inline?: boolean }) {
  const fee = feeVerdict(s.fee)
  const fresh = siteFreshness(s)
  const showOpen = s.open !== null && fresh.status !== 'outdated'
  const rg = `https://www.recreation.gov/search?q=${encodeURIComponent(s.name)}`
  const siteNote = Object.entries(v.jurisdiction?.siteNotes ?? {}).find(([n]) => namesMatch(n, s.name))?.[1]
  return (
    <div className={inline ? 'text-sm leading-snug' : 'max-h-[60vh] w-[280px] overflow-y-auto text-xs leading-snug'}>
      <div className="flex items-start gap-2">
        <Tent size={18} className="mt-0.5 shrink-0 text-signgold" />
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight">{s.name}</p>
          <p className="text-cream-dim">
            {s.forest.replace('National Forest', 'NF')} · {s.kind.replace(' Camping', '')}
            {showOpen && <span className={s.open ? 'text-ok' : 'text-ember'}> · {s.open ? 'open' : 'closed'}</span>}
          </p>
        </div>
      </div>

      {fresh.status !== 'current' && (
        <p className={`mt-2 flex items-start gap-1.5 rounded border p-1.5 ${fresh.status === 'outdated' ? 'border-ember/60 bg-ember/10 text-cream' : 'border-pine-600 bg-pine-700/60 text-cream-dim'}`}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> <span>{fresh.note}</span>
        </p>
      )}

      <div className={`mt-2 rounded border p-2 ${VERDICT_STYLE[v.kind]}`}>
        <p className="flex items-center gap-1.5 font-display text-base font-bold uppercase leading-none">
          <Flame size={14} /> {v.label}
        </p>
        <p className="mt-1 text-cream-dim">{v.detail}</p>
        <p className="mt-1 text-[11px] text-cream-dim/80">Posted signs at the site override this map.</p>
        {siteNote && <p className="mt-1 flex items-start gap-1.5 text-cream"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> <span>{siteNote}</span></p>}
        {v.jurisdiction && <div className="mt-1.5 border-t border-cream/15 pt-1.5"><Confidence j={v.jurisdiction} compact /></div>}
      </div>

      <div className={`mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-sm ${FEE_STYLE[fee.kind]}`}>
        <Ticket size={13} /> {fee.headline}
      </div>
      {s.fee && fee.kind !== 'free' && <p className="mt-1 whitespace-pre-line text-cream-dim">{s.fee}</p>}
      {s.fee && fee.kind === 'free' && s.fee.length > 12 && <p className="mt-1 whitespace-pre-line text-cream-dim">{s.fee}</p>}

      {s.reservations && (
        <p className="mt-2 whitespace-pre-line"><b className="text-cream">Reservations:</b> {s.reservations}</p>
      )}
      {s.season && (
        <p className="mt-2 flex items-start gap-1.5"><CalendarDays size={13} className="mt-0.5 shrink-0 text-cream-dim" /><span className="whitespace-pre-line">{s.season}</span></p>
      )}
      {s.hours && (
        <p className="mt-1 flex items-start gap-1.5"><Clock size={13} className="mt-0.5 shrink-0 text-cream-dim" /><span className="whitespace-pre-line">{s.hours}</span></p>
      )}
      {s.description && <p className="mt-2 whitespace-pre-line text-cream-dim">{s.description.length > 400 ? s.description.slice(0, 400) + '…' : s.description}</p>}
      {s.restrictions && (
        <p className="mt-2 whitespace-pre-line"><b className="text-cream">Site rules:</b> {s.restrictions.length > 300 ? s.restrictions.slice(0, 300) + '…' : s.restrictions}</p>
      )}

      <div className="mt-3 flex flex-col gap-1 border-t border-pine-600 pt-2">
        {s.url && (
          <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-signgold underline underline-offset-2">
            <ExternalLink size={12} /> Forest Service site page
          </a>
        )}
        <a href={rg} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-signgold underline underline-offset-2">
          <ExternalLink size={12} /> Search Recreation.gov for availability
        </a>
        <a href={reportUrl('site', { name: s.name, jurisdictionId: v.jurisdiction?.id, orderNumber: v.jurisdiction?.orderNumber, extra: v.label })} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cream-dim underline underline-offset-2">
          <Flag size={12} /> Report a sign or rule that disagrees
        </a>
      </div>
    </div>
  )
}

export function CampgroundLayer({ sites, all, boundaries, coarse = false, onSelect }: { sites: RecSite[] | undefined; all: Jurisdiction[]; boundaries: BoundarySets; coarse?: boolean; onSelect?: (s: RecSite, v: FireVerdict) => void }) {
  const zoom = useZoom()
  // The 'sites' pane gets its own canvas; tolerance is the extra hit-test slack in px around each pin.
  const renderer = useMemo(() => L.canvas({ pane: 'sites', tolerance: coarse ? 14 : 4 }), [coarse])
  const verdicts = useMemo(() => {
    if (!sites) return []
    return sites.map((s) => siteFireVerdict(s, all, boundaries))
  }, [sites, all, boundaries])
  if (!sites || zoom < 8) return null
  // ring color = campfire verdict, fill = site type; fingers need roughly double the target of a cursor
  const r = coarse ? (zoom < 10 ? 8 : 11) : zoom < 10 ? 5 : 7
  return (
    <>
      {sites.map((s, i) => {
        const fee = feeVerdict(s.fee)
        const v = verdicts[i]
        return (
          <CircleMarker
            key={`${s.name}-${s.lat}-${s.lng}`}
            center={[s.lat, s.lng]}
            radius={r}
            pane="sites"
            pathOptions={{ color: verdictRing(v), weight: coarse ? 3.5 : 2.5, fillColor: s.open === false ? '#8A8F8B' : KIND_COLOR[s.kind], fillOpacity: 0.95, bubblingMouseEvents: false }}
            renderer={renderer}
            eventHandlers={coarse && onSelect ? { click: () => onSelect(s, v) } : undefined}
          >
            {coarse ? null : (<>
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-display text-sm font-bold">{s.name}</span>
              <span className="ml-1.5 text-xs opacity-80">{fee.headline}</span>
              <span className="block text-xs" style={{ color: verdictRing(v) }}>{v.label}</span>
            </Tooltip>
            <Popup maxWidth={320} closeButton>
              <SitePopup s={s} v={v} />
            </Popup>
            </>)}
          </CircleMarker>
        )
      })}
    </>
  )
}
