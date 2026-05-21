import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../utils/api.js'
import TopFilterBar from '../components/search/TopFilterBar.jsx'
import ActiveFilterChips from '../components/search/ActiveFilterChips.jsx'
import AudienceSnapshot from '../components/campaigns/AudienceSnapshot.jsx'
import DraftPreview from '../components/campaigns/DraftPreview.jsx'
import PastCampaigns from '../components/campaigns/PastCampaigns.jsx'
import Hero from '../components/shared/Hero.jsx'

// Fully empty defaults — when opening Campaign Studio directly the user starts
// with a clean slate. An audience only pre-populates when arriving from the
// Advanced Search "Use as Campaign Audience →" flow (via location.state).
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
  sort: 'churn_desc', limit: 50, offset: 0
}

function getInitialFilters(locationState) {
  // 1. Preferred path: React Router location.state (survives StrictMode double-mount)
  if (locationState?.audienceFilters) {
    return { handoff: true, filters: locationState.audienceFilters }
  }
  // 2. Fallback: sessionStorage (covers hard reload of /campaigns or older flow)
  try {
    const stored = sessionStorage.getItem('campaign_audience_filters')
    if (stored) {
      return { handoff: true, filters: JSON.parse(stored) }
    }
  } catch { /* fall through */ }
  return { handoff: false, filters: DEFAULT_FILTERS }
}

export default function CampaignStudio() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('compose')
  const [facets, setFacets] = useState(null)
  const [{ handoff: didHandoff, filters: initialFilters }] = useState(() =>
    getInitialFilters(location.state)
  )
  const [filters, setFilters] = useState(initialFilters)
  const [handoffBanner, setHandoffBanner] = useState(didHandoff)

  // Clear the sessionStorage fallback once we've consumed it, so a later manual
  // visit to /campaigns starts fresh rather than reapplying stale filters.
  useEffect(() => {
    if (didHandoff) {
      sessionStorage.removeItem('campaign_audience_filters')
      // Also clear location.state so a refresh of /campaigns doesn't keep
      // re-importing the same audience.
      navigate('/campaigns', { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [preview, setPreview] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [objective, setObjective] = useState('Reduce churn risk by offering targeted value.')
  const [draft, setDraft] = useState(null)
  const [drafting, setDrafting] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    api.filterFacets().then(setFacets).catch(e => setErr(e.message))
  }, [])

  useEffect(() => {
    if (!facets || tab !== 'compose') return
    setPreviewing(true)
    const t = setTimeout(() => {
      api.audiencePreview(filters)
        .then(setPreview)
        .catch(e => setErr(e.message))
        .finally(() => setPreviewing(false))
    }, 300)
    return () => clearTimeout(t)
  }, [filters, facets, tab])

  useEffect(() => {
    if (!handoffBanner) return
    const t = setTimeout(() => setHandoffBanner(false), 4500)
    return () => clearTimeout(t)
  }, [handoffBanner])

  const draftIt = async () => {
    if (!preview || preview.size === 0) return
    setDrafting(true); setLaunched(null); setDraft(null); setErr(null)
    try {
      const r = await api.draftCampaign(filters, objective)
      setDraft(r)
    } catch (e) {
      setErr(e.message)
    } finally {
      setDrafting(false)
    }
  }

  const launch = async () => {
    if (!draft) return
    setLaunching(true)
    try {
      const r = await api.launchCampaign(filters, draft.draft, draft.projection)
      setLaunched(r)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLaunching(false)
    }
  }

  const tabSwitcher = (
    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
      {[
        { k: 'compose', label: 'Compose' },
        { k: 'past', label: 'Past Campaigns' }
      ].map(t => (
        <button
          key={t.k}
          onClick={() => setTab(t.k)}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            tab === t.k
              ? 'bg-brand-purple/30 text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)]'
              : 'text-text-muted hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="page-enter">
      <Hero
        kicker="Outreach Lab"
        title="Campaign Studio"
        description="Define an audience, let the AI draft the offer + AR/EN message, project the impact, and launch."
        status={drafting ? 'Drafting…' : (launched ? 'Launched' : (previewing ? 'Loading…' : 'Ready'))}
        action={tabSwitcher}
      />

      {handoffBanner && tab === 'compose' && (
        <div
          className="mb-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple/25 to-brand-blue/15 border border-brand-purple/40 flex items-center justify-between"
          style={{ animation: 'dropdown-in 0.4s ease-out' }}
        >
          <div className="text-sm">
            <span className="font-semibold">✓ Audience imported from Advanced Search.</span>
            <span className="text-text-muted ml-2">Filters and customer list applied below.</span>
          </div>
          <button
            onClick={() => setHandoffBanner(false)}
            className="text-text-muted hover:text-white text-lg leading-none"
            aria-label="dismiss"
          >×</button>
        </div>
      )}

      {err && <div className="text-risk-high mb-4 text-sm">Error: {err}</div>}

      {tab === 'past' ? (
        <PastCampaigns />
      ) : (
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

          <div className="grid grid-cols-[1fr_1fr] gap-5 items-start">
            <AudienceSnapshot preview={preview} />

            <div className="glass p-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                Campaign objective (guides the AI)
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                placeholder="e.g. Reduce churn in VIP segment with priority support + loyalty bonus"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="text-[11px] text-text-muted">
                  {preview ? `${preview.size.toLocaleString()} customers in audience` : 'Loading audience…'}
                </div>
                <button
                  onClick={draftIt}
                  disabled={!preview?.size || drafting}
                  className="btn-gradient px-5 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-50"
                  style={{
                    background: drafting ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                    boxShadow: drafting ? 'none' : '0 4px 16px rgba(139,92,246,0.4)'
                  }}
                >
                  {drafting ? 'Drafting…' : '✨ Draft with AI'}
                </button>
              </div>
            </div>
          </div>

          <DraftPreview
            result={draft}
            drafting={drafting}
            onLaunch={launch}
            onRegenerate={draftIt}
            launching={launching}
            launched={launched}
          />
        </div>
      )}
    </div>
  )
}
