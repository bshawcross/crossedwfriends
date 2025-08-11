import type { Cell } from '@/lib/puzzle'
import { coordsToIndex } from '@/lib/puzzle'

export type Direction = 'across' | 'down'
export const GRID_SIZE = 15

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function moveCursor(
  cells: Cell[],
  cursor: { row: number; col: number },
  dr: number,
  dc: number,
  size: number = GRID_SIZE,
) {
  let r = clamp(cursor.row + dr, 0, size - 1)
  let c = clamp(cursor.col + dc, 0, size - 1)
  let idx = coordsToIndex(r, c, size)
  if (cells[idx].isBlack) {
    for (let i = 0; i < 3; i++) {
      r += dr
      c += dc
      if (r < 0 || r >= size || c < 0 || c >= size) break
      idx = coordsToIndex(r, c, size)
      if (!cells[idx].isBlack) break
    }
  }
  return { row: r, col: c }
}

export function getWordCells(
  cells: Cell[],
  start: { row: number; col: number },
  dir: Direction,
  size: number = GRID_SIZE,
) {
  const out: Cell[] = []
  const step = dir === 'across'
    ? (r: number, c: number) => ({ r, c: c + 1 })
    : (r: number, c: number) => ({ r: r + 1, c })
  let { row, col } = start
  while (true) {
    const prev = dir === 'across' ? { row, col: col - 1 } : { row: row - 1, col }
    if (prev.col < 0 || prev.row < 0) break
    const i = coordsToIndex(prev.row, prev.col, size)
    if (cells[i].isBlack) break
    row = prev.row; col = prev.col
  }
  while (row < size && col < size && !cells[coordsToIndex(row, col, size)].isBlack) {
    out.push(cells[coordsToIndex(row, col, size)])
    const nxt = step(row, col); row = nxt.r; col = nxt.c
  }
  return out
}

export function getWordStarts(
  cells: Cell[],
  dir: Direction,
  size: number = GRID_SIZE,
) {
  const out: { row: number; col: number; number: number }[] = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = coordsToIndex(r, c, size)
      const cell = cells[idx]
      if (cell.isBlack || !cell.clueNumber) continue
      if (
        dir === 'across' &&
        (c === 0 || cells[coordsToIndex(r, c - 1, size)].isBlack) &&
        c + 1 < size && !cells[coordsToIndex(r, c + 1, size)].isBlack
      ) {
        out.push({ row: r, col: c, number: cell.clueNumber })
      }
      if (
        dir === 'down' &&
        (r === 0 || cells[coordsToIndex(r - 1, c, size)].isBlack) &&
        r + 1 < size && !cells[coordsToIndex(r + 1, c, size)].isBlack
      ) {
        out.push({ row: r, col: c, number: cell.clueNumber })
      }
    }
  }
  return out.sort((a, b) => a.number - b.number)
}

export function findNextWordStart(
  cells: Cell[],
  currentNumber: number,
  dir: Direction,
  size: number = GRID_SIZE,
) {
  const starts = getWordStarts(cells, dir, size)
  for (const s of starts) if (s.number > currentNumber) return s
  return null
}

export function findFirstWordStart(
  cells: Cell[],
  dir: Direction,
  size: number = GRID_SIZE,
) {
  const starts = getWordStarts(cells, dir, size)
  return starts[0] || null
}

