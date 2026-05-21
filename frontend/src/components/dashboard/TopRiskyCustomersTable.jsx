import { useNavigate } from 'react-router-dom'
import GlassCard from '../shared/GlassCard.jsx'
import RiskBadge from '../shared/RiskBadge.jsx'
import { fmtJOD, riskColor } from '../../utils/format.js'

export default function TopRiskyCustomersTable({ customers = [] }) {
  const navigate = useNavigate()

  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Top Risky Customers
        </h3>
        <span className="text-xs text-text-muted">{customers.length} shown · sorted by churn score</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-muted uppercase tracking-wider bg-white/[0.02]">
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">City</th>
              <th className="text-left px-4 py-3 font-medium">Segment</th>
              <th className="text-left px-4 py-3 font-medium">Score</th>
              <th className="text-left px-4 py-3 font-medium">Risk</th>
              <th className="text-left px-4 py-3 font-medium">Reason</th>
              <th className="text-right px-4 py-3 font-medium">ARPU</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.customer_id}
                onClick={() => navigate(`/twin/${c.customer_id}`)}
                className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{c.full_name}</div>
                  <div className="text-xs text-text-muted">{c.preferred_language}</div>
                </td>
                <td className="px-4 py-3 text-text-muted">{c.city}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10">
                    {c.customer_segment}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.churn_score * 100).toFixed(0)}%`,
                          background: riskColor(c.risk_level)
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs">{c.churn_score.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                <td className="px-4 py-3 text-xs text-text-muted">{c.main_risk_reason}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{fmtJOD(c.arpu_jod)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
