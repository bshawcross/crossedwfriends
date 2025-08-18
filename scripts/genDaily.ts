import { promises as fs } from 'fs';
import path from 'path';
import { generateDaily, WordEntry } from '../lib/puzzle';
import { validatePuzzle } from '../lib/validatePuzzle';
import { findSlots } from '../lib/slotFinder';
import { getSeasonalWords, getFunFactWords, getCurrentEventWords } from '../lib/topics';
import { yyyyMmDd } from '../utils/date';
import { logInfo, logError, logWarn } from '../utils/logger';
import { getFallback } from '../utils/getFallback';
import { validateSymmetry, validateMinSlotLength } from '../src/validate/puzzle';
import { setBlackGuarded } from '../grid/symmetry';
import { isValidFill } from '../utils/validateWord';

const defaultHeroTerms = ['CAPTAINMARVEL', 'BLACKWIDOW', 'SPIDERMAN', 'IRONMAN', 'THOR'];

function getPresentLengths(words: WordEntry[], allow2: boolean): Set<number> {
  const present = new Set<number>();
  for (const entry of words) {
    const len = entry.answer.length;
    if (len >= (allow2 ? 2 : 3) && len <= 15) {
      present.add(len);
    }
  }
  return present;
}

async function main() {
  const date = yyyyMmDd();
  const seed = `${date}:seasonal,funFacts,currentEvents`;
  const puzzleDate = new Date(`${date}T00:00:00Z`);

  // CLI usage: [hero terms...] --allow2=true|false (default false)
  const args = process.argv.slice(2);
  const allow2Arg = args.find((a) => a.startsWith('--allow2'));
  const allow2 = allow2Arg ? allow2Arg.split('=')[1] !== 'false' : false;
  const heroTerms = args.filter((a) => !a.startsWith('--'));
  const [seasonal, funFacts, currentEvents] = await Promise.all([
    getSeasonalWords(puzzleDate),
    getFunFactWords(),
    getCurrentEventWords(puzzleDate)
  ]);
  let wordList: WordEntry[] = [...seasonal, ...funFacts, ...currentEvents];
  let present = getPresentLengths(wordList, allow2);
  let missingLengths: number[] = [];
  const minLen = allow2 ? 2 : 3;
  for (let len = minLen; len <= 15; len++) {
    if (!present.has(len)) missingLengths.push(len);
  }

  if (missingLengths.length > 0) {
    for (const len of missingLengths) {
      const fallbackEntry = getFallback(len, Array(len).fill(''), { allow2 });
      if (fallbackEntry) {
        wordList.push(fallbackEntry);
        logInfo('fallback_word_used', { length: len, answer: fallbackEntry.answer });
      } else {
        logWarn('fallback_word_missing', { length: len });
      }
    }
  }

  present = getPresentLengths(wordList, allow2);
  missingLengths = [];
  for (let len = minLen; len <= 15; len++) {
    if (!present.has(len)) missingLengths.push(len);
  }
  if (missingLengths.length > 0) {
    missingLengths.forEach((len) => logError('missing_length', { length: len }));
    process.exit(1);
  }

  // Build grid for preflight validation
  const size = 15;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0) % 97;
  };
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cond = ((r + c + hash(seed)) % 5 === 0) || ((r % 7 === 0) && (c % 4 === 0));
      if (cond) {
        try {
          setBlackGuarded(grid, r, c, minLen);
        } catch {
          /* ignore rejected black */
        }
      }
    }
  }
  try {
    if (!validateSymmetry(grid)) {
      logError('grid_not_symmetric');
      process.exit(1);
    }
    const shortSlots = validateMinSlotLength(grid, minLen);
    if (shortSlots.length > 0) {
      logError('slot_too_short', { lengths: shortSlots });
      process.exit(1);
    }
  } catch (err) {
    logError('puzzle_invalid', { error: (err as Error).message });
    process.exit(1);
  }
  const puzzle = generateDaily(
    seed,
    wordList,
    heroTerms.length > 0 ? heroTerms : defaultHeroTerms,
    { allow2 },
  );
  const finalGrid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(puzzle.cells[r * size + c].isBlack);
    }
    finalGrid.push(row);
  }
  try {
    if (!validateSymmetry(finalGrid)) {
      logError('puzzle_invalid', { error: 'grid_not_symmetric' });
      process.exit(1);
    }
    const gridStr: string[] = [];
    for (let r = 0; r < size; r++) {
      let row = '';
      for (let c = 0; c < size; c++) {
        row += puzzle.cells[r * size + c].isBlack ? '#' : '.';
      }
      gridStr.push(row);
    }
    const slots = findSlots(gridStr);
    const checkEntries = (
      clues: { length: number }[],
      slotArr: { row: number; col: number; length: number }[],
      dir: 'across' | 'down',
    ) => {
      clues.forEach((_, idx) => {
        const slot = slotArr[idx];
        if (!slot) return;
        let ans = '';
        for (let k = 0; k < slot.length; k++) {
          const cellIdx =
            dir === 'across'
              ? slot.row * size + slot.col + k
              : (slot.row + k) * size + slot.col;
          ans += puzzle.cells[cellIdx].answer;
        }
        const valid = isValidFill(ans, { allow2 });
        if (!valid) {
          logError('puzzle_invalid', { error: `${dir} clue invalid`, clueIndex: idx });
          process.exit(1);
        }
      });
    };
    checkEntries(puzzle.across, slots.across, 'across');
    checkEntries(puzzle.down, slots.down, 'down');
    const errors = validatePuzzle(puzzle, { checkSymmetry: true, allow2 });
    if (errors.length > 0) {
      errors.forEach((err) => logError('puzzle_invalid', { error: err }));
      process.exit(1);
    }
  } catch (err) {
    logError('puzzle_invalid', { error: (err as Error).message });
    process.exit(1);
  }

  const puzzlesDir = path.join(process.cwd(), 'puzzles');
  try {
    await fs.mkdir(puzzlesDir, { recursive: true });
  } catch (e) {
    logError('mkdir_failed', { dir: puzzlesDir, error: (e as Error).message });
    throw e;
  }

  const filePath = path.join(puzzlesDir, `${date}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(puzzle, null, 2));
    logInfo('puzzle_written', { date, filePath });
  } catch (e) {
    logError('write_failed', { filePath, error: (e as Error).message });
    throw e;
  }
}

main().catch((err) => {
  logError('generate_daily_failed', { error: (err as Error).message });
  process.exit(1);
});
