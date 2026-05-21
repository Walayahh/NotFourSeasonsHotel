import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import GlassCard from '../shared/GlassCard.jsx'

export default function UsageTimelineChart({ months = [] }) {
  // months come newest-first from API; reverse for chart
  const data = [...months].reverse().map(m => ({
    month: m.summary_month,
    revenue: m.total_revenue_jod,
    data_gb: m.data_used_gb,
    voice: m.voice_minutes
  }))

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        6-Month Usage Timeline
      </h3>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#15171f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="Revenue (JOD)" />
            <Line yAxisId="right" type="monotone" dataKey="data_gb" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Data (GB)" />
            <Line yAxisId="right" type="monotone" dataKey="voice" stroke="#22C55E" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} name="Voice (min)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
