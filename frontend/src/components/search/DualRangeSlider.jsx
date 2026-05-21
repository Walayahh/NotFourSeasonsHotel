import { useMemo } from 'react'

export default function DualRangeSlider({ label, icon, min, max, step = 1, value, onChange, format = (v) => v }) {
  const [lo, hi] = value

  const { leftPct, widthPct } = useMemo(() => {
    const span = max - min || 1
    const l = Math.max(0, Math.min(100, ((lo - min) / span) * 100))
    const r = Math.max(0, Math.min(100, ((hi - min) / span) * 100))
    return { leftPct: l, widthPct: Math.max(0, r - l) }
  }, [lo, hi, min, max])

  const updateLo = (next) => {
    const clamped = Math.min(Number(next), hi - step)
    onChange([clamped, hi])
  }
  const updateHi = (next) => {
    const clamped = Math.max(Number(next), lo + step)
    onChange([lo, clamped])
  }

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 hover:border-brand-purple/40 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
          {icon && <span>{icon}</span>}<span>{label}</span>
        </div>
        <div className="text-xs font-mono text-white tabular-nums">
          {format(lo)} <span className="text-text-muted mx-1">–</span> {format(hi)}
        </div>
      </div>
      <div className="dual-range">
        <div className="dr-track" />
        <div
          className="dr-fill"
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, top: '50%', transform: 'translateY(-50%)', height: '6px' }}
        />
        <input
          type="range" min={min} max={max} step={step} value={lo}
          onChange={(e) => updateLo(e.target.value)}
          aria-label={`${label} minimum`}
          style={{ zIndex: 2 }}
        />
        <input
          type="range" min={min} max={max} step={step} value={hi}
          onChange={(e) => updateHi(e.target.value)}
          aria-label={`${label} maximum`}
          style={{ zIndex: 3 }}
        />
      </div>
    </div>
  )
}
