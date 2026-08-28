import type { Jurisdiction } from '../types'
import { STAGE_COLOR, STAGE_SHORT } from '../lib/stage'
import { countdownLabel, expiryText } from '../lib/time'

export function JurisdictionList({ items, selectedId, onSelect }: { items: Jurisdiction[]; selectedId: string | null; onSelect: (j: Jurisdiction) => void }) {
  if (items.length === 0) return <p className="p-3 text-sm text-cream-dim">No units match this filter.</p>
  return (
    <ul className="divide-y divide-pine-700">
      {items.map((j) => {
        const e = expiryText(j.expires)
        return (
          <li key={j.id}>
            <button
              onClick={() => onSelect(j)}
              className={`flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-pine-700/60 ${selectedId === j.id ? 'bg-pine-700' : ''}`}
            >
              <span className="mt-1.5 inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: STAGE_COLOR[j.stage] }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-semibold leading-tight">{j.name}</span>
                <span className="block text-xs text-cream-dim">
                  {j.agency} · {j.stale ? 'unverified — re-check' : `${STAGE_SHORT[j.stage]} · ${countdownLabel(e.days, e.past)}`}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
