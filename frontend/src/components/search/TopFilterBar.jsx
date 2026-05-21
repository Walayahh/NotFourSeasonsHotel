import MultiSelectDropdown from './MultiSelectDropdown.jsx'
import DualRangeSlider from './DualRangeSlider.jsx'

function FilterGroup({ title, accent, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: accent, boxShadow: `0 0 6px ${accent}aa` }}
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted whitespace-nowrap">
          {title}
        </span>
        <span
          className="flex-1 h-px"
          style={{ background: `linear-gradient(to right, ${accent}33, transparent)` }}
        />
      </div>
      {children}
    </div>
  )
}

export default function TopFilterBar({ facets, filters, setFilters }) {
  const set = (key, value) => setFilters((p) => ({ ...p, [key]: value }))

  if (!facets) {
    return <div className="glass p-5 text-sm text-text-muted">Loading filters…</div>
  }

  const arpu = facets.ranges?.arpu || { min: 0, max: 300 }

  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">⌕</span>
          <input
            type="text"
            value={filters.text || ''}
            onChange={(e) => set('text', e.target.value)}
            placeholder="Search by name, phone, email, or customer ID…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 focus:bg-white/[0.06] transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:text-white">
          <input
            type="checkbox"
            checked={!!filters.has_open_complaints}
            onChange={(e) => set('has_open_complaints', e.target.checked)}
            className="accent-brand-purple"
          />
          Has open complaints
        </label>
      </div>

      <div className="space-y-2.5">
        <FilterGroup title="Risk & value" accent="#EF4444">
          <div className="grid grid-cols-4 gap-2">
            <MultiSelectDropdown
              label="Risk level"
              options={facets.risk_levels}
              value={filters.risk_levels}
              onChange={(v) => set('risk_levels', v)}
            />
            <MultiSelectDropdown
              label="Value segment"
              options={facets.value_segments}
              value={filters.value_segments}
              onChange={(v) => set('value_segments', v)}
            />
            <MultiSelectDropdown
              label="Risk reason"
              options={facets.main_risk_reasons}
              value={filters.main_risk_reasons}
              onChange={(v) => set('main_risk_reasons', v)}
            />
            <MultiSelectDropdown
              label="Governorate"
              options={facets.governorates}
              value={filters.governorates}
              onChange={(v) => set('governorates', v)}
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Demographics" accent="#8B5CF6">
          <div className="grid grid-cols-5 gap-2">
            <MultiSelectDropdown
              label="Customer segment"
              options={facets.customer_segments}
              value={filters.customer_segments}
              onChange={(v) => set('customer_segments', v)}
            />
            <MultiSelectDropdown
              label="Customer type"
              options={facets.customer_types}
              value={filters.customer_types}
              onChange={(v) => set('customer_types', v)}
            />
            <MultiSelectDropdown
              label="Age group"
              options={facets.age_groups}
              value={filters.age_groups}
              onChange={(v) => set('age_groups', v)}
            />
            <MultiSelectDropdown
              label="Gender"
              options={facets.genders}
              value={filters.genders}
              onChange={(v) => set('genders', v)}
            />
            <MultiSelectDropdown
              label="Language"
              options={facets.languages}
              value={filters.languages}
              onChange={(v) => set('languages', v)}
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Plan & status" accent="#3B82F6">
          <div className="grid grid-cols-3 gap-2">
            <MultiSelectDropdown
              label="Plan category"
              options={facets.plan_categories}
              value={filters.plan_categories}
              onChange={(v) => set('plan_categories', v)}
            />
            <MultiSelectDropdown
              label="Plan technology"
              options={facets.plan_technologies}
              value={filters.plan_technologies}
              onChange={(v) => set('plan_technologies', v)}
            />
            <MultiSelectDropdown
              label="Account status"
              options={facets.statuses}
              value={filters.statuses}
              onChange={(v) => set('statuses', v)}
            />
          </div>
        </FilterGroup>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <DualRangeSlider
          label="Churn score"
          icon="◐"
          min={0} max={1} step={0.05}
          value={[filters.churn_min ?? 0, filters.churn_max ?? 1]}
          onChange={([lo, hi]) => setFilters((p) => ({ ...p, churn_min: lo, churn_max: hi }))}
          format={(v) => Number(v).toFixed(2)}
        />
        <DualRangeSlider
          label="ARPU (JOD)"
          icon="◆"
          min={arpu.min || 0} max={arpu.max || 300} step={5}
          value={[filters.arpu_min ?? (arpu.min || 0), filters.arpu_max ?? (arpu.max || 300)]}
          onChange={([lo, hi]) => setFilters((p) => ({ ...p, arpu_min: lo, arpu_max: hi }))}
        />
        <div className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 hover:border-brand-purple/40 transition-colors">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
            <span>📅</span> Signup from
          </div>
          <input
            type="date"
            value={filters.signup_after || ''}
            onChange={(e) => set('signup_after', e.target.value || null)}
            className="w-full bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 hover:border-brand-purple/40 transition-colors">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
            <span>📅</span> Signup to
          </div>
          <input
            type="date"
            value={filters.signup_before || ''}
            onChange={(e) => set('signup_before', e.target.value || null)}
            className="w-full bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>
    </div>
  )
}
