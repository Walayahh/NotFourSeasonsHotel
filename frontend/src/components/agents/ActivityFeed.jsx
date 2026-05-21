import { motion, AnimatePresence } from 'framer-motion'
import ActivityFeedItem from './ActivityFeedItem.jsx'

export default function ActivityFeed({ items = [] }) {
  return (
    <div className="glass p-5 h-[700px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Live Agent Activity
        </h3>
        <span className="text-xs text-text-muted">{items.length} items</span>
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        className="flex-1 overflow-y-auto pr-2 -mr-2"
      >
        <AnimatePresence>
          {items.map((it, i) => (
            <ActivityFeedItem key={`${it.agent}-${it.target_id ?? i}-${i}`} item={it} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
