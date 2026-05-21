import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import GlassCard from '../shared/GlassCard.jsx'
import { riskColor } from '../../utils/format.js'

export default function ChurnDistributionChart({ data }) {
  const safe = (data || []).map(d => ({ name: d.risk_level, value: d.count }))
  const total = safe.reduce((s, d) => s + d.value, 0)

  return (
    <GlassCard className="h-full">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Churn Risk Distribution
      </h3>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={safe}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              isAnimationActive
              animationDuration={900}
            >
              {safe.map((d) => (
                <Cell key={d.name} fill={riskColor(d.name)} stroke="rgba(10,11,15,0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#15171f', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, fontSize: 13
              }}
              formatter={(v, n) => [`${v} customers`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        {safe.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: riskColor(d.name) }} />
            <span className="text-text-muted">{d.name}</span>
            <span className="font-semibold">{d.value}</span>
            <span className="text-text-muted">({total ? Math.round(d.value / total * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
