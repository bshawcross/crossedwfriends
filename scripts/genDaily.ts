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
import { solve, type SolverSlot } from '../lib/solver';
import seedrandom from 'seedrandom';

const defaultHeroTerms = ['CAPTAINMARVEL', 'BLACKWIDOW', 'SPIDERMAN', 'IRONMAN', 'THOR'];

const envGridSize = parseInt(process.env.GRID_SIZE || '', 10) || 15;
const envPatternSet = process.env.PATTERN_SET || 'default';
const envHeroTerms = (process.env.HERO_TERMS || '')
  .split(',')
  .map((t) => t.trim())
  .filter((t) => t.length > 0);
const envDictsPath = process.env.DICTS_PATH;

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
    pool[len].push({ answer, clue: entry.clue, frequency: entry.frequency });
  }
  return pool;
}

function loadBankPool(): Map<number, WordEntry[]> {
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

export function selectAnchors(
  slots: { across: Slot[]; down: Slot[] },
  size: number,
  pool: Map<number, WordEntry[]>,
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
      (w) => !blacklist.has(w.answer) && !anchors.includes(w.answer),
    );
    if (words.length === 0) return;
    const idx = Math.floor(rng() * words.length);
    anchors.push(words[idx].answer);
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

  logInfo('start_run', { seed, patternId: 0 });

  if (process.env.GENDAILY_TEST === '1') {
    logInfo('reseed_started', { attempt: 1 });
    const board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];
    const slots: SolverSlot[] = [
      { row: 0, col: 0, length: 3, direction: 'across', id: 'A1' },
      { row: 1, col: 0, length: 3, direction: 'across', id: 'A2' },
      { row: 2, col: 0, length: 3, direction: 'across', id: 'A3' },
      { row: 0, col: 0, length: 3, direction: 'down', id: 'D1' },
      { row: 0, col: 1, length: 3, direction: 'down', id: 'D2' },
      { row: 0, col: 2, length: 3, direction: 'down', id: 'D3' },
    ];
    const dict: WordEntry[] = [
      { answer: 'CAT', clue: '', frequency: 1 },
      { answer: 'DOG', clue: '', frequency: 1 },
      { answer: 'COW', clue: '', frequency: 1 },
      { answer: 'CAR', clue: '', frequency: 1 },
      { answer: 'DIG', clue: '', frequency: 1 },
      { answer: 'BAR', clue: '', frequency: 1 },
      { answer: 'BIG', clue: '', frequency: 1 },
      { answer: 'FIN', clue: '', frequency: 1 },
    ];
    const result = solve({
      board,
      slots,
      dict,
      heroes: [],
      rng: seedrandom(seed),
      opts: { maxBranchAttempts: 50, maxTotalAttempts: 20, maxTimeBudgetMs: 1000 },
    });
    logInfo('reseed_finished', { attempt: 1, success: result.ok });
    if (result.ok) {
      logInfo('success', { attempts: result.attempts });
    } else {
      logError('final_failure', { reason: result.reason, attempts: result.attempts });
    }
    return;
  }

  // CLI usage: [hero terms...] --maxMasks=N --maxBranchAttempts=N --maxTotalAttempts=N --maxTimeBudgetMs=N --heroThreshold=N
  const args = process.argv.slice(2);
  const maxMasksArg = args.find((a) => a.startsWith('--maxMasks'));
  const maxMasks = maxMasksArg ? parseInt(maxMasksArg.split('=')[1], 10) : 10;
  const maxBranchAttemptsArg = args.find((a) => a.startsWith('--maxBranchAttempts'));
  const maxBranchAttempts = maxBranchAttemptsArg
    ? parseInt(maxBranchAttemptsArg.split('=')[1], 10)
    : parseInt(process.env.MAX_BRANCH_ATTEMPTS || '', 10) || 50000;
  const maxTotalAttemptsArg = args.find((a) => a.startsWith('--maxTotalAttempts'));
  const maxTotalAttempts = maxTotalAttemptsArg
    ? parseInt(maxTotalAttemptsArg.split('=')[1], 10)
    : parseInt(process.env.MAX_TOTAL_ATTEMPTS || '', 10) || 20;
  const maxTimeBudgetArg = args.find((a) => a.startsWith('--maxTimeBudgetMs'));
  const maxTimeBudgetMs = maxTimeBudgetArg
    ? parseInt(maxTimeBudgetArg.split('=')[1], 10)
    : parseInt(process.env.MAX_TIME_BUDGET_MS || '', 10) || 2 * 60 * 1000;
  const heroThresholdArg = args.find((a) => a.startsWith('--heroThreshold'));
  const heroThreshold = heroThresholdArg ? parseInt(heroThresholdArg.split('=')[1], 10) : 3000;
  const cliHeroTerms = args.filter((a) => !a.startsWith('--'));

  const heroTerms = cliHeroTerms.length > 0 ? cliHeroTerms : envHeroTerms;
  const [seasonal, funFacts, currentEvents] = await Promise.all([
    getSeasonalWords(puzzleDate),
    getFunFactWords(),
    getCurrentEventWords(puzzleDate),
  ]);
  let baseWordList: WordEntry[] = [...seasonal, ...funFacts, ...currentEvents];
  if (envDictsPath) {
    try {
      const extra = JSON.parse(await fs.readFile(envDictsPath, 'utf8')) as WordEntry[];
      baseWordList = [...baseWordList, ...extra];
    } catch (e) {
      logError('dict_load_failed', { path: envDictsPath, error: (e as Error).message });
    }
  }
  const minLen = 3;
  const size = envGridSize;
  const bankPool = loadBankPool();
  const baseHeroTerms = (heroTerms.length > 0 ? heroTerms : defaultHeroTerms).map((t) =>
    t.trim().toUpperCase(),
  );

  const startTime = Date.now();
  let attempt = 0;
  let puzzle: ReturnType<typeof generateDaily> | null = null;

  while (
    attempt < maxTotalAttempts &&
    Date.now() - startTime < maxTimeBudgetMs &&
    !puzzle
  ) {
    attempt++;
    let wordList = [...baseWordList];
    const attemptSeed = `${seed}-${attempt}`;
    const rngMask = seedrandom(`${attemptSeed}-mask`);
    let grid: boolean[][];
    try {
      grid = buildMask(size, 36, 5000, minLen, rngMask);
    } catch (err) {
      logError('mask_generation_failed', { attempt, error: (err as Error).message });
      continue;
    }
    try {
      if (!validateSymmetry(grid)) {
        logError('grid_not_symmetric', { attempt });
        continue;
      }
      const detail = validateMinSlotLength(grid, minLen);
      if (detail) {
        const meta =
          detail.type === 'across'
            ? { type: detail.type, r: detail.start.row, c0: detail.start.col, c1: detail.end.col, len: detail.len }
            : { type: detail.type, r: detail.start.col, c0: detail.start.row, c1: detail.end.row, len: detail.len };
        logError('slot_too_short', { attempt, ...meta });
        continue;
      }
    } catch (err) {
      logError('puzzle_invalid', { attempt, error: (err as Error).message });
      continue;
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
    let pool = buildCandidatePool(wordList);
    const baseGridStr = grid.map((row) => row.map((b) => (b ? '#' : '.')).join(''));
    const slots = findSlots(baseGridStr);

    let missingLen = false;
    const requiredLens = Array.from(new Set(slotLengths));
    for (const len of requiredLens) {
      const minCount = MIN_BY_LEN[len] || 1;
      const have = pool[len]?.length || 0;
      if (have < minCount) {
        if (len === 13 || len === 15) {
          const anchors = bankPool.get(len) || [];
          for (const a of anchors) {
            const word = a.answer;
            if (!/^[A-Z]+$/.test(word)) continue;
            if (!pool[len]) pool[len] = [];
            if (!pool[len].some((e) => e.answer === word)) {
              pool[len].push({ answer: word, clue: '', frequency: a.frequency });
            }
            if (pool[len].length >= minCount) break;
          }
        }
        if ((pool[len]?.length || 0) < minCount) {
          logError('missing_length', { attempt, length: len });
          missingLen = true;
          break;
        }
      }
    }
    if (missingLen) continue;

    wordList = Object.values(pool).flat();
    const allWords = wordList.map((w) => w.answer);
    const wordBank = buildWordBank(allWords);
    const { missing } = validateCoverage(slotLengths, wordBank);
    if (missing.length > 0) {
      logError('missing_length_detail', { attempt, missing });
      continue;
    }

    const MAX_RESTARTS = 8;
    const anchorBlacklist = new Set<string>();
    for (let restart = 0; restart < MAX_RESTARTS && !puzzle; restart++) {
      const localSeed = `${attemptSeed}-${restart}`;
      const rng = seedrandom(localSeed);
      const anchors = selectAnchors(slots, size, bankPool, rng, anchorBlacklist);
      try {
        puzzle = generateDaily(
          localSeed,
          wordList,
          [...baseHeroTerms, ...anchors],
          {
            heroThreshold,
            maxBranchAttempts,
            maxTotalAttempts,
            maxTimeBudgetMs,
            maxMasks,
            gridSize: size,
            patternSet: envPatternSet,
            dictsPath: envDictsPath,
          },
          grid,
        );
        logInfo('generation_restart', { attempt, restart: restart + 1, anchors });
      } catch (e) {
        logInfo('generation_restart', {
          attempt,
          restart: restart + 1,
          error: (e as Error).message,
          anchors,
        });
        anchors.forEach((a) => anchorBlacklist.add(a));
      }
    }
    if (!puzzle) {
      logError('dead_end', { attempt, error: 'exhausted_restarts' });
      continue;
    }

    puzzle.id = seed;

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
        logError('puzzle_invalid', { attempt, error: 'grid_not_symmetric' });
        puzzle = null;
        continue;
      }
      const gridStr: string[] = [];
      for (let r = 0; r < size; r++) {
        let row = '';
        for (let c = 0; c < size; c++) {
          row += puzzle!.cells[r * size + c].isBlack ? '#' : '.';
        }
        gridStr.push(row);
      }
      const slotsCheck = findSlots(gridStr);
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
            logError('puzzle_invalid', { attempt, error: `${dir} clue invalid`, clueIndex: idx });
          }
        });
      };
      checkEntries(puzzle!.across, slotsCheck.across, 'across');
      checkEntries(puzzle!.down, slotsCheck.down, 'down');
      const errors = validatePuzzle(puzzle!, { checkSymmetry: true });
      if (errors.length > 0) {
        errors.forEach((err) => logError('puzzle_invalid', { attempt, error: err }));
        puzzle = null;
        continue;
      }
    } catch (err) {
      logError('puzzle_invalid', { attempt, error: (err as Error).message });
      puzzle = null;
      continue;
    }
  }

  if (!puzzle) {
    logError('final_failure', { attempts: attempt, time: Date.now() - startTime });
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
    logInfo('success', { attempt, time: Date.now() - startTime });
    await fs.writeFile(filePath, JSON.stringify(puzzle!, null, 2));
    logInfo('puzzle_written', { date, filePath });
  } catch (e) {
    logError('write_failed', { filePath, error: (e as Error).message });
    throw e;
  }
}

main().catch((err) => {
  logError('final_failure', { error: (err as Error).message });
  process.exit(1);
});
