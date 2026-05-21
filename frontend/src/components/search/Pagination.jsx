import { motion } from 'framer-motion'

function pageList(current, total) {
  // Smart truncation: always show first + last + a window of ±1 around current.
  // e.g. for current=6, total=20 → [1, '…', 5, 6, 7, '…', 20]
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const items = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...items].filter(n => n >= 1 && n <= total).sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i])
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push('…')
  }
  return out
}

export default function Pagination({ total, limit, offset, onChange }) {
  if (total <= 0) return null

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const current = Math.floor(offset / limit) + 1
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  const go = (page) => {
    const clamped = Math.max(1, Math.min(totalPages, page))
    onChange((clamped - 1) * limit)
  }

  const pages = pageList(current, totalPages)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass p-3 mt-3 flex items-center justify-between gap-3 flex-wrap"
    >
      <div className="text-xs text-text-muted">
        Showing <span className="text-white font-semibold">{from.toLocaleString()}</span>–
        <span className="text-white font-semibold">{to.toLocaleString()}</span>
        {' of '}
        <span className="text-white font-semibold">{total.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-1">
        <PagerBtn onClick={() => go(1)}            disabled={current === 1} title="First">«</PagerBtn>
        <PagerBtn onClick={() => go(current - 1)}  disabled={current === 1} title="Previous">‹</PagerBtn>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`g${i}`} className="px-2 text-text-muted text-xs select-none">…</span>
          ) : (
            <PagerBtn key={p} onClick={() => go(p)} active={p === current}>
              {p}
            </PagerBtn>
          )
        )}

        <PagerBtn onClick={() => go(current + 1)} disabled={current === totalPages} title="Next">›</PagerBtn>
        <PagerBtn onClick={() => go(totalPages)}  disabled={current === totalPages} title="Last">»</PagerBtn>
      </div>

      <div className="text-xs text-text-muted">
        Page <span className="text-white font-semibold">{current}</span> / {totalPages}
      </div>
    </motion.div>
  )
}

function PagerBtn({ onClick, disabled, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`min-w-[2rem] h-8 px-2 rounded-md text-xs font-semibold transition-all duration-150 ${
        active
          ? 'bg-gradient-to-br from-brand-purple to-brand-blue text-white shadow-[0_2px_10px_rgba(139,92,246,0.5)]'
          : disabled
            ? 'bg-white/[0.02] text-text-muted/40 cursor-not-allowed'
            : 'bg-white/[0.05] text-text-muted hover:bg-white/[0.10] hover:text-white border border-transparent hover:border-brand-purple/30'
      }`}
    >
      {children}
    </button>
  )
}
