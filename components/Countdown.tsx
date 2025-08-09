'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { msUntilNextPuzzle } from '@/utils/date'

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function Countdown() {
  const router = useRouter()
  const [remaining, setRemaining] = useState(msUntilNextPuzzle())

  useEffect(() => {
    const target = Date.now() + msUntilNextPuzzle()
    const tick = () => {
      const ms = target - Date.now()
      if (ms <= 0) {
        setRemaining(0)
        clearInterval(id)
        try { router.refresh() } catch {}
      } else {
        setRemaining(ms)
      }
    }
    const id = setInterval(tick, 1000)
    tick()
    return () => clearInterval(id)
  }, [router])

  return (
    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{format(remaining)}</span>
  )
}
