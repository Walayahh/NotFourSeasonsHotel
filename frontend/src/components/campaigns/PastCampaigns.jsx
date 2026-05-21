import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { fmtJOD, fmtDate } from '../../utils/format.js'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const tip = {
  contentStyle: { background: '#15171f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }
}

export default function PastCampaigns() {
  const [list, setList] = useState(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    api.campaignsList(30).then(r => setList(r.campaigns))
    api.campaignSummary().then(setSummary)
  }, [])

  if (!list || !summary) return <div className="text-text-muted text-sm">Loading…</div>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <div className="glass p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Campaigns run</div>
          <div className="text-2xl font-bold mt-1">{summary.total_campaigns?.toLocaleString()}</div>
        </div>
        <div className="glass p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Messages sent</div>
          <div className="text-2xl font-bold mt-1">{summary.total_sent?.toLocaleString()}</div>
        </div>
        <div className="glass p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Conversions</div>
          <div className="text-2xl font-bold mt-1" style={{ color: '#22C55E' }}>{summary.total_converted?.toLocaleString()}</div>
        </div>
        <div className="glass p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Revenue generated</div>
          <div className="text-2xl font-bold mt-1" style={{ color: '#F59E0B' }}>{fmtJOD(summary.total_revenue_jod)}</div>
        </div>
      </div>

      <div className="glass p-5">
        <div className="text-sm font-bold mb-3">Conversion rate by channel</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={summary.by_channel}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="channel" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...tip} />
              <Bar dataKey="conversion_rate_pct" radius={[6, 6, 0, 0]}>
                {summary.by_channel.map((_, i) => (
                  <Cell key={i} fill={['#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <div className="text-sm font-bold">Campaigns</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted border-b border-white/5">
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Sent</th>
              <th className="px-4 py-3 text-right">Response</th>
              <th className="px-4 py-3 text-right">Conversion</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.campaign_id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium">{c.campaign_name}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{c.campaign_type}</td>
                <td className="px-4 py-3 text-xs">{c.channel}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{fmtDate(c.start_date)} → {fmtDate(c.end_date)}</td>
                <td className="px-4 py-3 text-right font-mono">{c.sent}</td>
                <td className="px-4 py-3 text-right font-mono">{c.response_rate_pct}%</td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: c.conversion_rate_pct >= 10 ? '#22C55E' : '#94A3B8' }}>
                  {c.conversion_rate_pct}%
                </td>
                <td className="px-4 py-3 text-right font-mono">{fmtJOD(c.revenue_jod)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
