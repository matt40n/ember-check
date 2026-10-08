// src/components/PlanBanner.tsx
import { CalendarClock } from 'lucide-react'
import { usePlanWindow } from '../hooks/usePlanWindow'
import { describeWindow } from '../lib/plan'
import { formatUpcomingDate } from '../lib/upcoming'

/** Under the header while a window other than Today is active */
export function PlanBanner() {
  const { window: w, today, isToday, reset } = usePlanWindow()
  if (isToday) return null
  return (
    <div role="status" className="pointer-events-auto flex flex-wrap items-center gap-x-2 gap-y-1 rounded border border-signgold/60 bg-pine-900/95 px-3 py-2 text-xs text-cream backdrop-blur md:w-[380px]">
      <CalendarClock size={13} className="shrink-0 text-signgold" />
      <span><b className="text-signgold">Planning {describeWindow(w, today)}</b> · from changes announced as of {formatUpcomingDate(today, today)}</span>
      <span className="text-cream-dim">Red Flag Warnings and wildfires are shown for today only.</span>
      <button onClick={reset} className="ml-auto rounded border border-signgold/60 px-2 py-0.5 font-semibold text-signgold hover:bg-signgold/15">Back to today</button>
    </div>
  )
}
