import { Flame } from 'lucide-react'
import { STAGE_COLOR, STAGE_LABEL } from '../lib/stage'
import type { Stage } from '../types'

const ORDER: Stage[] = ['none', 'stage1', 'stage2', 'full_ban', 'unknown']
const Sq = ({ style, className = '' }: { style?: React.CSSProperties; className?: string }) => (
  <span className={`inline-block h-3 w-3 ${className}`} style={style} />
)
const Dot = ({ style, className = '' }: { style?: React.CSSProperties; className?: string }) => (
  <span className={`inline-block h-3 w-3 rounded-full ${className}`} style={style} />
)

/** One-line strip for phones: every swatch in a single scrollable row. */
export function LegendStrip() {
  return (
    <div className="flex items-center gap-x-3 overflow-x-auto whitespace-nowrap px-2 text-[10px] leading-none text-cream-dim [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ORDER.map((s) => (
        <span key={s} className="inline-flex shrink-0 items-center gap-1"><Sq className="!h-2.5 !w-2.5" style={{ background: STAGE_COLOR[s], opacity: 0.85 }} />{STAGE_LABEL[s]}</span>
      ))}
      <span className="inline-flex shrink-0 items-center gap-1"><Sq className="!h-2.5 !w-2.5 border-2 border-[#9BE7A0] bg-ok/50" />Wilderness exempt</span>
      <span className="inline-flex shrink-0 items-center gap-1"><Sq className="!h-2.5 !w-2.5 border border-dotted border-cream bg-pine-950" />Wilderness, no exemption</span>
      <span className="inline-flex shrink-0 items-center gap-1"><Sq className="!h-2.5 !w-2.5 border border-ember bg-ember/30" />Red Flag</span>
      <span className="ml-1 inline-flex shrink-0 items-center gap-1 border-l border-pine-600 pl-3"><Dot className="!h-2.5 !w-2.5 bg-signgold" />Campground</span>
      <span className="inline-flex shrink-0 items-center gap-1"><Dot className="!h-2.5 !w-2.5 bg-[#8FB8DE]" />Dispersed</span>
      <span className="inline-flex shrink-0 items-center gap-1"><Dot className="!h-2.5 !w-2.5 border-2 border-ok bg-pine-700" />fire OK</span>
      <span className="inline-flex shrink-0 items-center gap-1"><Dot className="!h-2.5 !w-2.5 border-2 border-amber bg-pine-700" />permit</span>
      <span className="inline-flex shrink-0 items-center gap-1"><Dot className="!h-2.5 !w-2.5 border-2 border-[#C9B458] bg-pine-700" />only if listed</span>
      <span className="inline-flex shrink-0 items-center gap-1"><Dot className="!h-2.5 !w-2.5 border-2 border-ember bg-pine-700" />no fires</span>
      <span className="inline-flex shrink-0 items-center gap-1 pr-2"><Flame size={11} className="fill-ember text-pine-950" strokeWidth={1.5} />Active fire</span>
    </div>
  )
}

export function Legend() {
  return (
    <div className="space-y-1.5 text-xs text-cream-dim">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-cream-dim/70">Areas</span>
        {ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <Sq style={{ background: STAGE_COLOR[s], opacity: 0.85 }} />
            {STAGE_LABEL[s]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5"><Sq className="border-2 border-[#9BE7A0] bg-ok/50" />Wilderness, fire exemption</span>
        <span className="inline-flex items-center gap-1.5"><Sq className="border border-dotted border-cream bg-pine-950" />Wilderness, no exemption</span>
        <span className="inline-flex items-center gap-1.5"><Sq className="border border-ember bg-ember/30" />Red Flag zone</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-cream-dim/70">Pins</span>
        <span className="inline-flex items-center gap-1.5"><Dot className="bg-signgold" />Campground</span>
        <span className="inline-flex items-center gap-1.5"><Dot className="bg-[#8FB8DE]" />Dispersed site</span>
        <span className="inline-flex items-center gap-1.5"><Dot className="border-2 border-ok bg-pine-700" />ring = fire OK</span>
        <span className="inline-flex items-center gap-1.5"><Dot className="border-2 border-amber bg-pine-700" />permit</span>
        <span className="inline-flex items-center gap-1.5"><Dot className="border-2 border-[#C9B458] bg-pine-700" />only if listed</span>
        <span className="inline-flex items-center gap-1.5"><Dot className="border-2 border-ember bg-pine-700" />no fires</span>
        <span className="inline-flex items-center gap-1.5"><Flame size={13} className="fill-ember text-pine-950" strokeWidth={1.5} />Active fire</span>
      </div>
    </div>
  )
}
