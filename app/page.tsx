'use client'

import Header from '@/components/Header'
import Grid from '@/components/Grid'
import ClueBar from '@/components/ClueBar'
import ClueList from '@/components/ClueList'
import { loadDemoFromFile } from '@/lib/puzzle'
import { yyyyMmDd } from '@/utils/date'
import { KEYBOARD_INSET_THRESHOLD } from '@/utils/constants'
import { useMemo, useState, useEffect, useRef } from 'react'

export default function Page() {
  const [demo, setDemo] = useState<boolean | null>(null)
  const [puzzle, setPuzzle] = useState<any | null>(null)
  const [cells, setCells] = useState<any[]>([])
  const [active, setActive] = useState<{ number: number | null, dir: 'across' | 'down' }>({ number: null, dir: 'across' })
  const [jump, setJump] = useState<{ number: number, dir: 'across' | 'down', nonce: number } | undefined>()
  const [clueBarH, setClueBarH] = useState(0)
  const [kbOpen, setKbOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [seed, setSeed] = useState(() => yyyyMmDd(new Date(), 'America/Los_Angeles'))

  const gridOuterRef = useRef<HTMLDivElement>(null)
  const gridInnerRef = useRef<HTMLDivElement>(null) // for measuring natural height

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setDemo(params.get('demo') === '1')
  }, [])

  useEffect(() => {
    if (demo === null) return
    ; (async () => {
      if (demo) {
        try {
          const p = await loadDemoFromFile()
          setPuzzle(p); setCells(p.cells); return
        } catch { }
      }
      const res = await fetch(`/api/puzzle/${seed}`)
      const p = await res.json()
      setPuzzle(p); setCells(p.cells)
    })()
  }, [demo, seed])

  useEffect(() => {
    const interval = setInterval(() => {
      const next = yyyyMmDd(new Date(), 'America/Los_Angeles')
      if (!demo && next !== seed) {
        setSeed(next)
        setPuzzle(null)
        setCells([])
        setActive({ number: null, dir: 'across' })
        setJump(undefined)
      }
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [demo, seed])

  // Detect keyboard via VisualViewport inset
  useEffect(() => {
    const vv = (window as any).visualViewport
    if (!vv) return
    const onResize = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      const isKeyboard = inset > KEYBOARD_INSET_THRESHOLD
      setKbOpen(isKeyboard)
      // recompute scale on each change
      requestAnimationFrame(() => {
        const inner = gridInnerRef.current
        if (!inner) return
        const naturalHeight = inner.offsetHeight // unscaled height of the grid
        // available height inside viewport
        const available = vv.height - clueBarH - 12 /* breathing room */
        const s = Math.min(1, Math.max(0.6, available / naturalHeight)) // cap between 0.6 and 1
        setScale(s)
      })
    }
    onResize()
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onResize)
    }
  }, [clueBarH])

  // also recompute when active clue changes (grid height can wiggle very slightly)
  useEffect(() => {
    const inner = gridInnerRef.current
    if (!inner) return
    const vv = (window as any).visualViewport
    if (!vv) return
    const naturalHeight = inner.offsetHeight
    const available = vv.height - clueBarH - 12
    const s = Math.min(1, Math.max(0.6, available / naturalHeight))
    setScale(s)
  }, [clueBarH, active])

  const clueText = useMemo(() => {
    if (!puzzle || !active.number) return ''
    const list = active.dir === 'across' ? puzzle.across : puzzle.down
    const c = list?.find((x: any) => x.number === active.number)
    return c ? `${active.dir.toUpperCase()} ${c.number}: ${c.text}` : ''
  }, [active, puzzle])

  function handleClueTap(dir: 'across' | 'down', number: number) {
    setJump({ number, dir, nonce: Date.now() })
  }

  if (demo === null || !puzzle) {
    return (
      <main className="pb-28">
        <Header title="Loading…" subtitle="Fetching puzzle" />
        <div className="p-4 text-sm text-gray-500">One moment…</div>
      </main>
    )
  }

  return (
    <main className="pb-28" style={{ paddingBottom: clueBarH + 16 }}>
      {/* Hide header when keyboard is open to buy vertical room */}
      {!kbOpen && (
        <Header title={puzzle.title ?? 'Today'} subtitle={puzzle.theme ?? ''} />
      )}

      {/* Scale-to-fit wrapper */}
      <div ref={gridOuterRef}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div ref={gridInnerRef}>
          <Grid
            cells={cells}
            setCells={setCells}
            onActiveChange={setActive}
            jump={jump}
            kbOpen={kbOpen}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <ClueList
          title="Across"
          clues={puzzle.across ?? []}
          activeNumber={active.dir === 'across' ? active.number : null}
          onSelect={(n) => handleClueTap('across', n)}
        />
        <ClueList
          title="Down"
          clues={puzzle.down ?? []}
          activeNumber={active.dir === 'down' ? active.number : null}
          onSelect={(n) => handleClueTap('down', n)}
        />
      </div>

      <ClueBar text={clueText} onHeightChange={setClueBarH} />
    </main>
  )
}
