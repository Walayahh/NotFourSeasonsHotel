import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import GlassCard from '../shared/GlassCard.jsx'
import { fmtJOD } from '../../utils/format.js'

export default function RevenueByRegionChart({ regions = [] }) {
  const data = regions
    .filter(r => r.revenue_at_risk_jod > 0)
    .map(r => ({ name: r.region, value: r.revenue_at_risk_jod, high: r.high_risk }))

  return (
    <GlassCard className="h-full">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
        Revenue at Risk by Governorate
      </h3>
      <p className="text-xs text-text-muted mb-3">High-risk customers · ARPU sum</p>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 24 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              width={80}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#15171f', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, fontSize: 13
              }}
              formatter={(v, _, p) => [fmtJOD(v), `Risk ARPU · ${p.payload.high} High-risk`]}
              labelFormatter={(l) => l}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900}>
              {data.map((_, i) => (
                <Cell key={i} fill="url(#purpleGrad)" />
              ))}
            </Bar>
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={1} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
