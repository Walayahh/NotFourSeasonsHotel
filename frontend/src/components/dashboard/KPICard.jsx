import { motion } from 'framer-motion'
import useCountUp from '../../hooks/useCountUp.js'
import { fmtNumber } from '../../utils/format.js'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}

export default function KPICard({ label, value, suffix = '', accent = 'purple', sublabel, decimals = 0 }) {
  const animated = useCountUp(value ?? 0)
  const accents = {
    purple: 'from-brand-purple/40 to-brand-purple/0',
    blue:   'from-brand-blue/40 to-brand-blue/0',
    red:    'from-risk-high/40 to-risk-high/0',
    green:  'from-risk-low/40 to-risk-low/0',
    amber:  'from-risk-medium/40 to-risk-medium/0'
  }
  const gradient = accents[accent] || accents.purple

  const displayed =
    value == null ? '—'
    : decimals === 0 ? fmtNumber(Math.round(animated))
    : Number(animated).toFixed(decimals)

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="glass p-6 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />
      <div className="relative">
        <div className="text-xs text-text-muted uppercase tracking-wider mb-2">{label}</div>
        <div className="text-3xl font-bold tracking-tight">
          {displayed}
          {suffix && <span className="text-base text-text-muted ml-1 font-medium">{suffix}</span>}
        </div>
        {sublabel && <div className="text-xs text-text-muted mt-2">{sublabel}</div>}
      </div>
    </motion.div>
  )
}
