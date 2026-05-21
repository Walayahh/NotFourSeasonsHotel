import { useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'
import AgentStatusBar from '../components/agents/AgentStatusBar.jsx'
import ActivityFeed from '../components/agents/ActivityFeed.jsx'
import AgentDeepDiveCard from '../components/agents/AgentDeepDiveCard.jsx'
import RiskBadge from '../components/shared/RiskBadge.jsx'
import Hero from '../components/shared/Hero.jsx'
import { fmtJOD, severityColor, fmtDate } from '../utils/format.js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function AgentActivityFeed() {
  const [items, setItems] = useState([])
  const [kpis, setKpis] = useState(null)
  const [topRisky, setTopRisky] = useState([])
  const [events, setEvents] = useState([])
  const [activeAgent, setActiveAgent] = useState(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })

  useEffect(() => {
    Promise.all([
      api.activitySeed(30),
      api.kpis(),
      api.topRiskyCustomers(50),
      api.events(true, 5)
    ]).then(([feed, k, r, e]) => {
      setItems(feed.items)
      setKpis(k)
      setTopRisky(r.customers)
      setEvents(e.events)
    })
  }, [])

  const riskReasonTop = useMemo(() => {
    const counts = {}
    for (const c of topRisky) {
      const r = c.main_risk_reason || 'Unknown'
      counts[r] = (counts[r] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [topRisky])

  const runBatch = async () => {
    if (batchRunning) return
    const targets = topRisky.slice(0, 5)
    setBatchRunning(true)
    setBatchProgress({ done: 0, total: targets.length })

    for (let i = 0; i < targets.length; i++) {
      const c = targets[i]
      try {
        setActiveAgent('ChurnRiskAgent')
        const r1 = await api.analyzeChurn(c.customer_id)
        setItems(prev => [{
          agent: 'ChurnRiskAgent',
          severity: r1.churn_analysis?.risk_level || 'High',
          title: `Analyzed ${c.full_name}`,
          subtitle: r1.churn_analysis?.risk_narrative?.slice(0, 100) || 'Risk analysis complete',
          target_type: 'customer',
          target_id: c.customer_id
        }, ...prev])

        setActiveAgent('RetentionAgent')
        const r2 = await api.analyzeRetention(c.customer_id, r1.churn_analysis)
        setItems(prev => [{
          agent: 'RetentionAgent',
          severity: 'Medium',
          title: `Designed offer for ${c.full_name}`,
          subtitle: r2.retention_recommendation?.offer_details?.slice(0, 100) || 'Offer designed',
          target_type: 'customer',
          target_id: c.customer_id
        }, ...prev])

        setActiveAgent('CommunicationAgent')
        const r3 = await api.analyzeCommunication(c.customer_id, r1.churn_analysis, r2.retention_recommendation)
        setItems(prev => [{
          agent: 'CommunicationAgent',
          severity: 'Low',
          title: `Drafted ${r3.communication_draft?.language || ''} message for ${c.full_name}`,
          subtitle: r3.communication_draft?.message?.slice(0, 100) || 'Message drafted',
          target_type: 'customer',
          target_id: c.customer_id
        }, ...prev])

        setBatchProgress({ done: i + 1, total: targets.length })
      } catch (e) {
        setItems(prev => [{
          agent: 'ChurnRiskAgent',
          severity: 'High',
          title: `Failed: ${c.full_name}`,
          subtitle: e.message,
          target_type: 'customer',
          target_id: c.customer_id
        }, ...prev])
      }
    }

    setActiveAgent(null)
    setBatchRunning(false)
  }

  if (!kpis) {
    return <div className="text-text-muted">Loading agent activity…</div>
  }

  const totalAffected = events.reduce((s, e) => s + (e.affected_customers || 0), 0)

  // Language split
  const langData = [
    { name: 'Arabic', value: 850, color: '#8B5CF6' },
    { name: 'English', value: 150, color: '#3B82F6' }
  ]

  return (
    <div className="page-enter">
      <Hero
        kicker="Autonomous Agents"
        title="AI Agent Activity"
        description={`4 agents monitoring · ${topRisky.length} high-risk customers tracked`}
        status={batchRunning ? `Running ${batchProgress.done}/${batchProgress.total}` : 'Standby'}
        action={
          <button
            onClick={runBatch}
            disabled={batchRunning}
            className="btn-gradient px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-50 transition-all"
            style={{
              background: batchRunning ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              boxShadow: batchRunning ? 'none' : '0 4px 16px rgba(139,92,246,0.4)'
            }}
          >
            {batchRunning
              ? `Running Batch · ${batchProgress.done}/${batchProgress.total}`
              : '▶ Run Batch Analysis (top 5)'}
          </button>
        }
      />

      <AgentStatusBar activeAgent={activeAgent} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <ActivityFeed items={items} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AgentDeepDiveCard title="Churn Risk Agent" accent="#8B5CF6" icon="⚙">
            <div className="text-2xl font-bold mb-1">{kpis.high_risk_customers}</div>
            <div className="text-xs text-text-muted mb-3">High-risk customers</div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Top risk reasons</div>
            <ul className="space-y-1.5">
              {riskReasonTop.map(([r, n]) => (
                <li key={r} className="flex justify-between text-xs">
                  <span className="text-text-muted truncate pr-2">{r}</span>
                  <span className="font-mono">{n}</span>
                </li>
              ))}
            </ul>
          </AgentDeepDiveCard>

          <AgentDeepDiveCard title="Network Impact Agent" accent="#F97316" icon="◐">
            <div className="text-2xl font-bold mb-1">{kpis.recent_network_events}</div>
            <div className="text-xs text-text-muted mb-2">Recent events · 14d</div>
            <div className="text-xs text-text-muted mb-3">
              Total affected: <strong className="text-white">{totalAffected.toLocaleString()}</strong>
            </div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Latest severe events</div>
            <ul className="space-y-1 text-xs">
              {events.slice(0, 3).map(e => (
                <li key={e.event_id} className="flex justify-between gap-2">
                  <span className="truncate" style={{ color: severityColor(e.severity) }}>{e.tower_name}</span>
                  <span className="text-text-muted shrink-0">{fmtDate(e.event_start_time)}</span>
                </li>
              ))}
            </ul>
          </AgentDeepDiveCard>

          <AgentDeepDiveCard title="Retention Agent" accent="#3B82F6" icon="◈">
            <div className="text-2xl font-bold mb-1">{fmtJOD(kpis.revenue_at_risk_jod)}</div>
            <div className="text-xs text-text-muted mb-3">Revenue at risk (monthly ARPU)</div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Recommended actions seen</div>
            <ul className="space-y-1 text-xs">
              {topRisky.slice(0, 4).map(c => (
                <li key={c.customer_id} className="text-text-muted truncate">
                  · {c.recommended_action || 'No action assigned'}
                </li>
              ))}
            </ul>
          </AgentDeepDiveCard>

          <AgentDeepDiveCard title="Communication Agent" accent="#22C55E" icon="✉">
            <div style={{ height: 110 }} className="mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={50}>
                    {langData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#15171f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 text-xs">
              {langData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-text-muted">{d.name}</span>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </AgentDeepDiveCard>
        </div>
      </div>
    </div>
  )
}
