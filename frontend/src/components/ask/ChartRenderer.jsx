import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  ScatterChart, Scatter
} from 'recharts'

const PALETTE = ['#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#10B981']

const tip = {
  contentStyle: {
    background: '#15171f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontSize: 12
  }
}

function pickFields(chart, columns) {
  const x = chart?.x_field && columns.includes(chart.x_field) ? chart.x_field : columns[0]
  const y = chart?.y_field && columns.includes(chart.y_field)
    ? chart.y_field
    : (columns.find(c => c !== x) || columns[1] || columns[0])
  const label = chart?.label_field && columns.includes(chart.label_field) ? chart.label_field : x
  return { x, y, label }
}

function TableView({ columns, rows }) {
  if (!rows?.length) return <div className="text-xs text-text-muted">No rows.</div>
  return (
    <div className="overflow-auto max-h-[420px] rounded-lg border border-white/5">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-bg-card">
          <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted border-b border-white/5">
            {columns.map(c => <th key={c} className="px-3 py-2 whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
              {columns.map(c => (
                <td key={c} className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                  {r[c] == null ? '—' : typeof r[c] === 'number' ? Number(r[c]).toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KPIView({ rows, columns }) {
  const r = rows?.[0]
  if (!r) return <div className="text-xs text-text-muted">No data.</div>
  return (
    <div className="grid grid-cols-2 gap-3">
      {columns.map((c, i) => (
        <div
          key={c}
          className="rounded-xl p-4 border"
          style={{ background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}15, transparent)`, borderColor: `${PALETTE[i % PALETTE.length]}30` }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{c}</div>
          <div className="text-3xl font-bold mt-1" style={{ color: PALETTE[i % PALETTE.length] }}>
            {r[c] == null ? '—' : typeof r[c] === 'number' ? Number(r[c]).toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(r[c])}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ChartRenderer({ chart, columns, rows }) {
  if (!rows?.length) return <div className="text-xs text-text-muted">No rows returned.</div>

  const type = chart?.type || 'table'
  const title = chart?.title

  if (type === 'table') return <TableView columns={columns} rows={rows} />
  if (type === 'kpi')   return <KPIView columns={columns} rows={rows} />

  const { x, y, label } = pickFields(chart, columns)

  const chartBody = (() => {
    if (type === 'bar') {
      return (
        <BarChart data={rows}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={x} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} angle={-15} height={50} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...tip} />
          <Bar dataKey={y} radius={[6, 6, 0, 0]}>
            {rows.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      )
    }
    if (type === 'line') {
      return (
        <LineChart data={rows}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={x} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...tip} />
          <Line type="monotone" dataKey={y} stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3, fill: '#8B5CF6' }} activeDot={{ r: 5 }} />
        </LineChart>
      )
    }
    if (type === 'pie') {
      const pieData = rows.map((r, i) => ({ name: String(r[label]), value: Number(r[y]) || 0, color: PALETTE[i % PALETTE.length] }))
      return (
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {pieData.map(d => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip {...tip} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
        </PieChart>
      )
    }
    if (type === 'scatter') {
      return (
        <ScatterChart>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={x} type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis dataKey={y} type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...tip} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={rows} fill="#8B5CF6" />
        </ScatterChart>
      )
    }
    return null
  })()

  if (!chartBody) return <TableView columns={columns} rows={rows} />

  return (
    <div>
      {title && <div className="text-sm font-semibold mb-2">{title}</div>}
      <div style={{ height: 280 }}>
        <ResponsiveContainer>{chartBody}</ResponsiveContainer>
      </div>
    </div>
  )
}
