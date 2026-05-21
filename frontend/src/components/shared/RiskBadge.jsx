const styles = {
  High:   { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#FCA5A5', pulse: true },
  Medium: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', color: '#FDE68A' },
  Low:    { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', color: '#86EFAC' }
}

export default function RiskBadge({ level, size = 'sm' }) {
  const s = styles[level] || { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)', color: '#94A3B8' }
  const sizeCls = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeCls} ${s.pulse ? 'risk-pulse-high' : ''}`}
      style={{ background: s.bg, borderColor: s.border, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {level || 'Unknown'}
    </span>
  )
}
