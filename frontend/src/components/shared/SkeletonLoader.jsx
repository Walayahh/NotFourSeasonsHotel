export default function SkeletonLoader({ className = '', lines = 3 }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-white/5 animate-pulse"
          style={{ width: `${70 + (i * 13) % 25}%` }}
        />
      ))}
    </div>
  )
}
