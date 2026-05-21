import GlassCard from '../shared/GlassCard.jsx'
import { fmtDate, severityColor } from '../../utils/format.js'

export default function ComplaintHistory({ complaints = [], support = [] }) {
  const items = [
    ...complaints.map(c => ({
      kind: 'complaint',
      date: c.complaint_date,
      label: c.complaint_category,
      severity: c.severity,
      status: c.status,
      note: c.complaint_description?.slice(0, 80)
    })),
    ...support.map(s => ({
      kind: 'support',
      date: s.interaction_datetime,
      label: s.reason_category,
      severity: s.priority,
      status: s.resolution_status,
      note: `${s.channel} · ${s.issue_type}`
    }))
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Complaints & Support
      </h3>
      {items.length === 0 ? (
        <div className="text-sm text-text-muted">No recent interactions.</div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 8).map((it, i) => (
            <div key={i} className="flex gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: severityColor(it.severity) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-medium truncate">
                    <span className="text-xs uppercase text-text-muted mr-2">{it.kind}</span>
                    {it.label}
                  </div>
                  <div className="text-xs text-text-muted shrink-0">{fmtDate(it.date)}</div>
                </div>
                {it.note && <div className="text-xs text-text-muted mt-1">{it.note}</div>}
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted">
                    {it.status}
                  </span>
                  {it.severity && (
                    <span className="text-[10px] px-2 py-0.5 rounded border" style={{
                      borderColor: severityColor(it.severity),
                      color: severityColor(it.severity)
                    }}>
                      {it.severity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
