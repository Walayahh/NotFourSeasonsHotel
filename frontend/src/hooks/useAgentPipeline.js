import { useState, useCallback } from 'react'
import { api } from '../utils/api.js'

// Agent pipeline state machine — runs 3 sequential endpoints,
// each stays under Vercel Hobby's 10s function timeout.
//
// states per stage: 'pending' | 'running' | 'done' | 'error'
//
// Public API:
//   const { run, reset, stages, results, isRunning, error } = useAgentPipeline(customerId)
//   await run()  // resolves to { churn, retention, communication } or throws

const INITIAL = {
  churn:         { state: 'pending' },
  retention:     { state: 'pending' },
  communication: { state: 'pending' }
}

export default function useAgentPipeline(customerId) {
  const [stages, setStages] = useState(INITIAL)
  const [results, setResults] = useState({ churn: null, retention: null, communication: null })
  const [error, setError] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const setStage = (key, patch) =>
    setStages(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))

  const reset = useCallback(() => {
    setStages(INITIAL)
    setResults({ churn: null, retention: null, communication: null })
    setError(null)
    setIsRunning(false)
  }, [])

  const run = useCallback(async () => {
    if (!customerId || isRunning) return
    setIsRunning(true)
    setError(null)
    setStages(INITIAL)

    try {
      setStage('churn', { state: 'running', startedAt: Date.now() })
      const r1 = await api.analyzeChurn(customerId)
      const churn = r1.churn_analysis
      setStage('churn', { state: 'done', finishedAt: Date.now() })
      setResults(prev => ({ ...prev, churn }))

      setStage('retention', { state: 'running', startedAt: Date.now() })
      const r2 = await api.analyzeRetention(customerId, churn)
      const retention = r2.retention_recommendation
      setStage('retention', { state: 'done', finishedAt: Date.now() })
      setResults(prev => ({ ...prev, retention }))

      setStage('communication', { state: 'running', startedAt: Date.now() })
      const r3 = await api.analyzeCommunication(customerId, churn, retention)
      const communication = r3.communication_draft
      setStage('communication', { state: 'done', finishedAt: Date.now() })
      setResults(prev => ({ ...prev, communication }))

      return { churn, retention, communication }
    } catch (e) {
      setError(e.message)
      setStages(prev => {
        const next = { ...prev }
        for (const k of Object.keys(next)) {
          if (next[k].state === 'running') next[k] = { ...next[k], state: 'error' }
        }
        return next
      })
      throw e
    } finally {
      setIsRunning(false)
    }
  }, [customerId, isRunning])

  return { run, reset, stages, results, isRunning, error }
}
