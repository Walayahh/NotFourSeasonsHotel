import { useState } from 'react'

const USERNAME = 'admin'
const PASSWORD = 'password'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState(USERNAME)
  const [password, setPassword] = useState(PASSWORD)
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()

    if (username === USERNAME && password === PASSWORD) {
      setError('')
      onLogin()
      return
    }

    setError('Invalid username or password.')
  }

  return (
    <div className="login-shell min-h-screen relative overflow-hidden text-text-primary">
      <div className="login-mesh" aria-hidden="true" />
      <div className="login-grid" aria-hidden="true" />
      <div className="login-scanline" aria-hidden="true" />

      <main className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_440px] gap-8 lg:gap-12 items-center px-4 sm:px-8 lg:px-12 py-6 lg:py-10">
        <section className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
            Secure AI Command Center
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-normal max-w-2xl">
            Zain Customer 360
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300 max-w-xl">
            Monitor churn, network pressure, campaigns, and customer signals from a single operational workspace.
          </p>

          <div className="mt-8 lg:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            {[
              ['Live KPIs', 'Risk and revenue signals'],
              ['AI Queries', 'Ask the data directly'],
              ['Network Map', 'Tower health by city']
            ].map(([title, copy]) => (
              <div key={title} className="border border-white/10 bg-black/20 rounded-lg p-4">
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-text-muted mt-1 leading-5">{copy}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="login-card p-7">
          <div className="flex items-center gap-4 mb-7">
            <img src="/logo.png" alt="Zain logo" className="w-16 h-16 object-contain shrink-0" />
            <div>
              <div className="text-xl font-bold">Welcome Back</div>
              <div className="text-sm text-text-muted mt-1">Sign in to continue</div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-text-muted focus:border-brand-purple/60 focus:bg-white/[0.08]"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue/60 focus:bg-white/[0.08]"
                autoComplete="current-password"
              />
            </label>

            <div className="min-h-[22px]">
              {error && <div className="text-sm text-risk-high">{error}</div>}
            </div>

            <button
              type="submit"
              className="btn-gradient w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(59,130,246,0.28)]"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 52%, #14B8A6 100%)' }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-xs text-text-muted">
            Demo access: <span className="text-white font-semibold">admin</span> / <span className="text-white font-semibold">password</span>
          </div>

          <div className="hidden lg:flex mt-5 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="rounded-lg bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
              <img
                src="/login-qr.svg"
                alt="QR code for mobile login"
                className="w-24 h-24"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Open on mobile</div>
              <div className="mt-1 text-xs leading-5 text-text-muted">
                Scan to visit the deployed login page.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
