import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } }
}

export default function GlassCard({ children, className = '', as = 'div', ...rest }) {
  const Comp = motion[as] || motion.div
  return (
    <Comp
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`glass p-6 transition-all duration-300 ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  )
}
