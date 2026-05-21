import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api.js'
import TopFilterBar from '../components/search/TopFilterBar.jsx'
import ActiveFilterChips from '../components/search/ActiveFilterChips.jsx'
import ResultsTable from '../components/search/ResultsTable.jsx'
import SingleSelectDropdown from '../components/search/SingleSelectDropdown.jsx'
import Pagination from '../components/search/Pagination.jsx'
import SearchAnalytics from '../components/search/SearchAnalytics.jsx'
import Hero from '../components/shared/Hero.jsx'
import { fmtJOD } from '../utils/format.js'

const DEFAULT_FILTERS = {
  text: '',
  governorates: [], cities: [],
  customer_segments: [], customer_types: [],
  age_groups: [], genders: [], languages: [], statuses: [],
  risk_levels: [], value_segments: [], main_risk_reasons: [],
  plan_categories: [], plan_technologies: [],
  churn_min: 0, churn_max: 1,
  arpu_min: null, arpu_max: null,
  has_open_complaints: false,
  signup_after: null, signup_before: null,
  sort: 'churn_desc',
  limit: 50, offset: 0
}

export default function AdvancedSearch() {
  const navigate = useNavigate()
  const [facets, setFacets] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [handedOff, setHandedOff] = useState(false)

  useEffect(() => {
    api.filterFacets().then(setFacets).catch((e) => setErr(e.message))
  }, [])

  // Reset offset to 0 whenever any filter changes that isn't offset itself —
  // otherwise you'd e.g. be sitting on page 7 of a search that only has 2 pages
  // after narrowing filters.
  const filterSig = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const { offset, ...rest } = filters
    return JSON.stringify(rest)
  }, [filters])
  const lastSigRef = useRef(filterSig)
  useEffect(() => {
    if (lastSigRef.current !== filterSig) {
      lastSigRef.current = filterSig
      if (filters.offset !== 0) {
        setFilters((p) => ({ ...p, offset: 0 }))
      }
    }
  }, [filterSig, filters.offset])

  useEffect(() => {
    if (!facets) return
    setLoading(true)
    const t = setTimeout(() => {
      api.searchCustomers(filters)
        .then(setResults)
        .catch((e) => setErr(e.message))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [filters, facets])

  const goToOffset = (newOffset) => {
    // Smooth scroll the results table into view so the user sees the new page
    setFilters((p) => ({ ...p, offset: newOffset }))
    requestAnimationFrame(() => {
      window.scrollTo({ top: Math.max(0, window.scrollY), behavior: 'smooth' })
    })
  }

  const exportCSV = () => {
    if (!results?.customers?.length) return
    const cols = ['customer_id','full_name','city','governorate','customer_segment','value_segment','risk_level','churn_score','arpu_jod','main_risk_reason','preferred_language','status']
    const header = cols.join(',')
    const rows = results.customers.map(c => cols.map(k => {
      const v = c[k]
      if (v == null) return ''
      const s = String(v).replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    }).join(','))
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zain-search-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendToCampaign = () => {
    // Use React Router location.state — survives StrictMode double-mount and is
    // immune to the sessionStorage drain race we hit before. Keep sessionStorage
    // as a redundant fallback for hard reloads of /campaigns.
    sessionStorage.setItem('campaign_audience_filters', JSON.stringify(filters))
    setHandedOff(true)
    setTimeout(() => {
      navigate('/campaigns', { state: { audienceFilters: filters, fromSearch: true } })
    }, 400)
  }

  const hasResults = results?.customers?.length > 0

  return (
    <div className="page-enter">
      <Hero
        kicker="Customer Workbench"
        title="Advanced Search"
        description="Slice every customer attribute, risk signal, and behavior. Click a row to open the twin."
        status={loading ? 'Searching…' : 'Live data'}
        action={results && (
          <div className="text-left sm:text-right sm:pr-4 sm:border-r border-white/10">
            <div className="text-2xl font-bold leading-none">{results.total.toLocaleString()}</div>
            <div className="text-[11px] text-text-muted mt-1">
              match · <span className="text-white font-semibold">{fmtJOD(results.total_arpu_jod)}</span> ARPU
            </div>
          </div>
        )}
      />

      {err && <div className="text-risk-high mb-4 text-sm">Error: {err}</div>}

      <div className="space-y-4">
        <TopFilterBar
          facets={facets}
          filters={filters}
          setFilters={setFilters}
        />

        <ActiveFilterChips
          filters={filters}
          setFilters={setFilters}
          onClearAll={() => setFilters(DEFAULT_FILTERS)}
        />

        <SearchAnalytics filters={filters} />

        <div className="glass p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-text-muted">
            {loading
              ? 'Searching…'
              : results
                ? `Showing ${results.customers.length} of ${results.total.toLocaleString()} customers`
                : 'Loading…'}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SingleSelectDropdown
              prefix="Sort:"
              value={filters.sort}
              options={facets?.sort_options || []}
              onChange={(v) => setFilters((p) => ({ ...p, sort: v }))}
              minWidth={220}
            />
            <SingleSelectDropdown
              prefix="Show:"
              value={filters.limit}
              options={[25, 50, 100, 200].map(n => ({ key: n, label: `${n} per page` }))}
              onChange={(v) => setFilters((p) => ({ ...p, limit: Number(v), offset: 0 }))}
              minWidth={150}
            />
            <button
              onClick={exportCSV}
              disabled={!hasResults}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
            >
              ⤓ Export CSV
            </button>
            <button
              onClick={sendToCampaign}
              disabled={!hasResults || handedOff}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white disabled:opacity-40 transition-all"
              style={{
                background: handedOff ? '#22C55E' : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                boxShadow: handedOff ? 'none' : '0 2px 12px rgba(139,92,246,0.35)'
              }}
            >
              {handedOff ? '✓ Sending…' : 'Use as Campaign Audience →'}
            </button>
          </div>
        </div>

        <ResultsTable
          customers={results?.customers}
          loading={loading && !results}
          pageKey={`p-${filters.offset}-${filters.limit}-${filters.sort}`}
        />

        {results && results.total > filters.limit && (
          <Pagination
            total={results.total}
            limit={filters.limit}
            offset={filters.offset}
            onChange={goToOffset}
          />
        )}
      </div>
    </div>
  )
}
