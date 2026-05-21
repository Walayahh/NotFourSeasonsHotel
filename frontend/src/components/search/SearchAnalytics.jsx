import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts'
import { api } from '../../utils/api.js'
import { fmtJOD, fmtNumber } from '../../utils/format.js'

const RISK_COLOR = { High: '#EF4444', Medium: '#EAB308', Low: '#22C55E' }
const VALUE_COLOR = { VIP: '#8B5CF6', 'High Value': '#3B82F6', 'Mid Value': '#06B6D4', 'Low Value': '#64748B' }

const tipBox = {
  contentStyle: {
    background: '#11141d',
    border: '1px solid rgba(139, 92, 246, 0.45)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
  }
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
}
const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18 } }
}

function StatTile({ label, value, sub, accent = '#8B5CF6', icon }) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-xl p-3.5 border"
      style={{
        background: `linear-gradient(135deg, ${accent}18, transparent 70%)`,
        borderColor: `${accent}38`,
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
        {icon && <span style={{ color: accent }}>{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1.5 leading-none" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-text-muted mt-1">{sub}</div>}
    </motion.div>
  )
}

function RiskDonut({ data, total }) {
  const formatted = data.map(d => ({ name: d.k || 'Unknown', value: d.n, color: RISK_COLOR[d.k] || '#64748B' }))
  if (!formatted.length || total === 0) {
    return <EmptyChart label="No risk data" />
  }
  return (
    <div className="relative" style={{ height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={formatted}
            dataKey="value" nameKey="name"
            innerRadius={58} outerRadius={92}
            paddingAngle={3}
            isAnimationActive
            animationBegin={100}
            animationDuration={800}
          >
            {formatted.map(d => (
              <Cell key={d.name} fill={d.color} stroke="rgba(10,11,15,0.7)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip {...tipBox} formatter={(v, n) => [`${v.toLocaleString()} customers`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-2xl font-bold leading-none">{total.toLocaleString()}</div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">customers</div>
      </div>
    </div>
  )
}

function ARPUChurnScatter({ data }) {
  if (!data?.length) return <EmptyChart label="Not enough data for scatter" />
  const grouped = ['High', 'Medium', 'Low'].map(level => ({
    level,
    color: RISK_COLOR[level],
    points: data.filter(d => d.risk_level === level).map(d => ({
      x: d.churn_score,
      y: d.arpu_jod,
      name: d.full_name,
      id: d.customer_id,
    }))
  })).filter(g => g.points.length > 0)

  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis
            type="number" dataKey="x" domain={[0, 1]}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false} tickLine={false}
            label={{ value: 'Churn score', position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 11 }}
          />
          <YAxis
            type="number" dataKey="y"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false} tickLine={false}
            label={{ value: 'ARPU', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            {...tipBox}
            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(139,92,246,0.4)' }}
            formatter={(v, n) => n === 'x' ? [Number(v).toFixed(2), 'Churn'] : [`${Number(v).toFixed(0)} JOD`, 'ARPU']}
            labelFormatter={() => ''}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload
              return (
                <div style={tipBox.contentStyle} className="p-2">
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-text-muted">Churn <span className="text-white font-mono">{p.x.toFixed(2)}</span></div>
                  <div className="text-text-muted">ARPU <span className="text-white font-mono">{p.y.toFixed(0)} JOD</span></div>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} iconType="circle" />
          {grouped.map(g => (
            <Scatter
              key={g.level}
              name={g.level}
              data={g.points}
              fill={g.color}
              fillOpacity={0.7}
              isAnimationActive
              animationBegin={150}
              animationDuration={700}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

function GovStackBar({ data }) {
  if (!data?.length) return <EmptyChart label="No customers in any governorate" />
  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category" dataKey="k" width={84}
            tick={{ fill: '#CBD5E1', fontSize: 12 }} axisLine={false} tickLine={false}
          />
          <Tooltip {...tipBox} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} iconType="circle" />
          <Bar dataKey="high"   stackId="r" fill={RISK_COLOR.High}   name="High"   radius={[0,0,0,0]} animationDuration={700} animationBegin={100} />
          <Bar dataKey="medium" stackId="r" fill={RISK_COLOR.Medium} name="Medium" animationDuration={700} animationBegin={200} />
          <Bar dataKey="low"    stackId="r" fill={RISK_COLOR.Low}    name="Low"    radius={[0,6,6,0]} animationDuration={700} animationBegin={300} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChurnHistogram({ data }) {
  if (!data?.length) return <EmptyChart label="No churn scores" />
  const binLabel = (i) => `${(i * 0.1).toFixed(1)}–${((i + 1) * 0.1).toFixed(1)}`
  const full = Array.from({ length: 10 }, (_, i) => {
    const found = data.find(d => d.bin === i)
    return { bin: binLabel(i), n: found?.n || 0, raw: i }
  })
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={full} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="bin" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tipBox} cursor={{ fill: 'rgba(139,92,246,0.06)' }} formatter={(v) => [`${v} customers`, 'Count']} />
          <Bar dataKey="n" radius={[5, 5, 0, 0]} animationDuration={700}>
            {full.map((d) => {
              const intensity = d.raw / 9
              const r = Math.round(34 + (239 - 34) * intensity)
              const g = Math.round(197 + (68 - 197) * intensity)
              const b = Math.round(94 + (68 - 94) * intensity)
              return <Cell key={d.raw} fill={`rgb(${r}, ${g}, ${b})`} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TopRiskReasonsBar({ data }) {
  if (!data?.length) return <EmptyChart label="No risk reasons" />
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category" dataKey="k" width={140}
            tick={{ fill: '#CBD5E1', fontSize: 11 }} axisLine={false} tickLine={false}
          />
          <Tooltip {...tipBox} cursor={{ fill: 'rgba(139,92,246,0.06)' }} formatter={(v) => [`${v} customers`, 'Count']} />
          <Bar dataKey="n" radius={[0, 6, 6, 0]} animationDuration={700}>
            {data.map((_, i) => {
              const palette = ['#8B5CF6', '#3B82F6', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444']
              return <Cell key={i} fill={palette[i % palette.length]} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="h-full min-h-[160px] flex items-center justify-center text-xs text-text-muted">
      {label}
    </div>
  )
}

function ChartCard({ title, subtitle, accent = '#8B5CF6', children, className = '' }) {
  return (
    <motion.div
      variants={cardVariants}
      className={`glass lift p-4 ${className}`}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: accent }} />
            {title}
          </div>
          {subtitle && <div className="text-[11px] text-text-muted mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

export default function SearchAnalytics({ filters }) {
  const [aggs, setAggs] = useState(null)
  const [loading, setLoading] = useState(false)

  // Stable signature so we don't refetch on harmless re-renders (e.g. offset changes)
  const sig = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const { offset, limit, sort, ...rest } = filters
    return JSON.stringify(rest)
  }, [filters])

  useEffect(() => {
    setLoading(true)
    let cancelled = false
    const t = setTimeout(() => {
      api.searchAggregates(filters)
        .then(r => { if (!cancelled) setAggs(r) })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  if (!aggs && !loading) return null

  const k = aggs?.kpis
  const total = aggs?.total || 0
  const highPct = total > 0 ? Math.round((k?.high_risk_count || 0) / total * 100) : 0

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sig}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-3"
      >
        {/* KPI strip */}
        <motion.div variants={cardVariants} className="grid grid-cols-5 gap-3">
          <StatTile
            label="Cohort size"
            value={total.toLocaleString()}
            sub="matching customers"
            accent="#8B5CF6"
            icon="◆"
          />
          <StatTile
            label="High risk"
            value={(k?.high_risk_count || 0).toLocaleString()}
            sub={`${highPct}% of cohort`}
            accent="#EF4444"
            icon="▲"
          />
          <StatTile
            label="Avg churn score"
            value={fmtNumber(k?.avg_churn, { maximumFractionDigits: 2 })}
            sub="0 = safe, 1 = lost"
            accent="#F59E0B"
            icon="◐"
          />
          <StatTile
            label="Avg ARPU"
            value={fmtJOD(k?.avg_arpu)}
            sub="monthly per customer"
            accent="#22C55E"
            icon="◈"
          />
          <StatTile
            label="Revenue at risk"
            value={fmtJOD(k?.revenue_at_risk_jod)}
            sub="from high-risk only"
            accent="#3B82F6"
            icon="◉"
          />
        </motion.div>

        {/* Risk donut + ARPU × Churn scatter */}
        <div className="grid grid-cols-3 gap-3">
          <ChartCard title="Risk mix" accent="#8B5CF6">
            <RiskDonut data={aggs?.risk_distribution || []} total={total} />
            <div className="flex justify-center gap-3 mt-2 text-[11px]">
              {(aggs?.risk_distribution || []).map(d => (
                <div key={d.k} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: RISK_COLOR[d.k] || '#64748B' }} />
                  <span className="text-text-muted">{d.k}</span>
                  <span className="font-semibold">{d.n}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="ARPU × Churn map"
            subtitle="Top-right = high value at risk (priority retention)"
            accent="#3B82F6"
            className="col-span-2"
          >
            <ARPUChurnScatter data={aggs?.scatter_sample || []} />
          </ChartCard>
        </div>

        {/* Governorate stack + distribution panels */}
        <div className="grid grid-cols-2 gap-3">
          <ChartCard title="Top governorates · risk stack" accent="#22C55E">
            <GovStackBar data={aggs?.governorate_stack || []} />
          </ChartCard>

          <div className="grid grid-rows-2 gap-3">
            <ChartCard title="Churn distribution" subtitle="Customers per churn-score band" accent="#F59E0B">
              <ChurnHistogram data={aggs?.churn_histogram || []} />
            </ChartCard>
            <ChartCard title="Top risk reasons" accent="#EF4444">
              <TopRiskReasonsBar data={aggs?.top_risk_reasons || []} />
            </ChartCard>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
