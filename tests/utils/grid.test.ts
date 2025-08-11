import { describe, it, expect } from 'vitest'
import { coordsToIndex } from '../../lib/puzzle'
import type { Cell } from '../../lib/puzzle'
import {
  moveCursor,
  getWordCells,
  findNextWordStart,
  findFirstWordStart,
} from '../../utils/grid'

const SIZE = 3

function createCells(): Cell[] {
  const cells: Cell[] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      cells.push({
        row: r,
        col: c,
        isBlack: false,
        answer: '',
        clueNumber: null,
        userInput: '',
        isSelected: false,
      })
    }
  }
  return cells
}

describe('grid utilities', () => {
  it('moveCursor skips black squares', () => {
    const cells = createCells()
    cells[coordsToIndex(0, 1, SIZE)].isBlack = true
    const next = moveCursor(cells, { row: 0, col: 0 }, 0, 1, SIZE)
    expect(next).toEqual({ row: 0, col: 2 })
  })

  it('getWordCells finds letters in a word', () => {
    const cells = createCells()
    cells[coordsToIndex(0, 1, SIZE)].isBlack = true
    const word = getWordCells(cells, { row: 0, col: 0 }, 'across', SIZE)
    expect(word).toHaveLength(1)
    expect(word[0].row).toBe(0)
    expect(word[0].col).toBe(0)
  })

  it('findNextWordStart returns the next clue', () => {
    const cells = createCells()
    cells[coordsToIndex(0, 0, SIZE)].clueNumber = 1
    cells[coordsToIndex(1, 0, SIZE)].clueNumber = 2
    const next = findNextWordStart(cells, 1, 'across', SIZE)
    expect(next).toEqual({ row: 1, col: 0, number: 2 })
  })

  it('findFirstWordStart returns the first start', () => {
    const cells = createCells()
    cells[coordsToIndex(0, 0, SIZE)].clueNumber = 1
    cells[coordsToIndex(1, 0, SIZE)].clueNumber = 2
    const first = findFirstWordStart(cells, 'across', SIZE)
    expect(first).toEqual({ row: 0, col: 0, number: 1 })
  })
})

