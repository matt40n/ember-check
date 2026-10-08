export function Toggle({ label, on, onChange, hint, disabled = false }: { label: string; on: boolean; onChange: (v: boolean) => void; hint?: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-3 py-1 text-sm ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <span>
        {label}
        {hint && <span className="ml-1.5 text-xs text-cream-dim">{hint}</span>}
      </span>
      <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-5 w-9 rounded-full bg-pine-600 transition peer-checked:bg-signgold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-signgold after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-cream after:transition peer-checked:after:translate-x-4 peer-checked:after:bg-pine-900" />
    </label>
  )
}
