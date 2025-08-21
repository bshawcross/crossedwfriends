import { Puzzle } from './puzzle';

export function getQualityMetrics(puzzle: Puzzle): { properNounCount: number; abbrCount: number } {
  const clues = [...puzzle.across, ...puzzle.down];
  let properNounCount = 0;
  let abbrCount = 0;
  const abbrRe = /\b(?:abbr|abbr\.|initials?|init\.?|acronym)\b/i;
  for (const c of clues) {
    const text = c.text || '';
    if (abbrRe.test(text)) abbrCount++;
    const words = text.split(/\s+/).slice(1);
    if (words.some((w) => /^[A-Z][a-z]+/.test(w))) {
      properNounCount++;
    }
  }
  return { properNounCount, abbrCount };
}
