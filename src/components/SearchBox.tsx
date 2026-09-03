import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, Tent, X } from 'lucide-react'
import type { RecSite } from '../api/boundaries'
import type { Jurisdiction } from '../types'

type Hit =
  | { kind: 'site'; site: RecSite; label: string; sub: string }
  | { kind: 'order'; j: Jurisdiction; label: string; sub: string }
  | { kind: 'place'; lat: number; lng: number; label: string; sub: string }

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Campgrounds and orders match locally as you type; places (lakes, towns, trailheads) come from OpenStreetMap's geocoder on Enter or after a pause. */
export function SearchBox({ sites, orders, onSite, onOrder, onPlace }: { sites: RecSite[] | undefined; orders: Jurisdiction[]; onSite: (s: RecSite) => void; onOrder: (j: Jurisdiction) => void; onPlace: (lat: number, lng: number, label: string) => void }) {
  const [q, setQ] = useState('')
  const [places, setPlaces] = useState<Hit[]>([])
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const timer = useRef<number | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const needle = fold(q.trim())
  const local: Hit[] = needle.length < 2 ? [] : [
    ...orders.filter((j) => fold(j.name).includes(needle)).slice(0, 3).map((j): Hit => ({ kind: 'order', j, label: j.name, sub: `${j.agency} · fire order` })),
    ...(sites ?? []).filter((s) => fold(s.name).includes(needle)).slice(0, 6).map((s): Hit => ({ kind: 'site', site: s, label: s.name, sub: s.forest.replace('National Forest', 'NF') })),
  ]
  const hits = [...local, ...places]

  async function geocode(text: string) {
    if (text.trim().length < 3) return
    setBusy(true)
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: text, format: 'jsonv2', countrycodes: 'us', viewbox: '-124.6,42.1,-114,32.5', bounded: '1', limit: '5' })}`, { headers: { Accept: 'application/json' } })
      const rows = (await r.json()) as { lat: string; lon: string; display_name: string; type: string; name?: string }[]
      setPlaces(rows.map((p) => ({ kind: 'place', lat: +p.lat, lng: +p.lon, label: p.name || p.display_name.split(',')[0], sub: p.display_name.split(',').slice(1, 3).join(',').trim() || p.type })))
    } catch {
      setPlaces([])
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    setPlaces([])
    if (needle.length < 3) return
    timer.current = window.setTimeout(() => geocode(q), 700)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  useEffect(() => {
    const off = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [])

  function choose(h: Hit) {
    setOpen(false)
    setQ('')
    setPlaces([])
    if (h.kind === 'site') onSite(h.site)
    else if (h.kind === 'order') onOrder(h.j)
    else onPlace(h.lat, h.lng, h.label)
  }

  return (
    <div ref={box} className="relative">
      <label className="flex items-center gap-2 rounded bg-pine-900/90 px-2.5 py-1.5 backdrop-blur focus-within:ring-2 focus-within:ring-signgold">
        <Search size={15} className="shrink-0 text-cream-dim" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (e.key === 'Enter') { e.preventDefault(); if (hits[active]) choose(hits[active]); else geocode(q) }
            else if (e.key === 'Escape') setOpen(false)
          }}
          placeholder="Search campgrounds, forests, lakes, towns…"
          aria-label="Search campgrounds and places"
          className="min-w-0 flex-1 bg-transparent text-sm text-cream placeholder:text-cream-dim/70 focus:outline-none"
        />
        {q && <button onClick={() => { setQ(''); setPlaces([]) }} aria-label="Clear search" className="text-cream-dim hover:text-cream"><X size={14} /></button>}
      </label>
      {open && (hits.length > 0 || busy || needle.length >= 3) && (
        <ul className="absolute left-0 right-0 top-full z-[1200] mt-1 max-h-[50vh] overflow-y-auto rounded border border-pine-700 bg-pine-900/98 py-1 text-sm shadow-lg backdrop-blur" role="listbox">
          {hits.map((h, i) => (
            <li key={h.kind + h.label + i} role="option" aria-selected={i === active}>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => choose(h)} onMouseEnter={() => setActive(i)} className={`flex w-full items-start gap-2 px-3 py-1.5 text-left ${i === active ? 'bg-pine-700' : ''}`}>
                {h.kind === 'site' ? <Tent size={14} className="mt-0.5 shrink-0 text-signgold" /> : h.kind === 'order' ? <span className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm bg-signgold" /> : <MapPin size={14} className="mt-0.5 shrink-0 text-cream-dim" />}
                <span className="min-w-0">
                  <span className="block truncate">{h.label}</span>
                  <span className="block truncate text-xs text-cream-dim">{h.sub}</span>
                </span>
              </button>
            </li>
          ))}
          {busy && <li className="px-3 py-1.5 text-xs text-cream-dim">Searching places…</li>}
          {!busy && hits.length === 0 && needle.length >= 3 && <li className="px-3 py-1.5 text-xs text-cream-dim">No matches. Press Enter to search places by name.</li>}
          {places.length > 0 && <li className="px-3 pt-1 text-[10px] text-cream-dim/70">Places © OpenStreetMap contributors (Nominatim)</li>}
        </ul>
      )}
    </div>
  )
}
