import { motion } from 'framer-motion'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
}

const severityStyle = {
  High:   { color: '#FCA5A5', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.3)' },
  Medium: { color: '#FDE68A', bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.3)' },
  Low:    { color: '#86EFAC', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.3)' }
}

const arrow = { up: '↑', down: '↓', stable: '→' }

export default function TwinSignalCards({ signals = [] }) {
  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-4 gap-4 mb-6">
      {signals.map(s => {
        const st = severityStyle[s.severity] || severityStyle.Low
        return (
          <motion.div
            key={s.key}
            variants={item}
            className="glass p-4"
            style={{ borderColor: st.border, background: st.bg }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {s.label}
              </div>
              <span className="text-base" style={{ color: st.color }}>
                {arrow[s.trend] || '→'}
              </span>
            </div>
            <div className="text-sm font-medium leading-snug" style={{ color: st.color }}>
              {s.value}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
