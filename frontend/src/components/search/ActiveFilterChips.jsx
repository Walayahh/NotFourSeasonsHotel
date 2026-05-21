const MULTI_KEYS = [
  ['risk_levels', 'Risk'],
  ['value_segments', 'Value'],
  ['governorates', 'Gov'],
  ['main_risk_reasons', 'Reason'],
  ['customer_segments', 'Seg'],
  ['customer_types', 'Type'],
  ['age_groups', 'Age'],
  ['genders', 'Gender'],
  ['languages', 'Lang'],
  ['statuses', 'Status'],
  ['plan_categories', 'Plan'],
  ['plan_technologies', 'Tech']
]

export default function ActiveFilterChips({ filters, setFilters, onClearAll }) {
  const chips = []

  for (const [key, prefix] of MULTI_KEYS) {
    for (const v of (filters[key] || [])) {
      chips.push({
        key: `${key}:${v}`,
        label: `${prefix}: ${v}`,
        remove: () => setFilters((p) => ({ ...p, [key]: (p[key] || []).filter(x => x !== v) }))
      })
    }
  }

  if (filters.text) chips.push({
    key: 'text', label: `Search: "${filters.text}"`,
    remove: () => setFilters((p) => ({ ...p, text: '' }))
  })
  if (filters.has_open_complaints) chips.push({
    key: 'open', label: 'Open complaints',
    remove: () => setFilters((p) => ({ ...p, has_open_complaints: false }))
  })
  if (filters.churn_min > 0 || filters.churn_max < 1) chips.push({
    key: 'churn', label: `Churn ${Number(filters.churn_min).toFixed(2)}–${Number(filters.churn_max).toFixed(2)}`,
    remove: () => setFilters((p) => ({ ...p, churn_min: 0, churn_max: 1 }))
  })
  if (filters.arpu_min != null || filters.arpu_max != null) chips.push({
    key: 'arpu', label: `ARPU ${filters.arpu_min ?? '—'}–${filters.arpu_max ?? '—'}`,
    remove: () => setFilters((p) => ({ ...p, arpu_min: null, arpu_max: null }))
  })
  if (filters.signup_after) chips.push({
    key: 'sa', label: `Signup ≥ ${filters.signup_after}`,
    remove: () => setFilters((p) => ({ ...p, signup_after: null }))
  })
  if (filters.signup_before) chips.push({
    key: 'sb', label: `Signup ≤ ${filters.signup_before}`,
    remove: () => setFilters((p) => ({ ...p, signup_before: null }))
  })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-text-muted mr-1">
        Active ({chips.length})
      </span>
      {chips.map(c => (
        <button
          key={c.key}
          onClick={c.remove}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-xs text-white hover:bg-brand-purple/25 transition-colors"
        >
          <span>{c.label}</span>
          <span className="text-text-muted group-hover:text-white">×</span>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="ml-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-text-muted hover:text-white hover:bg-white/[0.08]"
      >
        Clear all
      </button>
    </div>
  )
}
