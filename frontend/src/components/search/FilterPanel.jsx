import { useState } from 'react'

function ChipGroup({ label, options, value, onChange, max }) {
  if (!options?.length) return null
  const shown = max ? options.slice(0, max) : options
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((opt) => {
          const active = value?.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const set = new Set(value || [])
                if (set.has(opt)) set.delete(opt); else set.add(opt)
                onChange([...set])
              }}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                active
                  ? 'bg-brand-purple/20 border-brand-purple/50 text-white'
                  : 'bg-white/[0.03] border-white/10 text-text-muted hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/5 py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-white pb-2"
      >
        <span>{title}</span>
        <span className="text-brand-purple">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  )
}

function RangeRow({ label, min, max, step, value, onChange, format = (v) => v }) {
  const [lo, hi] = value
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono text-white">
          {format(lo)} – {format(hi)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          className="flex-1 accent-brand-purple"
        />
        <input
          type="range" min={min} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
          className="flex-1 accent-brand-purple"
        />
      </div>
    </div>
  )
}

export default function FilterPanel({ facets, filters, setFilters, onReset }) {
  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  if (!facets) {
    return (
      <div className="glass p-5 text-sm text-text-muted">Loading filters…</div>
    )
  }

  const arpuRange = facets.ranges?.arpu || { min: 0, max: 300 }

  return (
    <div className="glass p-5 xl:sticky xl:top-4 max-h-[520px] xl:max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold">Filters</div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-text-muted hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={filters.text || ''}
          onChange={(e) => set('text', e.target.value)}
          placeholder="Search name, phone, email, ID…"
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50"
        />
      </div>

      <Section title="Risk & value">
        <ChipGroup
          label="Risk level"
          options={facets.risk_levels}
          value={filters.risk_levels}
          onChange={(v) => set('risk_levels', v)}
        />
        <ChipGroup
          label="Value segment"
          options={facets.value_segments}
          value={filters.value_segments}
          onChange={(v) => set('value_segments', v)}
        />
        <RangeRow
          label="Churn score"
          min={0} max={1} step={0.05}
          value={[filters.churn_min ?? 0, filters.churn_max ?? 1]}
          onChange={([lo, hi]) => setFilters((p) => ({ ...p, churn_min: lo, churn_max: hi }))}
          format={(v) => Number(v).toFixed(2)}
        />
        <RangeRow
          label="ARPU (JOD)"
          min={arpuRange.min || 0} max={arpuRange.max || 300} step={5}
          value={[filters.arpu_min ?? (arpuRange.min || 0), filters.arpu_max ?? (arpuRange.max || 300)]}
          onChange={([lo, hi]) => setFilters((p) => ({ ...p, arpu_min: lo, arpu_max: hi }))}
        />
        <ChipGroup
          label="Main risk reason"
          options={facets.main_risk_reasons}
          value={filters.main_risk_reasons}
          onChange={(v) => set('main_risk_reasons', v)}
        />
      </Section>

      <Section title="Geography">
        <ChipGroup
          label="Governorate"
          options={facets.governorates}
          value={filters.governorates}
          onChange={(v) => set('governorates', v)}
        />
      </Section>

      <Section title="Demographics" defaultOpen={false}>
        <ChipGroup
          label="Customer segment"
          options={facets.customer_segments}
          value={filters.customer_segments}
          onChange={(v) => set('customer_segments', v)}
        />
        <ChipGroup
          label="Customer type"
          options={facets.customer_types}
          value={filters.customer_types}
          onChange={(v) => set('customer_types', v)}
        />
        <ChipGroup
          label="Age group"
          options={facets.age_groups}
          value={filters.age_groups}
          onChange={(v) => set('age_groups', v)}
        />
        <ChipGroup
          label="Gender"
          options={facets.genders}
          value={filters.genders}
          onChange={(v) => set('genders', v)}
        />
        <ChipGroup
          label="Language"
          options={facets.languages}
          value={filters.languages}
          onChange={(v) => set('languages', v)}
        />
        <ChipGroup
          label="Status"
          options={facets.statuses}
          value={filters.statuses}
          onChange={(v) => set('statuses', v)}
        />
      </Section>

      <Section title="Plan & service" defaultOpen={false}>
        <ChipGroup
          label="Plan category"
          options={facets.plan_categories}
          value={filters.plan_categories}
          onChange={(v) => set('plan_categories', v)}
        />
        <ChipGroup
          label="Technology"
          options={facets.plan_technologies}
          value={filters.plan_technologies}
          onChange={(v) => set('plan_technologies', v)}
        />
      </Section>

      <Section title="Behavior" defaultOpen={false}>
        <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={!!filters.has_open_complaints}
            onChange={(e) => set('has_open_complaints', e.target.checked)}
            className="accent-brand-purple"
          />
          Has open complaints
        </label>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
          Signup date
        </div>
        <div className="flex gap-2">
          <input
            type="date" value={filters.signup_after || ''}
            onChange={(e) => set('signup_after', e.target.value || null)}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs"
          />
          <input
            type="date" value={filters.signup_before || ''}
            onChange={(e) => set('signup_before', e.target.value || null)}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs"
          />
        </div>
      </Section>
    </div>
  )
}
