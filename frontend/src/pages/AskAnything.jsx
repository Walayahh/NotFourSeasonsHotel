import { useEffect, useRef, useState } from 'react'
import { api } from '../utils/api.js'
import ChartRenderer from '../components/ask/ChartRenderer.jsx'
import Hero from '../components/shared/Hero.jsx'

export default function AskAnything() {
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSQL, setShowSQL] = useState({})
  const scrollRef = useRef(null)

  useEffect(() => {
    api.askSuggestions().then(r => setSuggestions(r.suggestions))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, busy])

  const ask = async (q) => {
    const text = (q ?? question).trim()
    if (!text || busy) return
    setQuestion('')
    const userTurn = { role: 'user', text }
    setHistory(h => [...h, userTurn])
    setBusy(true)
    try {
      const r = await api.askAnything(text)
      setHistory(h => [...h, { role: 'assistant', ...r }])
    } catch (e) {
      setHistory(h => [...h, { role: 'assistant', error: e.message, narrative: '' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-enter">
      <Hero
        kicker="Data Copilot"
        title="Ask Anything"
        description="Ask in plain English. The AI writes safe SQL, runs it, and draws the right chart."
        status={busy ? 'Thinking…' : 'Ready'}
        accent="blue"
      />

      <div className="grid grid-cols-[1fr_280px] gap-5 items-start">
        <div className="glass flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold mb-4"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
                >
                  ✺
                </div>
                <div className="text-lg font-semibold mb-1">What do you want to know?</div>
                <div className="text-sm text-text-muted max-w-md">
                  Try a question from the right panel, or type your own. Numbers, comparisons, time series, segment splits — anything in the data.
                </div>
              </div>
            )}

            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user' ? (
                  <div
                    className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
                  >
                    {m.text}
                  </div>
                ) : (
                  <div className="max-w-[90%] w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    {m.error ? (
                      <div className="text-risk-high text-sm">⚠ {m.error}</div>
                    ) : (
                      <>
                        {m.narrative && <div className="text-sm mb-3">{m.narrative}</div>}
                        <ChartRenderer chart={m.chart} columns={m.columns} rows={m.rows} />
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <div className="text-[11px] text-text-muted">
                            {m.row_count != null ? `${m.row_count} row${m.row_count === 1 ? '' : 's'}` : ''}
                          </div>
                          <button
                            onClick={() => setShowSQL(s => ({ ...s, [i]: !s[i] }))}
                            className="text-[11px] text-text-muted hover:text-white transition-colors"
                          >
                            {showSQL[i] ? 'Hide' : 'Show'} SQL
                          </button>
                        </div>
                        {showSQL[i] && (
                          <pre className="mt-2 text-[11px] bg-black/30 border border-white/5 rounded-lg p-3 overflow-x-auto font-mono text-text-muted whitespace-pre-wrap">
                            {m.sql}
                          </pre>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <span className="text-xs text-text-muted ml-1">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask() }}
            className="border-t border-white/10 p-3 flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about customers, churn, revenue, complaints, anything…"
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50"
            />
            <button
              type="submit"
              disabled={!question.trim() || busy}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)' }}
            >
              Ask
            </button>
          </form>
        </div>

        <div className="glass p-4 sticky top-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Try one of these
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => ask(s)}
                disabled={busy}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-brand-purple/30 transition-colors text-text-muted hover:text-white disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="mt-4 w-full text-xs px-3 py-2 rounded-lg border border-white/10 text-text-muted hover:text-white hover:bg-white/[0.04]"
            >
              Clear conversation
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
