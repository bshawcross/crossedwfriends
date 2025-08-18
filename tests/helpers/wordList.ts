import { WordEntry } from '../../lib/puzzle';

// Generate a large list of allowable words covering lengths 2-15
export function largeWordList(): WordEntry[] {
  const list: WordEntry[] = [];
  for (let len = 2; len <= 15; len++) {
    for (let i = 0; i < 100; i++) {
      const answer = len === 2
        ? (i % 2 === 0 ? 'OK' : 'AX')
        : Array.from({ length: len }, (_, j) =>
            String.fromCharCode(65 + ((i + j) % 26)),
          ).join('');
      list.push({ answer, clue: `clue-${len}-${i}` });
    }
  }
  return list;
}
