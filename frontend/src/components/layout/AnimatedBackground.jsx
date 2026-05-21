export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="absolute rounded-full blur-3xl opacity-60 animate-orb-float-1"
        style={{
          width: 600, height: 600,
          top: -180, left: -200,
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)'
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-60 animate-orb-float-2"
        style={{
          width: 700, height: 700,
          bottom: -200, right: -200,
          background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)'
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-40 animate-orb-float-3"
        style={{
          width: 500, height: 500,
          top: '40%', left: '40%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)'
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(10,11,15,0.85) 0%, rgba(10,11,15,0.6) 50%, rgba(10,11,15,0.95) 100%)'
        }}
      />
    </div>
  )
}
