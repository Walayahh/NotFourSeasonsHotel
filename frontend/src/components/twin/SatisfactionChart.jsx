import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import GlassCard from '../shared/GlassCard.jsx'

export default function SatisfactionChart({ surveys = [] }) {
  const data = [...surveys].reverse().map(s => ({
    date: s.survey_date?.slice(5),
    nps: s.nps_score,
    csat: s.csat_score
  }))

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Satisfaction · NPS
      </h3>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              contentStyle={{ background: '#15171f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13 }}
            />
            <Bar dataKey="nps" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.nps >= 7 ? '#22C55E' : d.nps >= 5 ? '#EAB308' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
