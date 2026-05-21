import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import GlassCard from '../shared/GlassCard.jsx'

export default function ComplaintTrendChart({ weeks = [] }) {
  const data = weeks.map(w => ({ week: w.week_start?.slice(5), complaints: w.complaints }))
  return (
    <GlassCard className="h-full">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Complaint Trend · last 8 weeks
      </h3>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="complaintGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{ background: '#15171f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13 }}
            />
            <Area type="monotone" dataKey="complaints" stroke="#8B5CF6" strokeWidth={2} fill="url(#complaintGrad)" isAnimationActive animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
