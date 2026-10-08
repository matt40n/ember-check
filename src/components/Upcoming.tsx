import { CalendarClock } from 'lucide-react'
import { formatUpcomingDate, type UpcomingItem } from '../lib/upcoming'

/**
 * Dated changes ahead at a place: announced fire-rule changes, an order's end date, a campground's closing night
 * and reopening day. Shown on every surface that describes a place, because people plan trips around these.
 */
export function Upcoming({ items, today, variant = 'card', title = 'Upcoming' }: { items: UpcomingItem[]; today: string; variant?: 'card' | 'sign'; title?: string }) {
  if (items.length === 0) return null
  const tone = variant === 'sign' ? 'border-signgold/50 bg-pine-950/30 text-signgold/90' : 'border-signgold/40 bg-pine-950/40 text-cream'
  return (
    <div className={`mt-2 rounded border p-2 ${tone}`}>
      <p className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-signgold">
        <CalendarClock size={13} /> {title}
      </p>
      {/* auto-sized date column: every date stays on one line and the descriptions line up */}
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs leading-snug">
        {items.map((i) => (
          <div key={i.date + i.text} className="contents">
            <dt className="whitespace-nowrap font-mono text-signgold">{formatUpcomingDate(i.date, today)}</dt>
            <dd>{i.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
