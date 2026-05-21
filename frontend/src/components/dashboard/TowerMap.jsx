import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import GlassCard from '../shared/GlassCard.jsx'
import { severityColor } from '../../utils/format.js'

const CITY_COORDINATES = {
  ajloun: [32.3338, 35.7517],
  amman: [31.9539, 35.9106],
  aqaba: [29.5321, 35.0063],
  irbid: [32.5556, 35.8500],
  jerash: [32.2747, 35.8961],
  karak: [31.1853, 35.7048],
  "ma'an": [30.1920, 35.7360],
  madaba: [31.7190, 35.7939],
  mafraq: [32.3429, 36.2080],
  salt: [32.0392, 35.7272],
  tafileh: [30.8375, 35.6044],
  zarqa: [32.0728, 36.0880]
}

const JORDAN_BORDER = [
  [33.3747, 38.7930],
  [32.9537, 39.3012],
  [32.3118, 39.1955],
  [31.6768, 37.6830],
  [30.5085, 37.5036],
  [30.0007, 36.7405],
  [29.1975, 36.0686],
  [29.1855, 34.9594],
  [30.0213, 35.1760],
  [31.3670, 35.5534],
  [32.4056, 35.5725],
  [33.0975, 35.6150],
  [33.3747, 38.7930]
]

const normalizeCity = (city = '') => city.trim().toLowerCase()

const towerSortValue = (tower) => {
  const id = String(tower.tower_id ?? tower.tower_name ?? '')
  const numeric = Number(id.replace(/\D/g, ''))
  return Number.isFinite(numeric) ? numeric : id
}

const seededRandom = (seed) => {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return () => {
    hash += 0x6D2B79F5
    let t = hash
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const isInsideJordan = ([lat, lon]) => {
  let inside = false

  for (let i = 0, j = JORDAN_BORDER.length - 1; i < JORDAN_BORDER.length; j = i++) {
    const [latI, lonI] = JORDAN_BORDER[i]
    const [latJ, lonJ] = JORDAN_BORDER[j]
    const intersects = ((lonI > lon) !== (lonJ > lon)) &&
      (lat < ((latJ - latI) * (lon - lonI)) / (lonJ - lonI) + latI)

    if (intersects) inside = !inside
  }

  return inside
}

const coordinateAtOffset = ([baseLat, baseLon], angle, radiusKm) => {
  const latOffset = (Math.cos(angle) * radiusKm) / 111
  const lonOffset = (Math.sin(angle) * radiusKm) / (111 * Math.cos(baseLat * Math.PI / 180))

  return [baseLat + latOffset, baseLon + lonOffset]
}

const keepInsideJordan = (baseCoordinate, angle, radiusKm) => {
  for (let distance = radiusKm; distance >= 0.25; distance -= 0.25) {
    const candidate = coordinateAtOffset(baseCoordinate, angle, distance)
    if (isInsideJordan(candidate)) return candidate
  }

  return baseCoordinate
}

const getRandomSpreadCoordinate = (cityCenter, tower, cityKey, index, total) => {
  if (total <= 1) return cityCenter

  const random = seededRandom(`${cityKey}:${tower.tower_id}:${tower.tower_name}:${index}`)
  const maxRadiusKm = Math.min(13, 4.5 + Math.sqrt(total) * 1.6)

  for (let attempt = 0; attempt < 12; attempt++) {
    const angle = random() * Math.PI * 2
    const radiusKm = (0.35 + Math.sqrt(random()) * 0.65) * maxRadiusKm
    const candidate = coordinateAtOffset(cityCenter, angle, radiusKm)

    if (isInsideJordan(candidate)) return candidate
  }

  return keepInsideJordan(cityCenter, random() * Math.PI * 2, maxRadiusKm)
}

const getDisplayTowers = (towers) => {
  const cityCounts = towers.reduce((counts, tower) => {
    const key = normalizeCity(tower.city)
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})

  const cityIndexes = {}
  return [...towers]
    .sort((a, b) => {
      const cityCompare = normalizeCity(a.city).localeCompare(normalizeCity(b.city))
      if (cityCompare !== 0) return cityCompare
      const aSort = towerSortValue(a)
      const bSort = towerSortValue(b)
      return typeof aSort === 'number' && typeof bSort === 'number'
        ? aSort - bSort
        : String(aSort).localeCompare(String(bSort))
    })
    .map((tower) => {
      const cityKey = normalizeCity(tower.city)
      const cityCenter = CITY_COORDINATES[cityKey]
      const sourceLat = Number(tower.lat)
      const sourceLon = Number(tower.lon)

      if (!cityCenter) {
        return {
          ...tower,
          displayLat: sourceLat,
          displayLon: sourceLon
        }
      }

      const cityIndex = cityIndexes[cityKey] || 0
      cityIndexes[cityKey] = cityIndex + 1
      const [displayLat, displayLon] = getRandomSpreadCoordinate(
        cityCenter,
        tower,
        cityKey,
        cityIndex,
        cityCounts[cityKey]
      )

      return {
        ...tower,
        displayLat,
        displayLon
      }
    })
}

export default function TowerMap({ towers = [] }) {
  const jordanCenter = [31.7, 35.9]
  const displayTowers = getDisplayTowers(towers)

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
          {displayTowers.map(t => {
            const lat = Number(t.displayLat), lon = Number(t.displayLon)
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
