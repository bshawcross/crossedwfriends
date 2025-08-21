import { Puzzle, PuzzleSummary } from './puzzle';
import { validatePuzzle } from './validatePuzzle';

export interface FirestorePuzzle extends Puzzle {
  summary: PuzzleSummary;
}

export function validateFirestorePuzzle(p: FirestorePuzzle): string[] {
  const errors = validatePuzzle(p, { checkSymmetry: true });
  if (!p.summary) {
    errors.push('summary missing');
  } else {
    if (typeof p.summary.seed !== 'string') errors.push('summary.seed must be string');
    if (typeof p.summary.properNounCount !== 'number') errors.push('summary.properNounCount must be number');
    if (typeof p.summary.abbrCount !== 'number') errors.push('summary.abbrCount must be number');
    if (p.summary.seed !== p.id) errors.push('summary.seed mismatch');
  }
  return errors;
}
