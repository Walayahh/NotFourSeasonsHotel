export default function LoadingDots({ label }) {
  return (
    <div className="inline-flex items-center gap-2 text-text-muted text-xs">
      {label && <span>{label}</span>}
      <span className="loading-dots"><span></span><span></span><span></span></span>
    </div>
  )
}
