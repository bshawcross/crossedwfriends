'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Cell } from '@/lib/puzzle'
import { coordsToIndex } from '@/lib/puzzle'
import GridCell from './GridCell'
import KeyboardControls from './KeyboardControls'
import {
  GRID_SIZE,
  moveCursor,
  getWordCells,
  findNextWordStart,
  findFirstWordStart,
  type Direction,
} from '@/utils/grid'

const SIZE = GRID_SIZE

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


  const activeWord = useMemo(() => getWordCells(cells, cursor, dir, SIZE), [cells, cursor, dir])
  const activeNumber = activeWord[0]?.clueNumber ?? null

  useEffect(() => {
    onActiveChange?.({ number: activeNumber, dir })
  }, [activeNumber, dir])

  useEffect(() => {
    if (!jump) return
    setDir(jump.dir)
    const headIdx = cells.findIndex(c => !c.isBlack && c.clueNumber === jump.number)
    if (headIdx >= 0) setCursor({ row: Math.floor(headIdx / SIZE), col: headIdx % SIZE })
  }, [jump])

  function toggleDir() {
    setDir(d => d === 'across' ? 'down' : 'across')
  }
  const highlighted = useMemo(
    () => new Set(activeWord.map(c => `${c.row}_${c.col}`)),
    [activeWord]
  )
  function move(dr: number, dc: number) {
    setCursor(moveCursor(cells, cursor, dr, dc, SIZE))
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
    if (ch) {
      const last = activeWord[activeWord.length - 1]
      const isLast = last && last.row === r && last.col === c
      if (isLast) {
        advanceToNextWord(next)
      } else {
        dir === 'across' ? move(0, 1) : move(1, 0)
      }
    }
  }

  function advanceToNextWord(current: Cell[]) {
    const curNum = activeNumber ?? 0
    const nextStart = findNextWordStart(current, curNum, dir, SIZE)
    if (nextStart) {
      setCursor({ row: nextStart.row, col: nextStart.col })
    } else {
      const other: Direction = dir === 'across' ? 'down' : 'across'
      const first = findFirstWordStart(current, other, SIZE)
      setDir(other)
      if (first) setCursor({ row: first.row, col: first.col })
    }
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
      <div className="px-4 pt-3 pb-2 text-sm text-gray-500 flex items-center">
        <div>Clue #{activeNumber ?? '—'} • {dir.toUpperCase()}</div>
      </div>
      <div className="px-2">
        <div className="grid grid-cols-15 border border-gray-300 dark:border-gray-700">
          {cells.map((cell, i) => {
            const id = `${cell.row}_${cell.col}`
            const isCursor = cell.row === cursor.row && cell.col === cursor.col
            const isHL = highlighted.has(id)
            return (
              <GridCell
                key={i}
                cell={cell}
                isCursor={isCursor}
                isHighlighted={isHL}
                onTap={handleTap}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                inputRef={el => inputsRef.current[i] = el}
              />
            )
          })}
        </div>
      </div>
      <KeyboardControls onCheck={checkWord} kbOpen={kbOpen} />
    </div>
  )
}
