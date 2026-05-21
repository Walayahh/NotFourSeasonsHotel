import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import GlassCard from '../shared/GlassCard.jsx'
import { severityColor } from '../../utils/format.js'

export default function TowerMap({ towers = [] }) {
  const jordanCenter = [31.7, 36.0]
  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Network Tower Status
        </h3>
        <div className="flex gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />Critical</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#F97316' }} />High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#EAB308' }} />Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />Low</span>
        </div>
      </div>
      <div style={{ height: 360 }} className="rounded-2xl overflow-hidden">
        <MapContainer center={jordanCenter} zoom={7} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          {towers.map(t => {
            const lat = Number(t.lat), lon = Number(t.lon)
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
            const sev = t.last_severity || 'Low'
            const color = severityColor(sev)
            const isRecent = t.recent_event_count > 0
            return (
              <CircleMarker
                key={t.tower_id}
                center={[lat, lon]}
                radius={isRecent ? 7 : 4}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isRecent ? 0.85 : 0.55,
                  weight: isRecent ? 2 : 1
                }}
              >
                <Popup>
                  <div>
                    <div className="font-semibold">{t.tower_name}</div>
                    <div className="text-xs opacity-80">{t.city} · {t.technology}</div>
                    <div className="mt-2 text-xs">
                      <div>Last severity: <strong style={{ color }}>{sev}</strong></div>
                      <div>Recent events (14d): {t.recent_event_count}</div>
                      <div>Capacity: {t.capacity_level}</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </GlassCard>
  )
}
