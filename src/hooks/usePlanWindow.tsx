import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { formatWindow, isTodayWindow, parseWindow, todayWindow, type TripWindow } from '../lib/plan'
import { pacificToday } from '../lib/scheduled'

type Ctx = { window: TripWindow; today: string; isToday: boolean; set: (w: TripWindow) => void; reset: () => void }
const PlanWindowContext = createContext<Ctx | null>(null)

/** Holds the trip window, reads it from the address on load and mirrors changes back without a reload. */
export function PlanWindowProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(pacificToday)
  const [window_, setWindow] = useState<TripWindow>(() => parseWindow(location.search, pacificToday()))
  // Re-check the Pacific date hourly and when the tab comes back; a window left open past midnight must move on
  useEffect(() => {
    const tick = () => setToday(pacificToday())
    const id = setInterval(tick, 60 * 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [])
  // A window whose arrival has slipped into the past falls back to Today (parseWindow applies the same rule)
  const window = useMemo(() => (window_.arrive < today ? todayWindow(today) : window_), [window_, today])
  const set = useCallback((w: TripWindow) => {
    const next = parseWindow(formatWindow(w, today), today)
    setWindow(next)
    history.replaceState(null, '', `${location.pathname}${formatWindow(next, today)}${location.hash}`)
  }, [today])
  const reset = useCallback(() => set(todayWindow(today)), [set, today])
  const value = useMemo<Ctx>(() => ({ window, today, isToday: isTodayWindow(window, today), set, reset }), [window, today, set, reset])
  return <PlanWindowContext.Provider value={value}>{children}</PlanWindowContext.Provider>
}

export function usePlanWindow(): Ctx {
  const ctx = useContext(PlanWindowContext)
  if (!ctx) throw new Error('usePlanWindow outside PlanWindowProvider')
  return ctx
}
