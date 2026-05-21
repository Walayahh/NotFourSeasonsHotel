import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function MultiSelectDropdown({ label, options, value, onChange, icon }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // coords + positioned together prevent first-click flicker: panel renders
  // invisible (visibility:hidden) until useLayoutEffect measures it and sets
  // positioned=true, then it becomes visible already at the correct spot.
  const [coords, setCoords] = useState({ left: 0, top: 0, width: 240 })
  const [positioned, setPositioned] = useState(false)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const v = value || []

  const computePosition = () => {
    const btn = buttonRef.current
    const panel = panelRef.current
    if (!btn || !panel) return
    const rect = btn.getBoundingClientRect()
    const panelH = panel.offsetHeight || 320
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < panelH + 16 && rect.top > panelH + 16

    setCoords({
      left: rect.left,
      top: openUp ? rect.top - panelH - 6 : rect.bottom + 6,
      width: Math.max(rect.width, 240),
    })
  }

  // Synchronous pre-paint measurement: by the time the browser draws, the
  // panel is already at the right coordinates and visibility:visible.
  useLayoutEffect(() => {
    if (!open) {
      setPositioned(false)
      return
    }
    computePosition()
    setPositioned(true)
  }, [open])

  // Keep glued to button on scroll/resize while open.
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
      ) {
        setOpen(false); setQuery('')
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (opt) => {
    const set = new Set(v)
    if (set.has(opt)) set.delete(opt); else set.add(opt)
    onChange([...set])
  }

  const filtered = (options || []).filter(o =>
    !query || o.toLowerCase().includes(query.toLowerCase())
  )

  const summary = v.length === 0
    ? 'Any'
    : v.length === 1
      ? v[0]
      : `${v.length} selected`

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
      <div className="px-3 py-2.5 border-b border-white/10 bg-gradient-to-r from-brand-purple/15 to-transparent">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">
            {label}
          </span>
          <span className="text-[10px] text-text-muted">
            {v.length}/{options?.length || 0}
          </span>
        </div>
        {(options?.length || 0) > 6 && (
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter…"
            className="w-full bg-white/[0.06] border border-white/10 rounded-md px-2 py-1 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-brand-purple/60"
          />
        )}
      </div>

      <div className="max-h-64 overflow-y-auto p-1.5">
        {filtered.length === 0 && (
          <div className="text-[11px] text-text-muted px-2 py-3 text-center">No matches</div>
        )}
        {filtered.map((opt) => {
          const active = v.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors duration-100 ${
                active ? 'bg-brand-purple/25 text-white' : 'text-text-primary hover:bg-white/[0.08]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 transition-all ${
                  active
                    ? 'bg-brand-purple border-brand-purple text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                    : 'border-white/25 bg-white/[0.03]'
                }`}
              >
                {active && '✓'}
              </span>
              <span className="truncate flex-1">{opt}</span>
            </button>
          )
        })}
      </div>

      {v.length > 0 && (
        <div className="px-3 py-2 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <span className="text-[10px] text-text-muted">{v.length} selected</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange([]) }}
            className="text-[10px] font-semibold text-brand-purple hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-150 ${
          v.length > 0
            ? 'bg-brand-purple/15 border-brand-purple/50 text-white shadow-[0_2px_8px_rgba(139,92,246,0.15)]'
            : 'bg-white/[0.04] border-white/10 text-text-muted hover:text-white hover:border-white/30 hover:bg-white/[0.06]'
        }`}
      >
        <div className="flex flex-col items-start min-w-0 flex-1 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted leading-none mb-0.5 flex items-center gap-1">
            {icon && <span>{icon}</span>}
            <span>{label}</span>
            {v.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-brand-purple text-white">
                {v.length}
              </span>
            )}
          </span>
          <span className="truncate text-xs font-medium w-full">{summary}</span>
        </div>
        <span className={`text-brand-purple transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {panel && createPortal(panel, document.body)}
    </div>
  )
}
