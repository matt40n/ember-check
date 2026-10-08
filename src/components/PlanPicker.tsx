// src/components/PlanPicker.tsx
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { usePlanWindow } from '../hooks/usePlanWindow'
import { addDays, describeWindow, MAX_DAYS_AHEAD, MAX_NIGHTS, nextWeekend, thisWeekend, todayWindow } from '../lib/plan'

/** "Today ▾" chip in the header: presets and a date + nights picker for the trip window */
export function PlanPicker() {
  const { window: w, today, isToday, set } = usePlanWindow()
  const [open, setOpen] = useState(false)
  const [arrive, setArrive] = useState(w.arrive)
  const [nights, setNights] = useState(w.nights)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { setArrive(w.arrive); setNights(w.nights) }, [w])
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])
  const choose = (next: typeof w) => { set(next); setOpen(false) }
  const preset = (label: string, next: typeof w) => (
    <button key={label} onClick={() => choose(next)} className={`rounded-full border px-2.5 py-0.5 text-xs ${w.arrive === next.arrive && w.nights === next.nights ? 'border-signgold bg-signgold text-pine-900' : 'border-pine-600 text-cream hover:border-signgold'}`}>
      {label}
    </button>
  )
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog" className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${isToday ? 'border-pine-600 text-cream-dim hover:border-signgold' : 'border-signgold bg-signgold/15 text-signgold'}`}>
        <CalendarDays size={11} /> {isToday ? 'Today' : describeWindow(w, today)} <ChevronDown size={11} />
      </button>
      {open && (
        <div role="dialog" aria-label="Plan for a date" className="absolute left-0 top-full z-[1200] mt-1 w-[300px] rounded border border-pine-600 bg-pine-900 p-3 text-xs shadow-lg">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-signgold">Plan for a date</p>
          <p className="mt-0.5 text-cream-dim">Shows the map as it will be then, from changes agencies have announced. Nothing is predicted.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {preset('Today', todayWindow(today))}
            {preset('This weekend', thisWeekend(today))}
            {preset('Next weekend', nextWeekend(today))}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-2">
            <label className="block">
              <span className="text-cream-dim">Arrive</span>
              <input type="date" value={arrive} min={today} max={addDays(today, MAX_DAYS_AHEAD)} onChange={(e) => setArrive(e.target.value)} className="mt-0.5 w-full rounded border border-pine-600 bg-pine-800 px-2 py-1 text-cream" />
            </label>
            <label className="block w-[72px]">
              <span className="text-cream-dim">Nights</span>
              <input type="number" value={nights} min={1} max={MAX_NIGHTS} onChange={(e) => setNights(Math.max(1, Math.min(MAX_NIGHTS, Number(e.target.value) || 1)))} className="mt-0.5 w-full rounded border border-pine-600 bg-pine-800 px-2 py-1 text-cream" />
            </label>
          </div>
          <button onClick={() => choose({ arrive, nights })} className="mt-3 w-full rounded bg-signgold py-1.5 font-semibold text-pine-900 hover:bg-signgold/90">
            Show the map for these dates
          </button>
        </div>
      )}
    </div>
  )
}
