import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import type { Jurisdiction } from '../types'

export function confidenceOf(j: Jurisdiction) {
  if (j.stale) return 'low' as const
  return j.confidence ?? (j.orderNumber ? 'high' : 'medium')
}

const STYLE = {
  high: { icon: ShieldCheck, cls: 'text-ok', label: 'High confidence' },
  medium: { icon: ShieldQuestion, cls: 'text-amber', label: 'Medium confidence' },
  low: { icon: ShieldAlert, cls: 'text-ember', label: 'Low confidence' },
}

/** One line: how sure we are, when the agency notice was dated, when we last checked — plus the reason if not high. */
export function Confidence({ j, compact = false }: { j: Jurisdiction; compact?: boolean }) {
  const level = confidenceOf(j)
  const { icon: Icon, cls, label } = STYLE[level]
  const note = j.stale ? j.stale.reason : j.confidenceNote
  return (
    <div className={`text-xs ${compact ? '' : 'mt-2'}`}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className={`inline-flex items-center gap-1 font-semibold ${cls}`}>
          <Icon size={13} /> {label}
        </span>
        {j.noticeUpdated && <span className="opacity-75">· agency notice dated {j.noticeUpdated}</span>}
        <span className="opacity-75">· checked {j.verifiedOn}</span>
      </p>
      {note && level !== 'high' && <p className="mt-0.5 opacity-90">{note}</p>}
    </div>
  )
}
