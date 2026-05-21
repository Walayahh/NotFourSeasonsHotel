export default function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple typing-dot" style={{ animationDelay: '0s' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple typing-dot" style={{ animationDelay: '0.15s' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple typing-dot" style={{ animationDelay: '0.3s' }} />
    </div>
  )
}
