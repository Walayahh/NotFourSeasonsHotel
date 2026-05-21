import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Executive Dashboard', icon: '◐' },
  { to: '/twin', label: 'Customer Twin', icon: '◆' },
  { to: '/search', label: 'Advanced Search', icon: '⌕' },
  { to: '/campaigns', label: 'Campaign Studio', icon: '⊕' },
  { to: '/ask', label: 'Ask Anything', icon: '✺' },
  { to: '/agents', label: 'AI Agents', icon: '✦' }
]

export default function Sidebar() {
  const [logoBroken, setLogoBroken] = useState(false)

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 z-20 glass border-r border-white/10 rounded-none flex flex-col">
      <div className="p-6 border-b border-white/10 flex flex-col items-center text-center relative overflow-hidden">
        <div className="logo-aura" aria-hidden="true" />
        <Link to="/dashboard" className="flex flex-col items-center gap-3 group w-full relative z-10">
          <div className="logo-stage">
            <span className="sparkle sparkle-1" aria-hidden="true">✦</span>
            <span className="sparkle sparkle-2" aria-hidden="true">✧</span>
            <span className="sparkle sparkle-3" aria-hidden="true">✦</span>
            <span className="sparkle sparkle-4" aria-hidden="true">✧</span>
            <span className="sparkle sparkle-5" aria-hidden="true">✦</span>
            <span className="orbital-ring orbital-ring-1" aria-hidden="true" />
            <span className="orbital-ring orbital-ring-2" aria-hidden="true" />
            {logoBroken ? (
              <div
                className="logo-orb w-32 h-32 rounded-2xl flex items-center justify-center font-bold text-4xl text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
              >
                Z
              </div>
            ) : (
              <img
                src="/logo.png"
                alt="Zain logo"
                className="logo-orb w-32 h-32 object-contain shrink-0"
                onError={() => setLogoBroken(true)}
                draggable={false}
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[16px] leading-tight bg-gradient-to-r from-white via-brand-purple to-brand-blue bg-clip-text text-transparent">
              Zain Customer 360
            </div>
            <div className="text-[11px] text-text-muted tracking-wider mt-1 uppercase">AI Command Center</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'nav-link-active bg-brand-purple/15 text-white border border-brand-purple/30 shadow-[0_2px_12px_rgba(139,92,246,0.15)]'
                  : 'text-text-muted hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`
            }
          >
            <span className="text-brand-purple text-lg w-5 text-center">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Demo data · 2026-05
        </div>
      </div>
    </aside>
  )
}
