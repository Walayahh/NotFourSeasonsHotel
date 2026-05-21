import { useEffect, useState } from 'react'

export default function useCountUp(target, durationMs = 1400) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (target == null) return
    const start = performance.now()
    const from = 0
    const to = Number(target)
    let frame

    const step = (t) => {
      const p = Math.min(1, (t - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic
      setVal(from + (to - from) * eased)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return val
}
