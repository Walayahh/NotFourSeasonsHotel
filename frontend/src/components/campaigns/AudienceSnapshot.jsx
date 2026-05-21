import { fmtJOD } from '../../utils/format.js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const SEG_COLORS = {
  'VIP': '#8B5CF6',
  'High Value': '#3B82F6',
  'Mid Value': '#22C55E',
  'Low Value': '#94A3B8'
}

export default function AudienceSnapshot({ preview }) {
  if (!preview) {
    return (
      <div className="glass p-6 text-center text-sm text-text-muted">
        Adjust filters to preview the audience.
      </div>
    )
  }
  const segData = (preview.value_segment_distribution || []).map(d => ({
    name: d.k || 'Unknown', value: d.n, color: SEG_COLORS[d.k] || '#64748B'
  }))

  return (
    <div className="glass p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Audience snapshot
          </div>
          <div className="text-3xl font-bold mt-1">{preview.size.toLocaleString()}</div>
          <div className="text-xs text-text-muted">customers · {fmtJOD(preview.total_arpu_jod)} monthly ARPU</div>
        </div>
        <div style={{ width: 100, height: 100 }}>
          {segData.length > 0 && (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={segData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={48}>
                  {segData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#15171f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Top risk reasons
          </div>
          <ul className="space-y-1 text-xs">
            {(preview.risk_reason_distribution || []).map(r => (
              <li key={r.k} className="flex justify-between gap-2">
                <span className="text-text-muted truncate">{r.k || 'Unknown'}</span>
                <span className="font-mono">{r.n}</span>
              </li>
            ))}
            {!preview.risk_reason_distribution?.length && (
              <li className="text-text-muted">No data</li>
            )}
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Geography
          </div>
          <ul className="space-y-1 text-xs">
            {(preview.governorate_distribution || []).map(r => (
              <li key={r.k} className="flex justify-between gap-2">
                <span className="text-text-muted">{r.k}</span>
                <span className="font-mono">{r.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
          Sample customers
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(preview.sample_customers || []).slice(0, 6).map(c => (
            <span key={c.customer_id} className="px-2 py-0.5 text-[11px] rounded-full bg-white/[0.05] border border-white/10 text-text-muted">
              {c.full_name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
