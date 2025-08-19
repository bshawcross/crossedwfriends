import { promises as fs } from 'fs';
import path from 'path';
import { generateDaily, WordEntry } from '../lib/puzzle';
import { validatePuzzle } from '../lib/validatePuzzle';
import { findSlots } from '../lib/slotFinder';
import { getSeasonalWords, getFunFactWords, getCurrentEventWords } from '../lib/topics';
import { yyyyMmDd } from '../utils/date';
import { logInfo, logError } from '../utils/logger';
import { validateSymmetry, validateMinSlotLength } from '../src/validate/puzzle';
import { buildMask } from '../grid/mask';
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

  // CLI usage: [hero terms...] --allow2=true|false --maxMasks=N --maxFillAttempts=N --heroThreshold=N
  const args = process.argv.slice(2);
  const allow2Arg = args.find((a) => a.startsWith('--allow2'));
  const allow2 = allow2Arg ? allow2Arg.split('=')[1] !== 'false' : false;
  const maxMasksArg = args.find((a) => a.startsWith('--maxMasks'));
  const maxMasks = maxMasksArg ? parseInt(maxMasksArg.split('=')[1], 10) : 10;
  const maxFillAttemptsArg = args.find((a) => a.startsWith('--maxFillAttempts'));
  const maxFillAttempts = maxFillAttemptsArg ? parseInt(maxFillAttemptsArg.split('=')[1], 10) : 50000;
  const heroThresholdArg = args.find((a) => a.startsWith('--heroThreshold'));
  const heroThreshold = heroThresholdArg ? parseInt(heroThresholdArg.split('=')[1], 10) : 3000;
  const heroTerms = args.filter((a) => !a.startsWith('--'));
  const [seasonal, funFacts, currentEvents] = await Promise.all([
    getSeasonalWords(puzzleDate),
    getFunFactWords(),
    getCurrentEventWords(puzzleDate)
  ]);
  let wordList: WordEntry[] = [...seasonal, ...funFacts, ...currentEvents];
  let present = getPresentLengths(wordList, allow2);
  const minLen = allow2 ? 2 : 3;
  const missingLengths: number[] = [];
  for (let len = minLen; len <= 15; len++) {
    if (!present.has(len)) missingLengths.push(len);
  }
  if (missingLengths.length > 0) {
    missingLengths.forEach((len) => logError('missing_length', { length: len }));
    process.exit(1);
  }

  // Build grid for preflight validation
  const size = 15;
  const grid = buildMask(size, 36, 5000, minLen);
  try {
    if (!validateSymmetry(grid)) {
      logError('grid_not_symmetric');
      process.exit(1);
    }
    const detail = validateMinSlotLength(grid, minLen);
    if (detail) {
      const meta =
        detail.type === 'across'
          ? { type: detail.type, r: detail.start.row, c0: detail.start.col, c1: detail.end.col, len: detail.len }
          : { type: detail.type, r: detail.start.col, c0: detail.start.row, c1: detail.end.row, len: detail.len };
      logError('slot_too_short', meta);
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
    { allow2, heroThreshold, maxFillAttempts, maxMasks },
    grid,
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
        const valid = isValidFill(ans, allow2 ? 2 : 3);
        if (!valid) {
          logError('puzzle_invalid', { error: `${dir} clue invalid`, clueIndex: idx });
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
