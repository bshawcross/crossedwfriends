'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { Cell } from '@/lib/puzzle'
import { coordsToIndex } from '@/lib/puzzle'

type Direction = 'across' | 'down'
const SIZE = 15

export default function Grid({
  cells, setCells, onActiveChange, jump, kbOpen
}: {
  cells: Cell[]
  setCells: (cells: Cell[]) => void
  onActiveChange?: (info:{number:number|null, dir:'across'|'down'}) => void
  jump?: { number:number, dir:'across'|'down', nonce:number }
  kbOpen?: boolean
}) {

  const [cursor, setCursor] = useState<{ row: number, col: number }>({ row: 0, col: 0 })
  const [dir, setDir] = useState<Direction>('across')
  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(SIZE * SIZE).fill(null))

  useEffect(() => {
    const first = cells.findIndex(c => !c.isBlack)
    if (first >= 0) setCursor({ row: Math.floor(first / SIZE), col: first % SIZE })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const idx = coordsToIndex(cursor.row, cursor.col, SIZE)
    const el = inputsRef.current[idx]
    if (el && !cells[idx].isBlack) {
      el.focus({ preventScroll: true })
      // ensure visible even when scaled & keyboard up
      setTimeout(() => {
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
      }, 0)
    }
  }, [cursor])


  const activeWord = useMemo(() => getWordCells(cells, cursor, dir), [cells, cursor, dir])
  const activeNumber = activeWord[0]?.clueNumber ?? null

  useEffect(() => {
    onActiveChange?.({ number: activeNumber, dir })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNumber, dir])

  useEffect(() => {
    if (!jump) return
    setDir(jump.dir)
    const headIdx = cells.findIndex(c => !c.isBlack && c.clueNumber === jump.number)
    if (headIdx >= 0) setCursor({ row: Math.floor(headIdx / SIZE), col: headIdx % SIZE })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump])

  function toggleDir() {
    setDir(d => d === 'across' ? 'down' : 'across')
  }
  const highlighted = useMemo(
    () => new Set(activeWord.map(c => `${c.row}_${c.col}`)),
    [activeWord]
  )
  function move(dr: number, dc: number) {
    let r = clamp(cursor.row + dr, 0, SIZE - 1)
    let c = clamp(cursor.col + dc, 0, SIZE - 1)
    let idx = coordsToIndex(r, c, SIZE)
    if (cells[idx].isBlack) {
      for (let i = 0; i < 3; i++) {
        r += dr; c += dc
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break
        idx = coordsToIndex(r, c, SIZE)
        if (!cells[idx].isBlack) break
      }
    }
    setCursor({ row: r, col: c })
  }

  function handleTap(r: number, c: number) {
    const same = cursor.row === r && cursor.col === c
    if (same) toggleDir()
    setCursor({ row: r, col: c })
  }

  function handleChange(r: number, c: number, val: string) {
    const ch = (val || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
    const idx = coordsToIndex(r, c, SIZE)
    const next = cells.slice()
    next[idx] = { ...next[idx], userInput: ch }
    setCells(next)
    if (ch) { dir === 'across' ? move(0, 1) : move(1, 0) }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) {
    const key = e.key
    if (key === 'Backspace') {
      if (!cells[coordsToIndex(r, c, SIZE)].userInput) { dir === 'across' ? move(0, -1) : move(-1, 0) }
      return
    }
    if (key === 'ArrowLeft') { setDir('across'); move(0, -1); e.preventDefault() }
    if (key === 'ArrowRight') { setDir('across'); move(0, 1); e.preventDefault() }
    if (key === 'ArrowUp') { setDir('down'); move(-1, 0); e.preventDefault() }
    if (key === 'ArrowDown') { setDir('down'); move(1, 0); e.preventDefault() }
    if (key === 'Enter') { toggleDir(); e.preventDefault() }
  }

  function checkWord() {
    const allCorrect = activeWord.every(c => c.userInput && c.userInput === c.answer)
    const ids = activeWord.map(c => `cell_${c.row}_${c.col}`)
    const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const cls = allCorrect ? 'cell-correct' : 'cell-wrong'
    els.forEach(e => e.classList.add(cls))
    setTimeout(() => els.forEach(e => e.classList.remove(cls)), 650)
  }

  return (
    <div>
      <div className="px-4 pt-3 pb-2 text-sm text-gray-500 flex items-center justify-between">
        <div>Clue #{activeNumber ?? '—'} • {dir.toUpperCase()}</div>
        {!kbOpen && (
          <button className="underline" onClick={toggleDir}>Toggle</button>
        )}
      </div>
      <div className="px-2">
        <div className="grid grid-cols-15 border border-gray-300 dark:border-gray-700">
          {cells.map((cell, i) => {
            const id = `${cell.row}_${cell.col}`
            const isCursor = cell.row === cursor.row && cell.col === cursor.col
            const isHL = highlighted.has(id)
            return (
              <div id={`cell_${id}`} key={i} onClick={() => handleTap(cell.row, cell.col)}
                className={clsx(
                  "relative aspect-square w-full border border-gray-300 dark:border-gray-700",
                  cell.isBlack ? "bg-black" : "bg-white dark:bg-neutral-900",
                  isHL && !cell.isBlack ? "bg-yellow-50 dark:bg-yellow-900/20" : "",
                  isCursor && !cell.isBlack ? "ring-2 ring-blue-500" : ""
                )}>
                {!cell.isBlack && (
                  <>
                    {cell.clueNumber && <span className="absolute top-0.5 left-0.5 text-[10px] text-gray-500">{cell.clueNumber}</span>}
                    <input
                      ref={el => inputsRef.current[i] = el}
                      inputMode="text" autoCapitalize="characters" autoCorrect="off" maxLength={1}
                      value={cell.userInput || ''} onChange={e => handleChange(cell.row, cell.col, e.target.value)}
                      onKeyDown={e => onKeyDown(e, cell.row, cell.col)}
                      className="absolute inset-0 w-full h-full bg-transparent text-lg font-semibold text-center outline-none caret-transparent selection:bg-transparent"
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
        {!kbOpen && (
          <div className="mt-2 flex justify-end px-1">
            <button onClick={checkWord} className="px-3 py-1.5 text-sm border rounded-md border-gray-300 dark:border-gray-700">
              Check
            </button>
          </div>
        )}
      </div>
      {!kbOpen && (
        <div className="px-4 text-sm text-gray-500 mt-2">
          Tip: tap a cell to type • tap again to switch direction
        </div>
      )}
    </div>
  )
}

function getWordCells(cells: Cell[], start: { row: number, col: number }, dir: Direction) {
  const out: Cell[] = []
  const step = dir === 'across'
    ? (r: number, c: number) => ({ r, c: c + 1 })
    : (r: number, c: number) => ({ r: r + 1, c })
  let { row, col } = start
  while (true) {
    const prev = dir === 'across' ? { row, col: col - 1 } : { row: row - 1, col }
    if (prev.col < 0 || prev.row < 0) break
    const i = coordsToIndex(prev.row, prev.col, SIZE)
    if (cells[i].isBlack) break
    row = prev.row; col = prev.col
  }
  while (row < SIZE && col < SIZE && !cells[coordsToIndex(row, col, SIZE)].isBlack) {
    out.push(cells[coordsToIndex(row, col, SIZE)])
    const nxt = step(row, col); row = nxt.r; col = nxt.c
  }
  return out
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
