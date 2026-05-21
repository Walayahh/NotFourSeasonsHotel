import GlassCard from '../shared/GlassCard.jsx'
import { fmtDate } from '../../utils/format.js'

export default function CampaignHistory({ history = [] }) {
  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Campaign Response History
      </h3>
      {history.length === 0 ? (
        <div className="text-sm text-text-muted">No campaign history.</div>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.response_id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{h.campaign_name}</div>
                <div className="text-xs text-text-muted">
                  {h.campaign_type} · {h.channel} · {fmtDate(h.sent_date)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {h.response_status}
                </span>
                {h.converted_flag === 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-risk-low/15 border border-risk-low/40 text-green-300 font-semibold">
                    converted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
