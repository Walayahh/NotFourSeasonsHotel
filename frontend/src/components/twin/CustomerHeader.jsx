import GlassCard from '../shared/GlassCard.jsx'
import RiskBadge from '../shared/RiskBadge.jsx'
import HealthScoreGauge from './HealthScoreGauge.jsx'
import { fmtJOD, initials, fmtDate } from '../../utils/format.js'

export default function CustomerHeader({ profile, valueSegment, churn, subscriptions, healthScore }) {
  const segment = profile?.customer_segment || 'Consumer'
  const sub = (subscriptions || [])[0]
  const valueLabel = valueSegment?.value_segment

  return (
    <GlassCard className="mb-6">
      <div className="flex items-center gap-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
        >
          {initials(profile?.full_name)}
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
            {churn?.risk_level && <RiskBadge level={churn.risk_level} size="lg" />}
            {valueLabel && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold border border-brand-purple/40 bg-brand-purple/10 text-brand-purple">
                {valueLabel}
              </span>
            )}
          </div>
          <div className="text-sm text-text-muted flex flex-wrap gap-x-4 gap-y-1">
            <span>{profile?.age_group}</span>
            <span>{profile?.city}, {profile?.governorate}</span>
            <span>{segment}</span>
            <span>Language: {profile?.preferred_language}</span>
            <span>Signed up: {fmtDate(profile?.signup_date)}</span>
          </div>
          {sub && (
            <div className="text-sm text-text-muted mt-2">
              <span className="text-text-primary font-medium">{sub.plan_name}</span>
              <span className="mx-2">·</span>
              <span>{fmtJOD(sub.monthly_fee_jod)}/mo</span>
              <span className="mx-2">·</span>
              <span>Contract ends: {fmtDate(sub.contract_end_date)}</span>
            </div>
          )}
        </div>

        <HealthScoreGauge score={healthScore} />
      </div>
    </GlassCard>
  )
}
