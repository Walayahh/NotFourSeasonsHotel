import { useRef, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Executive Dashboard', icon: '◐' },
  { to: '/twin', label: 'Customer Twin', icon: '◆' },
  { to: '/search', label: 'Advanced Search', icon: '⌕' },
  { to: '/campaigns', label: 'Campaign Studio', icon: '⊕' },
  { to: '/ask', label: 'Ask Anything', icon: '✺' },
  { to: '/agents', label: 'AI Agents', icon: '✦' }
]

export default function Sidebar({ onLogout }) {
  const [logoBroken, setLogoBroken] = useState(false)
  const logoAudioRef = useRef(null)

  const playLogoAudio = () => {
    const audio = logoAudioRef.current
    if (!audio) return

    audio.currentTime = 0
    audio.play().catch(() => {
      // Browsers can block playback until the page has received a user gesture.
    })
  }

  const stopLogoAudio = () => {
    const audio = logoAudioRef.current
    if (!audio) return

    audio.pause()
    audio.currentTime = 0
  }

  return (
    <aside className="relative md:fixed md:left-0 md:top-0 md:bottom-0 w-full md:w-64 z-20 glass border-b md:border-b-0 md:border-r border-white/10 rounded-none flex flex-col">
      <div className="px-4 py-3 md:p-6 border-b border-white/10 flex flex-row md:flex-col items-center justify-between md:justify-center text-left md:text-center relative overflow-hidden gap-3">
        <div className="logo-aura" aria-hidden="true" />
        <audio ref={logoAudioRef} src="/rick-astley-never-gonna-give-you-up.mp3" preload="auto" />
        <Link to="/dashboard" className="flex flex-row md:flex-col items-center gap-3 group min-w-0 md:w-full relative z-10">
          <div className="logo-stage" onMouseEnter={playLogoAudio} onMouseLeave={stopLogoAudio}>
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
            <div className="hidden sm:block text-[11px] text-text-muted tracking-wider mt-1 uppercase">AI Command Center</div>
          </div>
        </Link>
      </div>

      <nav className="md:flex-1 p-2 md:p-3 flex md:block gap-2 md:space-y-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `relative flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0 md:w-full ${
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

      <div className="p-3 md:p-4 border-t border-white/10 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Demo data · 2026-05
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-semibold text-text-muted transition-colors hover:border-brand-purple/40 hover:bg-white/[0.07] hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
