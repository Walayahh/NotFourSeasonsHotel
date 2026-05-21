import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import RiskBadge from '../shared/RiskBadge.jsx'
import { fmtJOD, fmtNumber, initials } from '../../utils/format.js'

const bodyVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.025, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}

const rowVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.12 } }
}

export default function ResultsTable({ customers, loading, pageKey }) {
  const navigate = useNavigate()
  if (loading) {
    return (
      <div className="glass p-8 text-center text-text-muted text-sm">
        Searching…
      </div>
    )
  }
  if (!customers?.length) {
    return (
      <div className="glass p-10 text-center">
        <div className="text-4xl mb-2 text-text-muted">⌕</div>
        <div className="text-sm text-text-muted">
          No customers match these filters. Try broadening your selection.
        </div>
      </div>
    )
  }
  return (
    <div className="glass overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted border-b border-white/5 bg-white/[0.02]">
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Segment</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3 text-right">Churn</th>
            <th className="px-4 py-3 text-right">ARPU</th>
            <th className="px-4 py-3">Top reason</th>
          </tr>
        </thead>
        <AnimatePresence mode="wait" initial={false}>
          <motion.tbody
            key={pageKey ?? 'page-0'}
            variants={bodyVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {customers.map((c) => (
              <motion.tr
                key={c.customer_id}
                variants={rowVariants}
                onClick={() => navigate(`/twin/${c.customer_id}`)}
                whileHover={{
                  backgroundColor: 'rgba(139, 92, 246, 0.06)',
                  transition: { duration: 0.12 }
                }}
                className="border-b border-white/5 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
                    >
                      {initials(c.full_name)}
                    </div>
                    <div>
                      <div className="font-medium leading-tight">{c.full_name}</div>
                      <div className="text-[11px] text-text-muted">#{c.customer_id} · {c.preferred_language}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">{c.city}, {c.governorate}</td>
                <td className="px-4 py-3 text-xs">
                  <div className="font-medium">{c.customer_segment}</div>
                  <div className="text-text-muted">{c.value_segment || '—'}</div>
                </td>
                <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                <td className="px-4 py-3 text-right font-mono text-sm">{fmtNumber(c.churn_score, { maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right font-mono text-sm">{fmtJOD(c.arpu_jod)}</td>
                <td className="px-4 py-3 text-text-muted text-xs max-w-[180px] truncate">{c.main_risk_reason || '—'}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </AnimatePresence>
      </table>
    </div>
  )
}
