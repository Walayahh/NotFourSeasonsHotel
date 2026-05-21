import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Sidebar from './components/layout/Sidebar.jsx'
import AnimatedBackground from './components/layout/AnimatedBackground.jsx'
import ExecutiveDashboard from './pages/ExecutiveDashboard.jsx'
import CustomerTwinView from './pages/CustomerTwinView.jsx'
import AgentActivityFeed from './pages/AgentActivityFeed.jsx'
import AdvancedSearch from './pages/AdvancedSearch.jsx'
import CampaignStudio from './pages/CampaignStudio.jsx'
import AskAnything from './pages/AskAnything.jsx'
import LoginPage from './pages/LoginPage.jsx'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } }
}

export default function App() {
  const location = useLocation()
  const [isAuthed, setIsAuthed] = useState(() => localStorage.getItem('zain-auth') === 'true')

  useEffect(() => {
    localStorage.setItem('zain-auth', String(isAuthed))
  }, [isAuthed])

  const login = () => setIsAuthed(true)
  const logout = () => setIsAuthed(false)

  if (!isAuthed) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="relative min-h-screen text-text-primary">
      <AnimatedBackground />
      <Sidebar onLogout={logout} />
      <main className="md:ml-64 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial" animate="animate" exit="exit"
            variants={pageVariants}
            className="p-4 md:p-8"
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ExecutiveDashboard />} />
              <Route path="/twin" element={<CustomerTwinView />} />
              <Route path="/twin/:customerId" element={<CustomerTwinView />} />
              <Route path="/agents" element={<AgentActivityFeed />} />
              <Route path="/search" element={<AdvancedSearch />} />
              <Route path="/campaigns" element={<CampaignStudio />} />
              <Route path="/ask" element={<AskAnything />} />
            </Routes>
            <div className="md:hidden mt-8 p-3 border border-white/10 bg-bg/80 backdrop-blur-xl rounded-xl text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Demo data · 2026-05
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-semibold text-text-muted transition-colors hover:border-brand-purple/40 hover:bg-white/[0.07] hover:text-white"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
