import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../utils/api.js'
import RiskBadge from '../shared/RiskBadge.jsx'

export default function CustomerListPanel() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = { limit: 50 }
    if (search) params.search = search
    if (risk) params.risk = risk
    api.customers(params)
      .then(r => setCustomers(r.customers))
      .finally(() => setLoading(false))
  }, [search, risk])

  return (
    <div className="glass p-4 sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Customers
      </h4>
      <input
        type="text"
        placeholder="Search name or ID…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 mb-2 text-sm rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-brand-purple/50"
      />
      <div className="flex gap-1 mb-3">
        {['', 'High', 'Medium', 'Low'].map(r => (
          <button
            key={r || 'all'}
            onClick={() => setRisk(r)}
            className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
              risk === r
                ? 'border-brand-purple bg-brand-purple/15 text-white'
                : 'border-white/10 text-text-muted hover:bg-white/5'
            }`}
          >
            {r || 'All'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 pr-2">
        {loading && <div className="text-xs text-text-muted p-2">Loading…</div>}
        {customers.map(c => {
          const active = Number(customerId) === c.customer_id
          return (
            <button
              key={c.customer_id}
              onClick={() => navigate(`/twin/${c.customer_id}`)}
              className={`w-full text-left px-3 py-2 mb-1 rounded-lg transition-all ${
                active ? 'bg-brand-purple/15 border border-brand-purple/40' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{c.full_name}</div>
                <RiskBadge level={c.risk_level} />
              </div>
              <div className="text-xs text-text-muted truncate">
                {c.city} · {c.customer_segment}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
