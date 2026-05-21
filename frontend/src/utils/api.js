const BASE = import.meta.env.VITE_API_BASE || ''

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  return res.json()
}

export const api = {
  // Dashboard
  kpis:               () => req('/api/dashboard/kpis'),
  churnByRegion:      () => req('/api/dashboard/churn_by_region?limit=8'),
  topRiskyCustomers:  (limit = 50) => req(`/api/dashboard/top_risky_customers?limit=${limit}`),
  complaintTrend:     () => req('/api/dashboard/complaint_trend?weeks=8'),

  // Customers
  customers:    (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req(`/api/customers${q ? '?' + q : ''}`)
  },
  customerProfile: (id) => req(`/api/customers/${id}/profile`),
  monthlyTrend:    (id) => req(`/api/customers/${id}/monthly_trend`),

  // Network
  towers: () => req('/api/network/towers'),
  events: (recent = true, limit = 20) =>
    req(`/api/network/events?recent=${recent}&limit=${limit}`),

  // Advanced search
  filterFacets:    () => req('/api/customers/filter_facets'),
  searchCustomers: (filters) => req('/api/customers/search', {
    method: 'POST', body: JSON.stringify(filters)
  }),
  searchAggregates: (filters) => req('/api/customers/search_aggregates', {
    method: 'POST', body: JSON.stringify(filters)
  }),

  // Campaigns
  campaignsList:    (limit = 30) => req(`/api/campaigns/list?limit=${limit}`),
  campaignSummary:  () => req('/api/campaigns/summary'),
  audiencePreview:  (filters) => req('/api/campaigns/audience_preview', {
    method: 'POST', body: JSON.stringify({ filters })
  }),
  draftCampaign:    (filters, objective) => req('/api/campaigns/draft', {
    method: 'POST', body: JSON.stringify({ filters, objective })
  }),
  launchCampaign:   (filters, draft, projection) => req('/api/campaigns/launch', {
    method: 'POST', body: JSON.stringify({ filters, draft, projection })
  }),

  // Ask Anything
  askAnything:      (question) => req('/api/ask', {
    method: 'POST', body: JSON.stringify({ question })
  }),
  askSuggestions:   () => req('/api/ask/suggestions'),

  // Agents
  activitySeed: (limit = 30) => req(`/api/agents/activity_seed?limit=${limit}`),
  analyzeChurn: (customerId) =>
    req('/api/agents/analyze/churn', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId })
    }),
  analyzeRetention: (customerId, churnAnalysis) =>
    req('/api/agents/analyze/retention', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, churn_analysis: churnAnalysis })
    }),
  analyzeCommunication: (customerId, churnAnalysis, retentionRec) =>
    req('/api/agents/analyze/communication', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        churn_analysis: churnAnalysis,
        retention_recommendation: retentionRec
      })
    })
}
