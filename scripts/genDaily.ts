import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { generateDaily, WordEntry, type Cell } from '../lib/puzzle';
import { validatePuzzle } from '../lib/validatePuzzle';
import { findSlots, type Slot } from '../lib/slotFinder';
import { getSeasonalWords, getFunFactWords, getCurrentEventWords } from '../lib/topics';
import { yyyyMmDd } from '../utils/date';
import { logInfo, logError } from '../utils/logger';
import { validateSymmetry, validateMinSlotLength } from '../src/validate/puzzle';
import { buildMask } from '../grid/mask';
import { isValidFill } from '../utils/validateWord';
import { getSlotLengths } from '../lib/gridSlots';
import { buildWordBank } from '../lib/wordBank';
import { validateCoverage } from '../lib/coverage';
import { buildCandidatePool as buildBankPool } from '../lib/candidatePool';
import seedrandom from 'seedrandom';

const defaultHeroTerms = ['CAPTAINMARVEL', 'BLACKWIDOW', 'SPIDERMAN', 'IRONMAN', 'THOR'];

type CandidatePool = Record<number, WordEntry[]>;

const MIN_BY_LEN: Record<number, number> = Object.fromEntries(
  Array.from({ length: 13 }, (_, i) => [i + 3, 1]),
);

function buildCandidatePool(words: WordEntry[]): CandidatePool {
  const pool: CandidatePool = {};
  const seen = new Set<string>();
  for (const entry of words) {
    const answer = entry.answer.trim().toUpperCase();
    if (!/^[A-Z]{3,15}$/.test(answer)) continue;
    if (!isValidFill(answer, 3)) continue;
    const len = answer.length;
    const key = `${len}:${answer}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!pool[len]) pool[len] = [];
    pool[len].push({ answer, clue: entry.clue });
  }
  return pool;
}

function loadBankPool(): Map<number, string[]> {
  const bankDir = path.join(process.cwd(), 'banks');
  const files = ['anchors_13.txt', 'anchors_15.txt', 'mid_7to12.txt', 'glue_3to6.txt'];
  const sources = files.map((f) => {
    try {
      return fsSync.readFileSync(path.join(bankDir, f), 'utf8').split(/\r?\n/);
    } catch {
      return [];
    }
  });
  return buildBankPool(sources);
}

function selectAnchors(
  slots: { across: Slot[]; down: Slot[] },
  size: number,
  pool: Map<number, string[]>,
  rng: () => number,
  blacklist: Set<string>,
): string[] {
  const cellCount = new Map<string, number>();
  for (const s of slots.across) {
    for (let i = 0; i < s.length; i++) {
      const key = `${s.row}_${s.col + i}`;
      cellCount.set(key, (cellCount.get(key) || 0) + 1);
    }
  }
  for (const s of slots.down) {
    for (let i = 0; i < s.length; i++) {
      const key = `${s.row + i}_${s.col}`;
      cellCount.set(key, (cellCount.get(key) || 0) + 1);
    }
  }
  const crossings = (s: Slot, orientation: 'across' | 'down'): number => {
    let count = 0;
    for (let i = 0; i < s.length; i++) {
      const r = orientation === 'across' ? s.row : s.row + i;
      const c = orientation === 'across' ? s.col + i : s.col;
      if ((cellCount.get(`${r}_${c}`) || 0) > 1) count++;
    }
    return count;
  };
  const centerRow = Math.floor(size / 2);
  const center15 = slots.across.find(
    (s) => s.length === 15 && s.row === centerRow && s.col === 0 && crossings(s, 'across') >= 6,
  );
  const thirteenSlots = slots.across.filter(
    (s) =>
      s.length === 13 &&
      s.col === 1 &&
      (s.row === centerRow - 1 || s.row === centerRow + 1) &&
      crossings(s, 'across') >= 6,
  );
  const anchors: string[] = [];
  const pick = (len: number) => {
    const words = (pool.get(len) || []).filter(
      (w) => !blacklist.has(w) && !anchors.includes(w),
    );
    if (words.length === 0) return;
    const idx = Math.floor(rng() * words.length);
    anchors.push(words[idx]);
  };
  if (center15) pick(15);
  if (thirteenSlots.length > 0) pick(13);
  if (anchors.length < 2 && center15) pick(15);
  return anchors;
}

async function main() {
  const date = yyyyMmDd();
  const seed = `${date}:seasonal,funFacts,currentEvents`;
  const puzzleDate = new Date(`${date}T00:00:00Z`);

  // CLI usage: [hero terms...] --maxMasks=N --maxFillAttempts=N --heroThreshold=N
  const args = process.argv.slice(2);
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
  const minLen = 3;

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
  const cellGrid: Cell[][] = grid.map((row, r) =>
    row.map((isBlack, c) => ({
      row: r,
      col: c,
      isBlack,
      answer: '',
      clueNumber: null,
      userInput: '',
      isSelected: false,
    })),
  );
  const slotLengths = getSlotLengths(cellGrid).all;

  const bankPool = loadBankPool();
  let pool = buildCandidatePool(wordList);
  const baseGridStr = grid.map((row) => row.map((b) => (b ? '#' : '.')).join(''));
  const slots = findSlots(baseGridStr);

  const requiredLens = Array.from(new Set(slotLengths));
  for (const len of requiredLens) {
    const minCount = MIN_BY_LEN[len] || 1;
    const have = pool[len]?.length || 0;
    if (have < minCount) {
      if (len === 13 || len === 15) {
        const anchors = bankPool.get(len) || [];
        for (const a of anchors) {
          if (!/^[A-Z]+$/.test(a)) continue;
          if (!pool[len]) pool[len] = [];
          if (!pool[len].some((e) => e.answer === a)) {
            pool[len].push({ answer: a, clue: '' });
          }
          if (pool[len].length >= minCount) break;
        }
      }
      if ((pool[len]?.length || 0) < minCount) {
        logError('missing_length', { length: len });
        process.exit(1);
      }
    }
  }

  wordList = Object.values(pool).flat();
  const allWords = wordList.map((w) => w.answer);
  const wordBank = buildWordBank(allWords);
  const { missing } = validateCoverage(slotLengths, wordBank);
  if (missing.length > 0) {
    console.error(JSON.stringify({ level: 'error', message: 'missing_length_detail', missing }));
    process.exit(1);
  }

  const baseHeroTerms = heroTerms.length > 0 ? heroTerms : defaultHeroTerms;
  const MAX_RESTARTS = 8;
  const anchorBlacklist = new Set<string>();
  let puzzle: ReturnType<typeof generateDaily> | null = null;
  for (let restart = 0; restart < MAX_RESTARTS && !puzzle; restart++) {
    const localSeed = `${seed}-${restart}`;
    const rng = seedrandom(localSeed);
    const anchors = selectAnchors(slots, size, bankPool, rng, anchorBlacklist);
    try {
      puzzle = generateDaily(
        localSeed,
        wordList,
        [...baseHeroTerms, ...anchors],
        { heroThreshold, maxFillAttempts, maxMasks },
        grid,
      );
      logInfo('generation_restart', { restart: restart + 1, anchors });
    } catch (e) {
      logInfo('generation_restart', {
        restart: restart + 1,
        error: (e as Error).message,
        anchors,
      });
      anchors.forEach((a) => anchorBlacklist.add(a));
    }
  }
  if (!puzzle) {
    logError('generate_daily_failed', { error: 'exhausted_restarts' });
    process.exit(1);
  }
  const finalGrid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(puzzle!.cells[r * size + c].isBlack);
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
        row += puzzle!.cells[r * size + c].isBlack ? '#' : '.';
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
          ans += puzzle!.cells[cellIdx].answer;
        }
        const valid = isValidFill(ans, 3);
        if (!valid) {
          logError('puzzle_invalid', { error: `${dir} clue invalid`, clueIndex: idx });
        }
      });
    };
    checkEntries(puzzle!.across, slots.across, 'across');
    checkEntries(puzzle!.down, slots.down, 'down');
    const errors = validatePuzzle(puzzle!, { checkSymmetry: true });
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
    await fs.writeFile(filePath, JSON.stringify(puzzle!, null, 2));
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
