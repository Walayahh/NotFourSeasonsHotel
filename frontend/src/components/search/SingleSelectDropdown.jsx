import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Single-select dropdown that visually matches MultiSelectDropdown.
 * `options` may be:
 *   - array of strings/numbers  (e.g. [25, 50, 100])
 *   - array of { key, label }   (e.g. [{ key: 'churn_desc', label: 'Churn (high → low)' }])
 */
export default function SingleSelectDropdown({ value, options, onChange, prefix, minWidth = 180 }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ left: 0, top: 0, width: minWidth })
  const [positioned, setPositioned] = useState(false)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)

  const normalized = (options || []).map(o =>
    typeof o === 'object' ? o : { key: o, label: String(o) }
  )
  const current = normalized.find(o => o.key === value) || normalized[0]

  const computePosition = () => {
    const btn = buttonRef.current
    const panel = panelRef.current
    if (!btn || !panel) return
    const rect = btn.getBoundingClientRect()
    const panelH = panel.offsetHeight || 280
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < panelH + 16 && rect.top > panelH + 16
    setCoords({
      left: rect.left,
      top: openUp ? rect.top - panelH - 6 : rect.bottom + 6,
      width: Math.max(rect.width, minWidth),
    })
  }

  useLayoutEffect(() => {
    if (!open) { setPositioned(false); return }
    computePosition()
    setPositioned(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => computePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (k) => {
    onChange(k)
    setOpen(false)
  }

  const panel = open && (
    <div
      ref={panelRef}
      className="dropdown-panel rounded-xl overflow-hidden"
      style={{
        position: 'fixed',
        left: coords.left,
        top: coords.top,
        width: coords.width,
        zIndex: 9999,
        background: '#11141d',
        border: '1px solid rgba(139, 92, 246, 0.45)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 28px rgba(139, 92, 246, 0.2)',
        visibility: positioned ? 'visible' : 'hidden',
        opacity: positioned ? 1 : 0,
        animation: positioned ? 'dropdown-in 0.14s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
      }}
    >
      <div className="max-h-72 overflow-y-auto p-1.5">
        {normalized.map((o) => {
          const active = o.key === value
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => pick(o.key)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-left transition-colors duration-100 ${
                active
                  ? 'bg-brand-purple/25 text-white font-semibold'
                  : 'text-text-primary hover:bg-white/[0.08]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  active
                    ? 'bg-brand-purple border-brand-purple shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                    : 'border-white/25 bg-white/[0.03]'
                }`}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="truncate flex-1">{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/30 text-xs text-white transition-all duration-150"
      >
        <span className="truncate">
          {prefix && <span className="text-text-muted mr-1">{prefix}</span>}
          {current?.label}
        </span>
        <span className={`text-brand-purple transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {panel && createPortal(panel, document.body)}
    </div>
  )
}
