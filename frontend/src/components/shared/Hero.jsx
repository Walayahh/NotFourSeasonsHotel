export default function Hero({ kicker, title, description, status, action, accent = 'purple' }) {
  const accentMap = {
    purple: 'from-white via-white to-brand-purple',
    blue:   'from-white via-white to-brand-blue',
    green:  'from-white via-white to-risk-low'
  }
  const grad = accentMap[accent] || accentMap.purple

  return (
    <div className="hero-card glass p-4 md:p-6 mb-6 relative">
      <div className="relative z-10 flex items-end justify-between gap-5 flex-wrap">
        <div className="flex-1 min-w-0">
          {kicker && (
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-purple mb-1.5">
              {kicker}
            </div>
          )}
          <h1 className={`text-3xl md:text-4xl font-bold leading-tight bg-gradient-to-r ${grad} bg-clip-text text-transparent`}>
            {title}
          </h1>
          {description && (
            <p className="text-sm text-text-muted mt-2 max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {action}
          {status && <div className="status-pill">{status}</div>}
        </div>
      </div>
    </div>
  )
}
