import { describe, test, expect, vi } from 'vitest';
import { validatePuzzle } from '../lib/validatePuzzle';
import { generateDaily, WordEntry } from '../lib/puzzle';
import type { Puzzle, Cell, Clue } from '../lib/puzzle';
import { largeWordList } from '../tests/helpers/wordList';
import { findSlots } from '../lib/slotFinder';
import { symCell } from '../grid/symmetry';

describe('validatePuzzle', () => {
  test('valid puzzle passes', () => {
    const size = 15;
    const cells: Cell[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const answer = String.fromCharCode(65 + ((r + c) % 26));
        cells.push({
          row: r,
          col: c,
          isBlack: false,
          answer,
          clueNumber: null,
          userInput: '',
          isSelected: false,
        });
      }
    }
    const across: Clue[] = Array.from({ length: size }, (_, i) => ({
      number: i + 1,
      text: 'Row clue',
      length: size,
      enumeration: `(${size})`,
    }));
    const down: Clue[] = Array.from({ length: size }, (_, i) => ({
      number: i + 1,
      text: 'Col clue',
      length: size,
      enumeration: `(${size})`,
    }));
    const puzzle: Puzzle = {
      id: 'test',
      title: 'Valid',
      theme: '',
      across,
      down,
      cells,
    };
    expect(validatePuzzle(puzzle)).toEqual([]);
  });

  test('fails when not 225 cells', () => {
    const puzzle = generateDaily('seed', largeWordList(), []);
    puzzle.cells.pop();
    const errors = validatePuzzle(puzzle);
    expect(errors.some((e) => e.includes('225'))).toBe(true);
  });

  test('detects clue and answer issues', () => {
    const puzzle = generateDaily('seed', largeWordList(), []);
    // mismatched clue length and dirty clue
    puzzle.across[0].length += 1;
    puzzle.across[0].text = '<b>bad</b> clue http://example.com';
    // compute first across slot to alter answer
    const size = 15;
    const grid: string[] = [];
    for (let r = 0; r < size; r++) {
      let row = '';
      for (let c = 0; c < size; c++) {
        row += puzzle.cells[r * size + c].isBlack ? '#' : '.';
      }
      grid.push(row);
    }
    const slot = findSlots(grid).across[0];
    for (let i = 0; i < slot.length; i++) {
      puzzle.cells[slot.row * size + slot.col + i].answer = i === 0 ? 'A' : '1';
    }
    const errors = validatePuzzle(puzzle);
    expect(errors.some((e) => e.includes('clue') && e.includes('length'))).toBe(true);
    expect(errors.some((e) => e.includes('not allowed'))).toBe(true);
    expect(errors.some((e) => e.includes('not clean'))).toBe(true);
  });

  test('fails symmetry check', () => {
    const puzzle = generateDaily('seed', largeWordList(), []);
    const size = 15;
    const idx = 0;
    const sym = symCell(0, 0, size);
    const symIdx = sym.row * size + sym.col;
    puzzle.cells[idx].isBlack = !puzzle.cells[symIdx].isBlack;
    const errors = validatePuzzle(puzzle, { checkSymmetry: true });
    expect(errors.some((e) => e.includes('not symmetric'))).toBe(true);
  });

  test('fails when word list is insufficient', () => {
    const shortList: WordEntry[] = [{ answer: 'DOG', clue: 'dog' }];
    expect(() => {
      generateDaily('seed', shortList, []);
    }).toThrow();
  });
});
