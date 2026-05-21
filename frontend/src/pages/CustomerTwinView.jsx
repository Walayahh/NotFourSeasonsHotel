import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api.js'
import GlassCard from '../components/shared/GlassCard.jsx'
import SkeletonLoader from '../components/shared/SkeletonLoader.jsx'
import CustomerListPanel from '../components/twin/CustomerListPanel.jsx'
import CustomerHeader from '../components/twin/CustomerHeader.jsx'
import TwinSignalCards from '../components/twin/TwinSignalCards.jsx'
import UsageTimelineChart from '../components/twin/UsageTimelineChart.jsx'
import ComplaintHistory from '../components/twin/ComplaintHistory.jsx'
import SatisfactionChart from '../components/twin/SatisfactionChart.jsx'
import CampaignHistory from '../components/twin/CampaignHistory.jsx'
import AIAnalysisPanel from '../components/twin/AIAnalysisPanel.jsx'

export default function CustomerTwinView() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [err, setErr] = useState(null)

  // If no customer in URL, redirect to top-risk customer.
  useEffect(() => {
    if (!customerId) {
      api.topRiskyCustomers(1).then(r => {
        if (r.customers[0]) navigate(`/twin/${r.customers[0].customer_id}`, { replace: true })
      })
    }
  }, [customerId, navigate])

  useEffect(() => {
    if (!customerId) return
    setProfile(null)
    setErr(null)
    api.customerProfile(customerId)
      .then(setProfile)
      .catch(e => setErr(e.message))
  }, [customerId])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 md:gap-6 page-enter">
      <CustomerListPanel />

      <div>
        {err && <div className="text-risk-high">Error: {err}</div>}

        {!profile && !err && (
          <div className="space-y-4">
            <GlassCard><SkeletonLoader lines={3} /></GlassCard>
            <GlassCard><SkeletonLoader lines={4} /></GlassCard>
          </div>
        )}

        {profile && (
          <>
            <CustomerHeader
              profile={profile.profile}
              valueSegment={profile.value_segment}
              churn={profile.churn_score}
              subscriptions={profile.subscriptions}
              healthScore={profile.health_score}
            />

            <TwinSignalCards signals={profile.twin_signals} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
              <div className="xl:col-span-2">
                <UsageTimelineChart months={profile.monthly_summary} />
              </div>
              <SatisfactionChart surveys={profile.satisfaction} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
              <ComplaintHistory
                complaints={profile.recent_complaints}
                support={profile.support_history}
              />
              <CampaignHistory history={profile.campaign_history} />
            </div>

            <AIAnalysisPanel
              customerId={Number(customerId)}
              language={profile.profile?.preferred_language}
            />
          </>
        )}
      </div>
    </div>
  )
}
