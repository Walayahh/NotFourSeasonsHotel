import GlassCard from '../shared/GlassCard.jsx'

export default function AgentDeepDiveCard({ title, accent = '#8B5CF6', icon, children }) {
  return (
    <GlassCard className="h-full">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: accent + '22', color: accent }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div>{children}</div>
    </GlassCard>
  )
}
