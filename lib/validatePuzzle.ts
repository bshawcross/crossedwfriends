import { Puzzle, Cell, Clue } from './puzzle';
import { findSlots, Slot } from './slotFinder';
import { cleanClue } from './clueClean';
import { isValidFill } from '@/utils/validateWord';
import { symCell } from '@/grid/symmetry';

export function validatePuzzle(
  puzzle: Puzzle,
  opts: { checkSymmetry?: boolean } = {},
): string[] {
  const errors: string[] = [];
  const size = 15;

  if (!puzzle.cells || puzzle.cells.length !== size * size) {
    errors.push(`Puzzle must have ${size * size} cells, got ${puzzle.cells?.length ?? 0}`);
    return errors;
  }

  const requiredFields: (keyof Cell)[] = [
    'row',
    'col',
    'isBlack',
    'answer',
    'clueNumber',
    'userInput',
    'isSelected',
  ];
  puzzle.cells.forEach((cell, idx) => {
    for (const f of requiredFields) {
      if (cell[f] === undefined) {
        errors.push(`Cell ${idx} missing field ${String(f)}`);
      }
    }
  });

  const grid: string[] = [];
  for (let r = 0; r < size; r++) {
    let row = '';
    for (let c = 0; c < size; c++) {
      row += puzzle.cells[r * size + c].isBlack ? '#' : '.';
    }
    grid.push(row);
  }
  const slots = findSlots(grid);

  const checkClues = (clues: Clue[], slots: Slot[], dir: 'across' | 'down') => {
    clues.forEach((clue, i) => {
      const slot = slots[i];
      if (!slot) {
        errors.push(`${dir} clue ${clue.number} has no slot`);
        return;
      }
      const letters: string[] = [];
      for (let k = 0; k < slot.length; k++) {
        const idx = dir === 'across'
          ? slot.row * size + slot.col + k
          : (slot.row + k) * size + slot.col;
        letters.push(puzzle.cells[idx].answer);
      }
      const answer = letters.join('');
      if (clue.length !== slot.length) {
        errors.push(`${dir} clue ${clue.number} length ${clue.length} ≠ slot length ${slot.length}`);
      }
      if (answer.length !== slot.length) {
        errors.push(`${dir} answer ${clue.number} length ${answer.length} ≠ slot length ${slot.length}`);
      }
      if (!isValidFill(answer, 3)) {
        errors.push(`${dir} answer ${clue.number} not allowed: ${answer}`);
      }
      if (cleanClue(clue.text) !== clue.text) {
        errors.push(`${dir} clue ${clue.number} not clean`);
      }
    });
  };

  checkClues(puzzle.across, slots.across, 'across');
  checkClues(puzzle.down, slots.down, 'down');

  if (opts.checkSymmetry) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        const sym = symCell(r, c, size);
        const symIdx = sym.row * size + sym.col;
        if (idx >= symIdx) continue;
        if (puzzle.cells[idx].isBlack !== puzzle.cells[symIdx].isBlack) {
          errors.push(`Cells (${r},${c}) and (${sym.row},${sym.col}) not symmetric`);
        }
      }
    }
  }

  return errors;
}
