import { useEffect, useMemo, useState } from 'react'
import { Flame, Info, X } from 'lucide-react'
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
import { CampgroundLayer } from './components/CampgroundLayer'
import { useRedFlag } from './hooks/useRedFlag'
import { useLiveStatus } from './hooks/useLiveStatus'
import { useForestBoundaries } from './api/usfs'
import { useBlmFieldOffices, useNpsUnits, useRangerDistricts, useRecSites, useWilderness } from './api/boundaries'
import { JURISDICTIONS as RAW, DATA_VERIFIED_ON } from './data/restrictions'
import { applyFreshness } from './lib/freshness'

/** Entries older than 14 days or past expiry are shown as Unverified rather than trusted. */
const JURISDICTIONS = applyFreshness(RAW)
import { resolveProbe, type ProbeResult } from './lib/probe'
import type { Agency, Jurisdiction } from './types'

const AGENCIES: Agency[] = ['USFS', 'BLM', 'NPS', 'CAL FIRE', 'State Parks']
const EMPTY: ProbeResult = { jurisdiction: null, unitName: null, district: null, wilderness: null, wildernessExempt: false }

export default function App() {
  const [probe, setProbe] = useState<{ lat: number; lng: number } | null>(null)
  const [result, setResult] = useState<ProbeResult>(EMPTY)
  const [agencies, setAgencies] = useState<Set<Agency>>(new Set(AGENCIES))
  const [layers, setLayers] = useState({
    fills: true, wilderness: true, districts: true, campgrounds: true,
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

  function probeAt(lat: number, lng: number) {
    setProbe({ lat, lng })
    setResult(resolveProbe(lat, lng, JURISDICTIONS, boundaries))
    setDrawer(true)
  }
  function pickFromList(j: Jurisdiction) {
    setProbe({ lat: j.lat, lng: j.lng })
    setResult({ ...resolveProbe(j.lat, j.lng, JURISDICTIONS, boundaries), jurisdiction: j })
    setDrawer(true)
  }
  const pickFromMap = (j: Jurisdiction, lat: number, lng: number) => {
    setProbe({ lat, lng })
    setResult({ ...resolveProbe(lat, lng, JURISDICTIONS, boundaries), jurisdiction: j })
    setDrawer(true)
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView onClick={probeAt} probe={probe}>
        <LiveLayers layers={layers} onProbe={probeAt} />
        {layers.fills && (
          <>
            <JurisdictionFills fc={blm.data} source="blm" nameField="ADMU_NAME" all={JURISDICTIONS} fillOpacity={0.03} selectedId={selected?.id ?? null} onPick={pickFromMap} onMiss={probeAt} />
            <JurisdictionFills fc={forests.data} source="usfs" nameField="forestname" all={JURISDICTIONS} fillOpacity={0.32} selectedId={selected?.id ?? null} onPick={pickFromMap} onMiss={probeAt} />
            <JurisdictionFills fc={nps.data} source="nps" nameField="UNIT_NAME" all={JURISDICTIONS} fillOpacity={0.32} selectedId={selected?.id ?? null} onPick={pickFromMap} onMiss={probeAt} />
          </>
        )}
        {layers.districts && <DistrictLayer fc={districts.data} />}
        {layers.wilderness && <WildernessLayer fc={wilderness.data} all={JURISDICTIONS} onClick={probeAt} />}
        {layers.campgrounds && <CampgroundLayer sites={sites.data} all={JURISDICTIONS} boundaries={boundaries} />}
      </MapView>

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-[1000] flex items-start justify-between p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded bg-pine-900/90 px-3 py-2 backdrop-blur">
          <Flame className="text-signgold" size={20} />
          <div>
            <h1 className="font-display text-xl font-extrabold uppercase leading-none tracking-wide">Ember Check</h1>
            <p className="text-[11px] text-cream-dim">
              NorCal campfire restrictions · verified {DATA_VERIFIED_ON}
              {boundariesLoading && <span className="ml-2 text-signgold">loading boundaries…</span>}
            </p>
            {live.problem && <p className="mt-0.5 text-[11px] font-semibold text-ember">{live.problem}</p>}
          </div>
        </div>
        <button onClick={() => setShowAbout(true)} className="pointer-events-auto rounded bg-pine-900/90 p-2 text-cream-dim hover:text-cream" aria-label="About and disclaimers">
          <Info size={18} />
        </button>
      </header>

      <aside
        className={`absolute z-[1000] flex flex-col bg-pine-900/95 backdrop-blur transition-transform
          md:left-3 md:top-16 md:bottom-3 md:w-[380px] md:rounded-md md:border md:border-pine-700
          max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[70vh] max-md:rounded-t-xl max-md:border-t max-md:border-pine-700
          ${drawer ? '' : 'max-md:translate-y-[calc(100%-44px)]'}`}
      >
        <button onClick={() => setDrawer((d) => !d)} className="flex items-center justify-center py-2 md:hidden" aria-label="Toggle panel">
          <span className="h-1.5 w-12 rounded-full bg-pine-600" />
        </button>
        <div className="overflow-y-auto p-3 pt-0 md:pt-3">
          <SignPanel result={result} redFlag={redFlag.active} />
          {probe && !selected && (
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
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-cream-dim">Orders in effect</h2>
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
          </section>
        </div>
        <div className="border-t border-pine-700 p-3 max-md:hidden">
          <Legend />
        </div>
      </aside>

      {!ack && (
        <div className="absolute inset-x-0 bottom-0 z-[1500] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-ember/60 bg-pine-950/95 px-4 py-2.5 text-center text-xs text-cream backdrop-blur md:bottom-3 md:left-1/2 md:right-auto md:w-auto md:-translate-x-1/2 md:rounded md:border">
          <span>Not legal advice. Orders change with little notice — <b>posted signs and the ranger district override this map.</b></span>
          <span className="flex gap-3">
            <button onClick={() => setShowAbout(true)} className="underline underline-offset-2">How to read it</button>
            <button onClick={acknowledge} className="rounded bg-signgold px-2.5 py-0.5 font-semibold text-pine-900">Got it</button>
          </span>
        </div>
      )}

      {showAbout && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-pine-950/80 p-4" onClick={() => setShowAbout(false)}>
          <div className="max-h-full max-w-lg overflow-y-auto rounded-md border border-pine-700 bg-pine-900 p-5 text-sm leading-relaxed" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase">Read before you strike a match</h2>
              <button onClick={() => setShowAbout(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-cream-dim">
              <li><b className="text-cream">Restriction stages are hand-verified, not live.</b> Agencies publish orders as PDFs, not APIs. Each unit shows its source order and the date it was checked. Orders change with little notice — confirm with the ranger district the day you leave.</li>
              <li><b className="text-cream">Boundaries and campground records</b> come from USFS, BLM and NPS map services, refreshed monthly. BLM field-office boundaries cover whole regions including private land — turn on "BLM land ownership" to see actual BLM parcels.</li>
              <li><b className="text-cream">Green wilderness fills</b> mark wildernesses the enclosing order explicitly exempts from the backcountry-fire ban (still need a CA Campfire Permit). Dotted dark fills are wildernesses with no exemption.</li>
              <li><b className="text-cream">Red Flag Warnings, active fires and perimeters</b> refresh hourly from NWS and NIFC; everything else once a day.</li>
              <li><b className="text-cream">A California Campfire Permit is always required</b> for any fire or stove outside a developed campground. It's free: permit.preventwildfireca.org.</li>
              <li><b className="text-cream">Stage 1</b> = wood/charcoal only in agency rings at developed sites. <b className="text-cream">Stage 2</b> = no wood/charcoal fires at all; pressurized gas stoves with a shut-off valve usually OK.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
