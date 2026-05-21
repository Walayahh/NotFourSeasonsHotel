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
      <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-6 min-w-0">
        <div
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-xl lg:text-2xl font-bold shrink-0 self-start lg:self-auto"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
        >
          {initials(profile?.full_name)}
        </div>

        <div className="w-full min-w-0 lg:flex-1">
          <div className="flex items-start sm:items-baseline gap-2 sm:gap-3 mb-1 flex-wrap">
            <h2 className="text-2xl font-bold leading-tight break-words min-w-0">{profile?.full_name}</h2>
            {churn?.risk_level && <RiskBadge level={churn.risk_level} size="lg" />}
            {valueLabel && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold border border-brand-purple/40 bg-brand-purple/10 text-brand-purple">
                {valueLabel}
              </span>
            )}
          </div>
          <div className="text-sm text-text-muted flex flex-wrap gap-x-4 gap-y-1 min-w-0">
            <span>{profile?.age_group}</span>
            <span className="break-words">{profile?.city}, {profile?.governorate}</span>
            <span>{segment}</span>
            <span>Language: {profile?.preferred_language}</span>
            <span>Signed up: {fmtDate(profile?.signup_date)}</span>
          </div>
          {sub && (
            <div className="text-sm text-text-muted mt-2 flex flex-wrap gap-x-2 gap-y-1">
              <span className="text-text-primary font-medium">{sub.plan_name}</span>
              <span>·</span>
              <span>{fmtJOD(sub.monthly_fee_jod)}/mo</span>
              <span>·</span>
              <span>Contract ends: {fmtDate(sub.contract_end_date)}</span>
            </div>
          )}
        </div>

        <div className="self-center lg:self-auto shrink-0">
          <HealthScoreGauge score={healthScore} />
        </div>
      </div>
    </GlassCard>
  )
}
