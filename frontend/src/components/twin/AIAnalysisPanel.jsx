import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAgentPipeline from '../../hooks/useAgentPipeline.js'
import GlassCard from '../shared/GlassCard.jsx'
import RiskBadge from '../shared/RiskBadge.jsx'
import TypingIndicator from '../shared/TypingIndicator.jsx'
import { isArabic } from '../../utils/format.js'

const AGENT_META = {
  churn:         { name: 'ChurnRiskAgent',     icon: '⚙', desc: 'Behavioral signals' },
  retention:     { name: 'RetentionAgent',     icon: '◈', desc: 'Offer design' },
  communication: { name: 'CommunicationAgent', icon: '✉', desc: 'Outreach draft' }
}

function StageRow({ keyName, stage, statusLabel }) {
  const meta = AGENT_META[keyName]
  const colors = {
    pending: 'text-text-muted',
    running: 'text-brand-purple',
    done:    'text-green-300',
    error:   'text-risk-high'
  }
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`text-xl ${colors[stage.state]}`}>{meta.icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{meta.name}</div>
        <div className="text-xs text-text-muted">{meta.desc}</div>
      </div>
      <div className={`text-xs ${colors[stage.state]} flex items-center gap-2`}>
        {stage.state === 'running' && <TypingIndicator />}
        <span>{statusLabel(stage)}</span>
      </div>
    </div>
  )
}

function statusLabel(stage) {
  switch (stage.state) {
    case 'pending': return 'Waiting'
    case 'running': return 'Analyzing…'
    case 'done':    return 'Complete'
    case 'error':   return 'Error'
    default:        return ''
  }
}

export default function AIAnalysisPanel({ customerId, language = 'English' }) {
  const { run, reset, stages, results, isRunning, error } = useAgentPipeline(customerId)
  const [copied, setCopied] = useState(false)

  const copyMessage = () => {
    const msg = results.communication?.message
    if (!msg) return
    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const anyDone = Object.values(stages).some(s => s.state !== 'pending')
  const allDone = stages.churn.state === 'done' && stages.retention.state === 'done' && stages.communication.state === 'done'

  return (
    <GlassCard className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle at 0% 0%, rgba(139,92,246,0.18) 0%, transparent 60%)'
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-brand-purple uppercase tracking-wider mb-1">AI Twin Analysis</div>
            <h3 className="text-xl font-bold">Multi-agent intervention plan</h3>
            <p className="text-xs text-text-muted mt-1">
              3 sequential GPT-4o agents · ~10-15s total
            </p>
          </div>
          <div className="flex gap-2">
            {anyDone && !isRunning && (
              <button
                onClick={reset}
                className="px-4 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                Reset
              </button>
            )}
            <button
              onClick={run}
              disabled={isRunning || !customerId}
              className="px-5 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: isRunning
                  ? 'rgba(139,92,246,0.3)'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                boxShadow: isRunning ? 'none' : '0 4px 16px rgba(139,92,246,0.4)'
              }}
            >
              {isRunning ? 'Running…' : anyDone ? 'Re-run' : 'Generate AI Analysis'}
            </button>
          </div>
        </div>

        {/* Pipeline progress */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass !bg-white/[0.02] p-4 !shadow-none">
            <StageRow keyName="churn" stage={stages.churn} statusLabel={statusLabel} />
          </div>
          <div className="glass !bg-white/[0.02] p-4 !shadow-none">
            <StageRow keyName="retention" stage={stages.retention} statusLabel={statusLabel} />
          </div>
          <div className="glass !bg-white/[0.02] p-4 !shadow-none">
            <StageRow keyName="communication" stage={stages.communication} statusLabel={statusLabel} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-risk-high/10 border border-risk-high/30 text-sm text-risk-high">
            {error}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results.churn && (
            <motion.div
              key="churn-result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 p-5 rounded-xl bg-white/[0.03] border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-brand-purple">Risk Summary</h4>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  {results.churn.risk_level && <RiskBadge level={results.churn.risk_level} />}
                  {results.churn.confidence_pct != null && (
                    <span>Confidence: <strong className="text-white">{results.churn.confidence_pct}%</strong></span>
                  )}
                  {results.churn.urgency_days != null && (
                    <span>Urgency: <strong className="text-white">{results.churn.urgency_days}d</strong></span>
                  )}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-text-primary mb-3">
                {results.churn.risk_narrative}
              </p>
              {Array.isArray(results.churn.root_causes) && (
                <div className="flex flex-wrap gap-2">
                  {results.churn.root_causes.map((c, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-brand-purple">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {results.retention && (
            <motion.div
              key="retention-result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 p-5 rounded-xl bg-white/[0.03] border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-brand-blue">Recommended Intervention</h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-blue-300 font-semibold">
                    {results.retention.intervention_type}
                  </span>
                  {results.retention.priority && (
                    <span className="text-text-muted">
                      Priority: <strong className="text-white">{results.retention.priority}</strong>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm mb-2">
                <strong>Offer:</strong> {results.retention.offer_details}
              </div>
              {results.retention.rationale && (
                <p className="text-xs text-text-muted leading-relaxed">{results.retention.rationale}</p>
              )}
            </motion.div>
          )}

          {results.communication && (
            <motion.div
              key="comm-result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-5 rounded-xl bg-white/[0.03] border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-300">Draft Message</h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 font-semibold">
                    {results.communication.channel || 'WhatsApp'}
                  </span>
                  <span className="text-text-muted">{results.communication.language}</span>
                  <button
                    onClick={copyMessage}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div
                className="p-4 rounded-2xl bg-green-500/[0.05] border border-green-500/20 max-w-2xl text-sm leading-relaxed"
                dir={isArabic(results.communication.message) ? 'rtl' : 'ltr'}
              >
                {results.communication.message}
              </div>
              {results.communication.tone_notes && (
                <p className="text-xs text-text-muted mt-3 italic">
                  Tone: {results.communication.tone_notes}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!anyDone && (
          <div className="text-center py-8 text-sm text-text-muted">
            Click <strong className="text-white">Generate AI Analysis</strong> to run the 3-agent pipeline for this customer.
          </div>
        )}
      </div>
    </GlassCard>
  )
}
