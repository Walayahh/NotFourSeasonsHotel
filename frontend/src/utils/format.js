export const fmtJOD = (v) =>
  v == null ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })} JOD`

export const fmtNumber = (v, opts = {}) =>
  v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 1, ...opts })

export const fmtDate = (s) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return s
  }
}

export const fmtDateTime = (s) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return s
  }
}

export const riskColor = (level) => {
  const map = {
    High: '#EF4444',
    Medium: '#EAB308',
    Low: '#22C55E',
    Critical: '#EF4444' // legacy guard
  }
  return map[level] || '#64748B'
}

export const severityColor = (sev) => {
  const map = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#EAB308',
    Low: '#22C55E'
  }
  return map[sev] || '#64748B'
}

export const initials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

export const isArabic = (s) => /[؀-ۿ]/.test(s || '')
