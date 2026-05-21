import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../utils/api.js'
import KPICard from '../components/dashboard/KPICard.jsx'
import ChurnDistributionChart from '../components/dashboard/ChurnDistributionChart.jsx'
import RevenueByRegionChart from '../components/dashboard/RevenueByRegionChart.jsx'
import TowerMap from '../components/dashboard/TowerMap.jsx'
import TopRiskyCustomersTable from '../components/dashboard/TopRiskyCustomersTable.jsx'
import ComplaintTrendChart from '../components/dashboard/ComplaintTrendChart.jsx'
import SkeletonLoader from '../components/shared/SkeletonLoader.jsx'
import Hero from '../components/shared/Hero.jsx'

const grid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
}

export default function ExecutiveDashboard() {
  const [kpis, setKpis] = useState(null)
  const [regions, setRegions] = useState([])
  const [topRisky, setTopRisky] = useState([])
  const [towers, setTowers] = useState([])
  const [trend, setTrend] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    Promise.all([
      api.kpis(),
      api.churnByRegion(),
      api.topRiskyCustomers(10),
      api.towers(),
      api.complaintTrend()
    ])
      .then(([k, r, c, t, tr]) => {
        setKpis(k)
        setRegions(r.regions)
        setTopRisky(c.customers)
        setTowers(t.towers)
        setTrend(tr.weeks)
      })
      .catch((e) => setErr(e.message))
  }, [])

  if (err) {
    return <div className="text-risk-high">Error loading dashboard: {err}</div>
  }

  if (!kpis) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Executive Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass p-6"><SkeletonLoader lines={2} /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <Hero
        kicker="Executive Overview"
        title="Executive Dashboard"
        description={`Score month: ${kpis.score_month} · Data anchor: ${kpis.data_anchor} · ${kpis.total_customers.toLocaleString()} customers`}
        status="Live data"
      />

      <motion.div variants={grid} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <KPICard label="High-Risk Customers" value={kpis.high_risk_customers} accent="red" sublabel="active accounts" />
        <KPICard label="Revenue at Risk" value={kpis.revenue_at_risk_jod} suffix="JOD" accent="purple" sublabel="monthly ARPU" />
        <KPICard label="Recent Network Events" value={kpis.recent_network_events} accent="amber" sublabel="last 14 days" />
        <KPICard label="Avg NPS" value={kpis.avg_nps_30d} decimals={1} accent="blue" sublabel="last 30 days" />
        <KPICard label="Total Customers" value={kpis.total_customers} accent="green" sublabel="across Jordan" />
      </motion.div>

      <motion.div variants={grid} initial="hidden" animate="visible" className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <ChurnDistributionChart data={kpis.risk_distribution} />
        <div className="xl:col-span-2"><RevenueByRegionChart regions={regions} /></div>
      </motion.div>

      <motion.div variants={grid} initial="hidden" animate="visible" className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2"><TowerMap towers={towers} /></div>
        <ComplaintTrendChart weeks={trend} />
      </motion.div>

      <TopRiskyCustomersTable customers={topRisky} />
    </div>
  )
}
