'use client'

import Header from '@/components/Header'
import Grid from '@/components/Grid'
import ClueBar from '@/components/ClueBar'
import ClueList from '@/components/ClueList'
import { generateDaily } from '@/lib/puzzle'
import { loadDemoFromFile } from '@/lib/puzzle'
import { yyyyMmDd } from '@/utils/date'
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

  const gridOuterRef = useRef<HTMLDivElement>(null)
  const gridInnerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setDemo(params.get('demo') === '1')
  }, [])

  useEffect(() => {
    if (demo === null) return
    (async () => {
      if (demo) {
        try {
          const p = await loadDemoFromFile()
          setPuzzle(p); setCells(p.cells); return
        } catch {}
      }
      const seed = yyyyMmDd(new Date(), 'America/Los_Angeles')
      const p = generateDaily(seed)
      setPuzzle(p); setCells(p.cells)
    })()
  }, [demo])

// Detect keyboard + compute scale-to-fit
useEffect(() => {
  const vv = (window as any).visualViewport
  if (!vv) return
  const onResize = () => {
    const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
    setKbOpen(inset > 0)

    requestAnimationFrame(() => {
      const inner = gridInnerRef.current
      if (!inner) return
      const naturalHeight = inner.offsetHeight
      // while keyboard is up, we hide clue lists; available is viewport - clue bar
      const available = vv.height - clueBarH - 12
      // only scale when keyboard is open; clamp so it never gets tiny
      const s = !inset ? 1 : Math.max(0.85, Math.min(1, available / naturalHeight))
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

  useEffect(() => {
    const inner = gridInnerRef.current
    const vv = (window as any).visualViewport
    if (!inner || !vv) return
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
  // ----- render -----
<main className="pb-28" style={{ paddingBottom: clueBarH + 16 }}>
  {!kbOpen && (
    <Header title={puzzle.title ?? 'Today'} subtitle={puzzle.theme ?? ''} />
  )}

  {/* Centered, full-width wrapper. Only scaled when kbOpen is true */}
  <div
    ref={gridOuterRef}
    style={{
      transform: kbOpen ? `scale(${scale})` : 'none',
      transformOrigin: 'top center',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    }}
  >
    <div ref={gridInnerRef} style={{ display: 'inline-block', width: '100%' }}>
      <Grid
        cells={cells}
        setCells={setCells}
        onActiveChange={setActive}
        jump={jump}
        kbOpen={kbOpen}
      />
    </div>
  </div>

  {/* Hide clue lists while typing to keep the grid big */}
  {!kbOpen && (
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
  )}

  <ClueBar text={clueText} onHeightChange={setClueBarH} />
</main>
  )
}

