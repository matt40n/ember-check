import { useEffect, useMemo, useRef, useState } from 'react'
import type L from 'leaflet'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Flame, Info, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { SearchBox } from './components/SearchBox'
import { siteFireVerdict } from './lib/siteFire'
import { MapView } from './components/MapView'
import { SignPanel } from './components/SignPanel'
import { JurisdictionList } from './components/JurisdictionList'
import { Legend } from './components/Legend'
import { Toggle } from './components/Toggle'
import { LiveLayers } from './components/LiveLayers'
import { SpotConditions } from './components/SpotConditions'
import { JurisdictionFills } from './components/JurisdictionFills'
import { WildernessLayer } from './components/WildernessLayer'
import { DistrictLayer } from './components/DistrictLayer'
import { CampgroundLayer, SitePopup } from './components/CampgroundLayer'
import type { RecSite } from './api/boundaries'
import type { FireVerdict } from './lib/siteFire'
import { useCoarsePointer } from './hooks/useCoarsePointer'
import { useRedFlag } from './hooks/useRedFlag'
import { useLiveStatus } from './hooks/useLiveStatus'
import { useForestBoundaries } from './api/usfs'
import { useBlmFieldOffices, useNpsUnits, useRangerDistricts, useRecSites, useWilderness } from './api/boundaries'
import { JURISDICTIONS as RAW, DATA_VERIFIED_ON } from './data/restrictions'
import { applyFreshness } from './lib/freshness'
import { CAMPFIRE_PERMIT_URL } from './lib/permit'

/** Entries older than 14 days or past expiry are shown as Unverified rather than trusted. */
const JURISDICTIONS = applyFreshness(RAW)
import { jurisdictionsAt, resolveProbe, type ProbeResult } from './lib/probe'
import type { Agency, Jurisdiction } from './types'

const AGENCIES: Agency[] = ['USFS', 'BLM', 'NPS', 'CAL FIRE', 'State Parks']
const EMPTY: ProbeResult = { jurisdiction: null, unitName: null, district: null, wilderness: null, wildernessExempt: false }
/** One step of the click-cycle at a spot: the wilderness itself, or one of the orders stacked there. */
type Step = { kind: 'wilderness'; name: string; j: Jurisdiction | null } | { kind: 'order'; j: Jurisdiction }

export default function App() {
  const [probe, setProbe] = useState<{ lat: number; lng: number } | null>(null)
  const [result, setResult] = useState<ProbeResult>(EMPTY)
  const [agencies, setAgencies] = useState<Set<Agency>>(new Set(AGENCIES))
  const [layers, setLayers] = useState({
    fills: true, wilderness: true, districts: true, campgrounds: true, backcountryOnly: false,
    redFlag: true, fires: true, perimeters: true, danger: false, blm: false,
  })
  const [drawer, setDrawer] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [ack, setAck] = useState(true)
  useEffect(() => {
    try { setAck(localStorage.getItem('ember-check-ack') === '1') } catch { setAck(false) }
  }, [])
  const acknowledge = () => { setAck(true); try { localStorage.setItem('ember-check-ack', '1') } catch { /* private mode */ } }
  const live = useLiveStatus()
  const coarse = useCoarsePointer()
  const [legendOpen, setLegendOpen] = useState(true)
  useEffect(() => {
    try { setLegendOpen(localStorage.getItem('ember-check-legend') !== 'hidden') } catch { /* keep default */ }
  }, [])
  const toggleLegend = () => setLegendOpen((o) => { try { localStorage.setItem('ember-check-legend', o ? 'hidden' : 'shown') } catch { /* private mode */ } return !o })
  const [site, setSite] = useState<{ s: RecSite; v: FireVerdict } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  useEffect(() => {
    try { setSidebarOpen(localStorage.getItem('ember-check-sidebar') !== 'hidden') } catch { /* keep default */ }
  }, [])
  const toggleSidebar = () => setSidebarOpen((o) => { try { localStorage.setItem('ember-check-sidebar', o ? 'hidden' : 'shown') } catch { /* private mode */ } return !o })
  const [ordersOpen, setOrdersOpen] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const [legendH, setLegendH] = useState(0)
  useEffect(() => {
    const el = legendRef.current
    if (!el) { setLegendH(0); return }
    const ro = new ResizeObserver(() => setLegendH(el.getBoundingClientRect().height))
    ro.observe(el)
    setLegendH(el.getBoundingClientRect().height)
    return () => ro.disconnect()
  }, [legendOpen])
  const flyTo = (lat: number, lng: number, zoom = 12) => mapRef.current?.flyTo([lat, lng], Math.max(mapRef.current.getZoom(), zoom), { duration: 0.8 })

  const forests = useForestBoundaries()
  const blm = useBlmFieldOffices()
  const nps = useNpsUnits()
  const wilderness = useWilderness()
  const districts = useRangerDistricts()
  const sites = useRecSites()

  const boundaries = useMemo(
    () => ({ usfs: forests.data, blm: blm.data, nps: nps.data, wilderness: wilderness.data, districts: districts.data }),
    [forests.data, blm.data, nps.data, wilderness.data, districts.data],
  )
  const visible = useMemo(() => JURISDICTIONS.filter((j) => agencies.has(j.agency)), [agencies])
  const selected = result.jurisdiction
  const redFlag = useRedFlag(probe)
  const boundariesLoading = forests.isLoading || blm.isLoading || nps.isLoading || wilderness.isLoading

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [result, site])

  /** Repeated clicks on the same spot walk through every order stacked there (wilderness/park → forest → field office), then clear. */
  const [cycle, setCycle] = useState<{ lat: number; lng: number; list: Step[]; idx: number } | null>(null)
  const sameSpot = (lat: number, lng: number) => {
    if (!cycle || !mapRef.current) return false
    const a = mapRef.current.latLngToContainerPoint([lat, lng]), b = mapRef.current.latLngToContainerPoint([cycle.lat, cycle.lng])
    return a.distanceTo(b) <= 12
  }
  function stepsAt(lat: number, lng: number): Step[] {
    const base = resolveProbe(lat, lng, JURISDICTIONS, boundaries)
    const orders = jurisdictionsAt(lat, lng, JURISDICTIONS, boundaries)
    const steps: Step[] = orders.map((j) => ({ kind: 'order', j }))
    if (base.wilderness) steps.unshift({ kind: 'wilderness', name: base.wilderness, j: orders[0] ?? null })
    return steps
  }
  function showAt(lat: number, lng: number, list: Step[], idx: number) {
    const step = list[idx]
    setSite(null)
    setProbe({ lat, lng })
    const base = resolveProbe(lat, lng, JURISDICTIONS, boundaries)
    setResult(step ? { ...base, jurisdiction: step.j, wildernessFocus: step.kind === 'wilderness' } : base)
    setCycle({ lat, lng, list, idx })
    setDrawer(true)
  }
  function clearSelection() {
    setCycle(null)
    setSite(null)
    setProbe(null)
    setResult(EMPTY)
    setDrawer(false)
    mapRef.current?.closePopup()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (showAbout) { setShowAbout(false); return }
      if (document.activeElement instanceof HTMLInputElement) { (document.activeElement as HTMLInputElement).blur(); return }
      clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAbout])

  function selectSite(s: RecSite, v: FireVerdict) {
    setSite({ s, v })
    setProbe({ lat: s.lat, lng: s.lng })
    setResult(resolveProbe(s.lat, s.lng, JURISDICTIONS, boundaries))
    setDrawer(true)
  }
  function probeAt(lat: number, lng: number) {
    if (sameSpot(lat, lng) && cycle) {
      const next = cycle.idx + 1
      if (next >= cycle.list.length) { clearSelection(); return }
      showAt(cycle.lat, cycle.lng, cycle.list, next)
      return
    }
    showAt(lat, lng, stepsAt(lat, lng), 0)
  }
  function pickFromList(j: Jurisdiction) {
    showAt(j.lat, j.lng, [{ kind: 'order', j }], 0)
  }
  const searchSite = (s: RecSite) => { flyTo(s.lat, s.lng, 13); selectSite(s, siteFireVerdict(s, JURISDICTIONS, boundaries)); if (!coarse) setSidebarOpen(true) }
  const searchOrder = (j: Jurisdiction) => { flyTo(j.lat, j.lng, 9); pickFromList(j); if (!coarse) setSidebarOpen(true) }
  const searchPlace = (lat: number, lng: number) => { flyTo(lat, lng, 12); probeAt(lat, lng); if (!coarse) setSidebarOpen(true) }
  const pickFromMap = (j: Jurisdiction, lat: number, lng: number) => {
    if (sameSpot(lat, lng)) { probeAt(lat, lng); return }
    const list = stepsAt(lat, lng)
    // A click that landed on a unit's own polygon starts on that unit, but a wilderness on top comes first
    const idx = Math.max(0, list.findIndex((st) => st.kind === 'wilderness' || st.j === j))
    showAt(lat, lng, list.length ? list : [{ kind: 'order', j }], idx)
  }

  return (
    <div className="relative h-full w-full overflow-clip">
      <MapView onClick={probeAt} probe={probe} mapRef={mapRef}>
        <LiveLayers layers={layers} onProbe={probeAt} />
        {layers.fills && (
          <>
            <JurisdictionFills fc={blm.data} source="blm" nameField="ADMU_NAME" all={JURISDICTIONS} fillOpacity={0} hiddenUnlessSelected selectedId={selected?.id ?? null} onPick={pickFromMap} onMiss={probeAt} />
            <JurisdictionFills fc={forests.data} source="usfs" nameField="forestname" all={JURISDICTIONS} fillOpacity={0.32} selectedId={selected?.id ?? null} onPick={pickFromMap} onMiss={probeAt} />
            <JurisdictionFills fc={nps.data} source="nps" nameField="UNIT_NAME" all={JURISDICTIONS} fillOpacity={0.32} selectedId={selected?.id ?? null} onPick={pickFromMap} onMiss={probeAt} />
          </>
        )}
        {layers.districts && <DistrictLayer fc={districts.data} />}
        {layers.wilderness && <WildernessLayer fc={wilderness.data} all={JURISDICTIONS} onClick={probeAt} selectedName={result.wildernessFocus ? result.wilderness : null} />}
        {layers.campgrounds && <CampgroundLayer sites={sites.data} all={JURISDICTIONS} boundaries={boundaries} coarse={coarse} onSelect={selectSite} backcountryOnly={layers.backcountryOnly} />}
      </MapView>

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[1000] flex flex-col gap-2 p-3">
      <header className="pointer-events-none flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded bg-pine-900/90 px-3 py-2 backdrop-blur md:w-[380px]">
          <Flame className="text-signgold" size={20} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold uppercase leading-none tracking-wide">Ember Check</h1>
            <p className="text-[11px] text-cream-dim">
              NorCal campfire restrictions · verified {DATA_VERIFIED_ON}
              {boundariesLoading && <span className="ml-2 text-signgold">loading boundaries…</span>}
            </p>
            {live.problem && <p className="mt-0.5 text-[11px] font-semibold text-ember">{live.problem}</p>}
          </div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button onClick={toggleSidebar} className="hidden rounded bg-pine-900/90 p-2 text-cream-dim hover:text-cream md:block" aria-label={sidebarOpen ? 'Hide panel' : 'Show panel'} aria-expanded={sidebarOpen} title={sidebarOpen ? 'Hide panel' : 'Show panel'}>
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <button onClick={() => setShowAbout(true)} className="rounded bg-pine-900/90 p-2 text-cream-dim hover:text-cream" aria-label="About and disclaimers">
            <Info size={18} />
          </button>
        </div>
      </header>
      <div className="pointer-events-auto md:w-[380px]">
        <SearchBox sites={sites.data} orders={JURISDICTIONS} onSite={searchSite} onOrder={searchOrder} onPlace={searchPlace} />
      </div>
      {!ack && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded border border-ember/60 bg-pine-950/95 px-4 py-2.5 text-center text-xs text-cream backdrop-blur md:fixed md:bottom-3 md:left-1/2 md:top-auto md:w-auto md:max-w-xl md:-translate-x-1/2">
          <span>Not legal advice. Orders change with little notice — <b>posted signs and the ranger district override this map.</b></span>
          <span className="flex gap-3">
            <button onClick={() => setShowAbout(true)} className="underline underline-offset-2">How to read it</button>
            <button onClick={acknowledge} className="rounded bg-signgold px-2.5 py-0.5 font-semibold text-pine-900">Got it</button>
          </span>
        </div>
      )}
      </div>

      <aside
        className={`absolute z-[1000] flex flex-col bg-pine-900/95 backdrop-blur transition-transform
          md:left-3 md:top-[7.5rem] md:bottom-3 md:w-[380px] md:rounded-md md:border md:border-pine-700 ${sidebarOpen ? '' : 'md:hidden'}
          max-md:inset-x-0 max-md:max-h-[62vh] max-md:rounded-t-xl max-md:border-t max-md:border-pine-700
          ${drawer ? '' : 'max-md:translate-y-[calc(100%-44px)]'}`}
        style={coarse ? { bottom: legendH } : undefined}
      >
        <button onClick={() => setDrawer((d) => !d)} className="flex h-11 shrink-0 items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-cream-dim md:hidden" aria-label={drawer ? 'Hide panel' : 'Show panel'} aria-expanded={drawer}>
          <span className="h-1.5 w-12 rounded-full bg-pine-600" />
          {drawer ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          {drawer ? 'Hide' : site ? site.s.name : result.wildernessFocus && result.wilderness ? result.wilderness : selected ? selected.name : 'Details'}
        </button>
        <div ref={scrollRef} className="overflow-y-auto p-3 pt-0 md:pt-3">
          {site ? (
            <div className="rounded-md border border-pine-600 bg-pine-800 p-3">
              <SitePopup s={site.s} v={site.v} inline />
              <button onClick={() => setSite(null)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-signgold">
                <ChevronLeft size={14} /> Area rules{selected ? ` · ${selected.name}` : ''}
              </button>
            </div>
          ) : (
            <SignPanel result={result} redFlag={redFlag.active} onClear={clearSelection} stack={cycle && cycle.list.length > 1 ? { names: cycle.list.map((st) => (st.kind === 'wilderness' ? st.name : st.j.name)), idx: cycle.idx } : undefined} />
          )}
          {probe && !selected && !site && (
            <p className="mt-2 text-xs text-cream-dim">
              {result.unitName ? `Inside ${result.unitName}, but no current order is tracked for it.` : 'No tracked jurisdiction covers this point. It may be private, state, or county land — CAL FIRE burn rules apply.'}
            </p>
          )}
          {redFlag.headline && <p className="mt-2 text-xs text-ember">{redFlag.headline}</p>}
          <SpotConditions pt={probe} />

          <section className="mt-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream-dim">Boundaries</h2>
            <Toggle label="Restriction stage fills" hint="USFS · BLM · NPS" on={layers.fills} onChange={(v) => setLayers({ ...layers, fills: v })} />
            <Toggle label="Wilderness fire exemptions" hint="USFS" on={layers.wilderness} onChange={(v) => setLayers({ ...layers, wilderness: v })} />
            <Toggle label="Ranger districts" hint="USFS" on={layers.districts} onChange={(v) => setLayers({ ...layers, districts: v })} />
            <Toggle label="Campgrounds & dispersed sites" hint="zoom in" on={layers.campgrounds} onChange={(v) => setLayers({ ...layers, campgrounds: v })} />
            <Toggle label="Backcountry sites only" hint="wilderness camps · OSM" on={layers.backcountryOnly} onChange={(v) => setLayers({ ...layers, backcountryOnly: v })} />
            <Toggle label="BLM land ownership" hint="tiles" on={layers.blm} onChange={(v) => setLayers({ ...layers, blm: v })} />
          </section>

          <section className="mt-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream-dim">Live conditions</h2>
            <Toggle label="Red Flag Warnings" hint="NWS · hourly" on={layers.redFlag} onChange={(v) => setLayers({ ...layers, redFlag: v })} />
            <Toggle label="Active wildfires" hint="NIFC · hourly" on={layers.fires} onChange={(v) => setLayers({ ...layers, fires: v })} />
            <Toggle label="Fire perimeters" hint="NIFC · hourly" on={layers.perimeters} onChange={(v) => setLayers({ ...layers, perimeters: v })} />
            <Toggle label="Fire danger (ERC percentile)" hint="NFDRS · daily" on={layers.danger} onChange={(v) => setLayers({ ...layers, danger: v })} />
          </section>

          <section className="mt-4">
            <button onClick={() => setOrdersOpen((o) => !o)} aria-expanded={ordersOpen} className="flex w-full items-center justify-between font-display text-sm font-bold uppercase tracking-widest text-cream-dim">
              <span>Orders in effect <span className="ml-1 font-sans text-xs font-normal normal-case tracking-normal text-cream-dim/70">{visible.length} tracked</span></span>
              {ordersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {ordersOpen && <>
            <div className="my-2 flex flex-wrap gap-1.5">
              {AGENCIES.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    const n = new Set(agencies)
                    n.has(a) ? n.delete(a) : n.add(a)
                    setAgencies(n)
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${agencies.has(a) ? 'border-signgold bg-signgold text-pine-900' : 'border-pine-600 text-cream-dim'}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="-mx-3">
              <JurisdictionList items={visible} selectedId={selected?.id ?? null} onSelect={pickFromList} />
            </div>
            </>}
          </section>
        </div>
        <div className="border-t border-pine-700 p-3 max-md:hidden">
          <Legend />
        </div>
      </aside>


      <div className="absolute bottom-0 right-0 z-[1100] flex items-end md:hidden" style={legendOpen ? { left: 0 } : undefined}>
        {legendOpen && (
          <div ref={legendRef} className="min-w-0 flex-1 border-t border-pine-700 bg-pine-950/95 px-2.5 py-1.5 backdrop-blur [&_.text-xs]:text-[10px] [&_.space-y-1\.5>*+*]:mt-0.5">
            <Legend />
          </div>
        )}
        <button onClick={toggleLegend} aria-expanded={legendOpen} aria-label={legendOpen ? 'Hide legend' : 'Show legend'} className={`flex shrink-0 items-center gap-0.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-cream-dim ${legendOpen ? 'self-stretch border-l border-t border-pine-700 bg-pine-950/95' : 'rounded-tl bg-pine-950/90 backdrop-blur'}`}>
          {legendOpen ? <ChevronRight size={12} /> : <><ChevronLeft size={12} /> Legend</>}
        </button>
      </div>

      {showAbout && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-pine-950/80 p-4" onClick={() => setShowAbout(false)}>
          <div className="max-h-full max-w-lg overflow-y-auto rounded-md border border-pine-700 bg-pine-900 p-5 text-sm leading-relaxed" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase">Read before you strike a match</h2>
              <button onClick={() => setShowAbout(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-cream-dim">
              <li><b className="text-cream">Restriction stages are hand-verified, not live.</b> Agencies publish orders as PDFs, not APIs. Each unit shows its source order and the date it was checked. Orders change with little notice — confirm with the ranger district the day you leave.</li>
              <li><b className="text-cream">Boundaries and campground records</b> come from USFS, BLM and NPS map services, refreshed monthly. BLM field-office <i>jurisdictions</i> cover whole regions including private land, so they're not drawn — they only appear as a step when you click through the layers at a spot. Turn on "BLM land ownership" to see actual BLM parcels.</li>
              <li><b className="text-cream">Click the same spot again</b> to step through everything stacked there — wilderness, then forest or park, then BLM field office — and once more to clear. Esc clears too.</li>
              <li><b className="text-cream">Green wilderness fills</b> mark wildernesses the enclosing order explicitly exempts from the backcountry-fire ban (still need a CA Campfire Permit). Dotted dark fills are wildernesses with no exemption.</li>
              <li><b className="text-cream">Red Flag Warnings, active fires and perimeters</b> refresh hourly from NWS and NIFC; everything else once a day.</li>
              <li><b className="text-cream">A California Campfire Permit is always required</b> for any fire or stove outside a developed campground. It's free from CAL FIRE: <a href={CAMPFIRE_PERMIT_URL} target="_blank" rel="noreferrer" className="text-signgold underline underline-offset-2">get a Campfire Permit</a>.</li>
              <li><b className="text-cream">Stage 1</b> = wood/charcoal only in agency rings at developed sites. <b className="text-cream">Stage 2</b> = no wood/charcoal fires at all; pressurized gas stoves with a shut-off valve usually OK.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
