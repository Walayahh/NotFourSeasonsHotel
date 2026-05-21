import { motion } from 'framer-motion'

export default function HealthScoreGauge({ score = 0 }) {
  const safe = Math.max(0, Math.min(100, score))
  const radius = 60
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - safe / 100)

  const color = safe >= 70 ? '#22C55E' : safe >= 40 ? '#EAB308' : '#EF4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 150, height: 150 }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <motion.circle
          cx="75" cy="75" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          transform="rotate(-90 75 75)"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold" style={{ color }}>{safe.toFixed(0)}</div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider">Health</div>
      </div>
    </div>
  )
}
