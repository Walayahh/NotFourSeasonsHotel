const AGENTS = [
  { key: 'ChurnRiskAgent',     icon: '⚙', label: 'Churn Risk',     accent: '#8B5CF6' },
  { key: 'NetworkAgent',       icon: '◐', label: 'Network Impact', accent: '#F97316' },
  { key: 'RetentionAgent',     icon: '◈', label: 'Retention',      accent: '#3B82F6' },
  { key: 'CommunicationAgent', icon: '✉', label: 'Communication',  accent: '#22C55E' }
]

export default function AgentStatusBar({ activeAgent }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {AGENTS.map(a => {
        const active = activeAgent === a.key
        return (
          <div
            key={a.key}
            className="glass p-4 flex items-center gap-3"
            style={{
              borderColor: active ? a.accent + '60' : undefined,
              background: active ? a.accent + '14' : undefined
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${a.accent}22`, color: a.accent }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{a.label}</div>
              <div className="text-[10px] text-text-muted flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${active ? 'animate-pulse-soft' : ''}`}
                  style={{ background: active ? a.accent : '#64748B' }}
                />
                {active ? 'Active' : 'Monitoring'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
