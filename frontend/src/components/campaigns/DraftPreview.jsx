import { fmtJOD } from '../../utils/format.js'

const channelIcon = { SMS: '✉', Email: '✉', 'Call Center': '☎', 'Zain App': '◈' }

function ProjectionCard({ label, value, sub, accent = '#8B5CF6' }) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: `linear-gradient(135deg, ${accent}15, transparent)`, borderColor: `${accent}30` }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

export default function DraftPreview({ result, drafting, onLaunch, onRegenerate, launching, launched }) {
  if (drafting) {
    return (
      <div className="glass p-8 text-center">
        <div className="inline-block w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-sm text-text-muted">Drafting campaign with AI…</div>
      </div>
    )
  }
  if (!result) {
    return (
      <div className="glass p-8 text-center text-sm text-text-muted">
        Choose an audience and an objective, then click <span className="text-white font-semibold">Draft with AI</span> to generate a campaign.
      </div>
    )
  }

  const d = result.draft || {}
  const p = result.projection || {}

  return (
    <div className="space-y-4 page-enter">
      <div className="glass lift p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">AI draft</span>
              {result.run_id && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted">
                  #{result.run_id}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold">{d.campaign_name || 'Untitled Campaign'}</h3>
            <div className="text-xs text-text-muted mt-1">
              {d.campaign_type} · {channelIcon[d.primary_channel] || '·'} {d.primary_channel}
              {d.secondary_channel && d.secondary_channel !== 'None' && ` + ${d.secondary_channel}`}
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-brand-purple/20 border border-brand-purple/30 text-brand-purple font-semibold shrink-0">
            DRAFT
          </span>
        </div>

        {result.creative_angle && (
          <div className="text-[11px] text-text-muted italic mb-3 px-3 py-1.5 rounded-lg bg-white/[0.03] border-l-2 border-brand-purple/40">
            ✨ Creative angle: {result.creative_angle}
          </div>
        )}

        <div className="text-sm leading-relaxed mb-3">{d.offer_description}</div>
        <div className="text-xs text-text-muted italic">{d.rationale}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
            <span>Arabic message</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06]">AR</span>
          </div>
          <div className="text-sm leading-relaxed" dir="rtl" style={{ fontFamily: 'sans-serif' }}>
            {d.message_ar || '—'}
          </div>
        </div>
        <div className="glass p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
            <span>English message</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06]">EN</span>
          </div>
          <div className="text-sm leading-relaxed">{d.message_en || '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <ProjectionCard
          label="Audience"
          value={(p.audience_size || 0).toLocaleString()}
          sub="customers"
          accent="#8B5CF6"
        />
        <ProjectionCard
          label="Expected responses"
          value={(p.expected_responses || 0).toLocaleString()}
          sub={`${d.expected_response_rate_pct || 0}% response rate`}
          accent="#3B82F6"
        />
        <ProjectionCard
          label="Expected conversions"
          value={(p.expected_conversions || 0).toLocaleString()}
          sub={`${d.expected_conversion_rate_pct || 0}% conversion`}
          accent="#22C55E"
        />
        <ProjectionCard
          label="Annual revenue retained"
          value={fmtJOD(p.expected_annual_revenue_retained_jod)}
          sub={`${fmtJOD(p.expected_monthly_revenue_retained_jod)} / mo`}
          accent="#F59E0B"
        />
      </div>

      <div className="flex justify-end gap-2">
        {!launched && onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={drafting || launching}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-brand-purple/30 disabled:opacity-50 transition-all"
          >
            ↻ Regenerate
          </button>
        )}
        {launched ? (
          <div className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-risk-low/20 border border-risk-low/40 text-risk-low">
            ✓ Launched · {launched.campaign_id} · {launched.audience_size} queued
          </div>
        ) : (
          <button
            onClick={onLaunch}
            disabled={launching}
            className="btn-gradient px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-50"
            style={{
              background: launching ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              boxShadow: launching ? 'none' : '0 4px 16px rgba(139,92,246,0.4)'
            }}
          >
            {launching ? 'Launching…' : 'Launch Campaign 🚀'}
          </button>
        )}
      </div>
    </div>
  )
}
