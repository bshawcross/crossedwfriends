'use client'

import Header from '@/components/Header'
import Grid from '@/components/Grid'
import ClueBar from '@/components/ClueBar'
import ClueList from '@/components/ClueList'
import usePuzzle from '@/hooks/usePuzzle'
import useKeyboardViewport from '@/hooks/useKeyboardViewport'
import { GRID_SIZE } from '@/utils/grid'
import { useMemo, useState, useRef, useEffect } from 'react'

export default function Page() {
  const { puzzle, cells, setCells } = usePuzzle()
  const [active, setActive] = useState<{ number: number | null; dir: 'across' | 'down' }>({ number: null, dir: 'across' })
  const [jump, setJump] = useState<{ number: number; dir: 'across' | 'down'; nonce: number } | undefined>()
  const [clueBarH, setClueBarH] = useState(0)

  const gridOuterRef = useRef<HTMLDivElement>(null)
  const gridInnerRef = useRef<HTMLDivElement>(null)

  const { kbOpen, scale } = useKeyboardViewport(gridInnerRef, clueBarH, active)

  useEffect(() => {
    if (!puzzle) {
      setActive({ number: null, dir: 'across' })
      setJump(undefined)
    }
  }, [puzzle])

  const clueText = useMemo(() => {
    if (!puzzle || !active.number) return ''
    const list = active.dir === 'across' ? puzzle.across : puzzle.down
    const c = list?.find((x: any) => x.number === active.number)
    return c ? `${active.dir.toUpperCase()} ${c.number}: ${c.text}` : ''
  }, [active, puzzle])

  function handleClueTap(dir: 'across' | 'down', number: number) {
    setJump({ number, dir, nonce: Date.now() })
  }

  if (!puzzle || (puzzle as any).error || cells.length !== GRID_SIZE * GRID_SIZE) {
    return (
      <main className="pb-28">
        <Header title="Puzzle not found" subtitle="" />
        <div className="p-4 text-sm text-gray-500">Puzzle not found</div>
      </main>
    )
  }

  return (
    <main className="pb-28" style={{ paddingBottom: clueBarH + 16 }}>
      {!kbOpen && (
        <Header title={puzzle.title ?? 'Today'} subtitle={puzzle.theme ?? ''} />
      )}

      <div ref={gridOuterRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
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

