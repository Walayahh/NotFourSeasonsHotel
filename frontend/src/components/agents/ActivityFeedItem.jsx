import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { severityColor } from '../../utils/format.js'

const ICON_BY_AGENT = {
  ChurnRiskAgent: '⚙',
  NetworkAgent: '◐',
  RetentionAgent: '◈',
  CommunicationAgent: '✉'
}

const itemVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } }
}

export default function ActivityFeedItem({ item, index = 0 }) {
  const navigate = useNavigate()
  const sevColor = severityColor(item.severity)
  const onClick = () => {
    if (item.target_type === 'customer' && item.target_id) {
      navigate(`/twin/${item.target_id}`)
    }
  }
  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className={`glass p-4 mb-2 ${item.target_type === 'customer' ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl text-brand-purple shrink-0">{ICON_BY_AGENT[item.agent] || '✦'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <span className="font-semibold text-text-primary">{item.agent}</span>
            <span>·</span>
            <span>{new Date(Date.now() - index * 47_000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-sm font-medium">{item.title}</div>
          {item.subtitle && <div className="text-xs text-text-muted mt-1">{item.subtitle}</div>}
        </div>
        {item.severity && (
          <span
            className="text-[10px] px-2 py-1 rounded-full border font-semibold shrink-0"
            style={{ color: sevColor, borderColor: sevColor + '60', background: sevColor + '15' }}
          >
            {item.severity}
          </span>
        )}
      </div>
    </motion.div>
  )
}
