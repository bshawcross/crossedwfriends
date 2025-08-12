'use client'

import { useEffect, useState } from 'react'
import { loadDemoFromFile, Puzzle, Cell } from '@/lib/puzzle'
import { yyyyMmDd } from '@/utils/date'

export default function usePuzzle() {
  const [demo, setDemo] = useState<boolean | null>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [cells, setCells] = useState<Cell[]>([])
  const [seed, setSeed] = useState(() => yyyyMmDd(new Date(), 'America/Los_Angeles'))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setDemo(params.get('demo') === '1')
  }, [])

  useEffect(() => {
    if (demo === null) return
    ;(async () => {
      if (demo) {
        try {
          const p = await loadDemoFromFile()
          setPuzzle(p)
          setCells(p.cells)
          return
        } catch {}
      }
      try {
        const res = await fetch(`/api/puzzle/${seed}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const p: Puzzle = await res.json()
        if (!Array.isArray((p as any)?.cells)) throw new Error('Missing cells')
        setPuzzle(p)
        setCells(p.cells)
      } catch (err) {
        console.error('Failed to load puzzle', err)
        setPuzzle(null)
        setCells([])
      }
    })()
  }, [demo, seed])

  useEffect(() => {
    const interval = setInterval(() => {
      const next = yyyyMmDd(new Date(), 'America/Los_Angeles')
      if (!demo && next !== seed) {
        setSeed(next)
        setPuzzle(null)
        setCells([])
      }
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [demo, seed])

  return { puzzle, cells, setCells }
}

