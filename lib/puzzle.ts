import { cleanClue } from './clueClean';
import { findSlots, Slot } from './slotFinder';
import { planHeroPlacements } from './heroPlacement';
import { buildMask } from '@/grid/mask';
import * as validatePuzzle from '../src/validate/puzzle';
import { assertCoverage } from '../src/validate/coverage';
import fallbackWords from '../src/data/fallbackWords';
import { repairMask } from './repairMask';
import { solve, SolverSlot } from './solver';
import { logInfo, logError } from '@/utils/logger';

export type Cell = {
  row: number;
  col: number;
  isBlack: boolean;
  answer: string;
  clueNumber: number | null;
  userInput: string;
  isSelected: boolean;
}
export type Clue = { number:number, text:string, length:number, enumeration:string }
export type Puzzle = {
  id: string;
  title: string;
  theme: string;
  across: Clue[];
  down: Clue[];
  cells: Cell[];
}

export type WordEntry = { answer: string; clue: string }

// lib/puzzle.ts
export function coordsToIndex(row: number, col: number, size = 15) {
  return row * size + col;
}

export function generateDaily(
  seed: string,
  wordList: WordEntry[] = [],
  heroTerms: string[] = [],
  opts: {
    allow2?: boolean;
    heroThreshold?: number;
    maxFillAttempts?: number;
    maxMasks?: number;
    maxFallbackRate?: number;
  } = {},
  mask?: boolean[][],
): Puzzle {
  const size = mask ? mask.length : 15;
  const minLen = opts.allow2 ? 2 : 3;
  const maxMasks = opts.maxMasks ?? 3;

  for (let attempt = 0; attempt < maxMasks; attempt++) {
    try {
      let boolGrid: boolean[][];
      if (attempt === 0 && mask) {
        boolGrid = mask;
        let symValid = validatePuzzle.validateSymmetry(boolGrid);
        let slotDetail = validatePuzzle.validateMinSlotLength(boolGrid, 3);
        if (!symValid || slotDetail) {
          try {
            boolGrid = repairMask(boolGrid, minLen, 50, opts.allow2);
          } catch {
            // ignore repair failures and validate below
          }
          symValid = validatePuzzle.validateSymmetry(boolGrid);
          slotDetail = validatePuzzle.validateMinSlotLength(boolGrid, 3);
          if (!symValid || slotDetail) {
            const error = !symValid ? 'grid_not_symmetric' : 'slot_too_short';
            throw { message: 'puzzle_invalid', error, detail: slotDetail };
          }
        }
      } else {
        boolGrid = buildMask(size, 36, 5000, minLen);
      }

      if (!validatePuzzle.validateSymmetry(boolGrid)) {
        throw { message: 'puzzle_invalid', error: 'grid_not_symmetric', detail: undefined };
      }
      const detail = validatePuzzle.validateMinSlotLength(boolGrid, minLen);
      if (detail) {
        throw { message: 'puzzle_invalid', error: 'slot_too_short', detail };
      }

      const cells: Cell[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const isBlack = boolGrid[r][c];
          cells.push({ row: r, col: c, isBlack, answer: '', clueNumber: null, userInput: '', isSelected: false });
        }
      }

      // place hero terms before slot finding
      const heroMap = new Map<string, string>();
      const heroPlacements = planHeroPlacements(heroTerms);
      heroPlacements.forEach((p) => {
        heroMap.set(`${p.row}_${p.col}_${p.dir}`, p.term);
        for (let i = 0; i < p.term.length; i++) {
          const cell = getCell(cells, size, p.row, p.col + i);
          cell.isBlack = false;
          cell.answer = p.term[i] ?? '';
          boolGrid[p.row][p.col + i] = false;
        }
      });
      const getSlotLengthsFn =
        ('getSlotLengths' in validatePuzzle
          ? (validatePuzzle as any).getSlotLengths
          : null) ||
        ((grid: boolean[][], orientation: 'across' | 'down'): number[] => {
          const size = grid.length;
          const lengths: number[] = [];
          if (orientation === 'across') {
            for (let r = 0; r < size; r++) {
              let len = 0;
              for (let c = 0; c < size; c++) {
                if (!grid[r][c]) {
                  len++;
                }
                if (grid[r][c]) {
                  if (len > 0) lengths.push(len);
                  len = 0;
                } else if (c === size - 1) {
                  if (len > 0) lengths.push(len);
                  len = 0;
                }
              }
            }
          } else {
            for (let c = 0; c < size; c++) {
              let len = 0;
              for (let r = 0; r < size; r++) {
                if (!grid[r][c]) {
                  len++;
                }
                if (grid[r][c]) {
                  if (len > 0) lengths.push(len);
                  len = 0;
                } else if (r === size - 1) {
                  if (len > 0) lengths.push(len);
                  len = 0;
                }
              }
            }
          }
          return lengths;
        });

      const requiredLens = [
        ...getSlotLengthsFn(boolGrid, 'across'),
        ...getSlotLengthsFn(boolGrid, 'down'),
      ];
      const heroesByLen: Record<number, number> = {};
      heroTerms.forEach((t) => {
        const len = t.length;
        heroesByLen[len] = (heroesByLen[len] || 0) + 1;
      });
      const dictByLen: Record<number, number> = {};
      wordList.forEach((w) => {
        const len = w.answer.length;
        dictByLen[len] = (dictByLen[len] || 0) + 1;
      });
      const fallbackByLen: Record<number, number> = {};
      Object.entries(fallbackWords).forEach(([lenStr, words]) => {
        fallbackByLen[Number(lenStr)] = (words as string[]).length;
      });
      assertCoverage(requiredLens, { heroesByLen, dictByLen, fallbackByLen });

      // build grid for slot finding
      const grid: string[] = [];
      for (let r = 0; r < size; r++) {
        let row = '';
        for (let c = 0; c < size; c++) {
          row += getCell(cells, size, r, c).isBlack ? '#' : '.';
        }
        grid.push(row);
      }

      const slots = findSlots(grid);
      type SlotInfo = Slot & { direction: 'across' | 'down'; number?: number };
      const slotMap = new Map<string, SlotInfo[]>();
      const allSlots: SlotInfo[] = [];
      slots.across.forEach((s) => {
        const key = `${s.row}_${s.col}`;
        const arr = slotMap.get(key) || [];
        const slot = { ...s, direction: 'across' } as SlotInfo;
        arr.push(slot);
        slotMap.set(key, arr);
        allSlots.push(slot);
      });
      slots.down.forEach((s) => {
        const key = `${s.row}_${s.col}`;
        const arr = slotMap.get(key) || [];
        const slot = { ...s, direction: 'down' } as SlotInfo;
        arr.push(slot);
        slotMap.set(key, arr);
        allSlots.push(slot);
      });

      const board: string[][] = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => {
          const cell = getCell(cells, size, r, c);
          return cell.isBlack ? '#' : cell.answer;
        }),
      );

      const solverSlots: SolverSlot[] = allSlots
        .filter((s) => !heroMap.has(`${s.row}_${s.col}_${s.direction}`))
        .map((s) => ({ ...s, id: `${s.direction}_${s.row}_${s.col}` }));

      const remaining = wordList.map((w) => ({ answer: w.answer.toUpperCase(), clue: w.clue }));
      const heroEntries = heroTerms
        .filter((t) => !heroPlacements.some((p) => p.term === t.toUpperCase()))
        .map((t) => ({ answer: t.toUpperCase(), clue: t }));

      const result = solve({
        board,
        slots: solverSlots,
        heroes: heroEntries,
        dict: remaining,
        opts: {
          allow2: opts.allow2,
          heroThreshold: opts.heroThreshold,
          maxFillAttempts: opts.maxFillAttempts,
          maxFallbackRate: opts.maxFallbackRate,
        },
      });
      if (!result.ok) {
        logInfo('retry', { attempt: attempt + 1, reason: result.reason, attempts: result.attempts });
        if (attempt === maxMasks - 1) {
          logError('abort', { attempts: attempt + 1, reason: result.reason, fillAttempts: result.attempts });
          throw { message: 'puzzle_invalid', error: result.reason, detail: undefined };
        }
        continue;
      }

      const across: Clue[] = [];
      const down: Clue[] = [];
      const get = (r: number, c: number) => cells[r * size + c];
      let num = 1;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cell = get(r, c);
          if (cell.isBlack) continue;
          const key = `${r}_${c}`;
          const starts = slotMap.get(key);
          if (!starts) continue;
          cell.clueNumber = num;
          starts.forEach((slot) => {
            slot.number = num;
            const heroKey = `${slot.row}_${slot.col}_${slot.direction}`;
            const heroTerm = heroMap.get(heroKey);
            const enumeration = `(${slot.length})`;
            if (heroTerm) {
              const clueText = cleanClue(heroTerm);
              if (slot.direction === 'across') {
                across.push({ number: num, text: clueText, length: slot.length, enumeration });
              } else {
                down.push({ number: num, text: clueText, length: slot.length, enumeration });
              }
              return;
            }
            const entry = result.assignments.get(`${slot.direction}_${slot.row}_${slot.col}`);
            if (!entry) throw { message: 'puzzle_invalid', error: 'fill_failed', detail: undefined };
            const ans = entry.answer;
            const clueText = cleanClue(entry.clue);
            if (slot.direction === 'across') {
              for (let i = 0; i < slot.length; i++) {
                const ch = ans[i] ?? '';
                get(r, c + i).answer = ch;
              }
              across.push({ number: num, text: clueText, length: slot.length, enumeration });
            } else {
              for (let i = 0; i < slot.length; i++) {
                const ch = ans[i] ?? get(r + i, c).answer;
                if (ch) get(r + i, c).answer = ch;
              }
              down.push({ number: num, text: clueText, length: slot.length, enumeration });
            }
          });
          num++;
        }
      }

      return {
        id: seed,
        title: 'Daily Placeholder',
        theme: 'seasonal/current-events',
        across,
        down,
        cells,
      };
    } catch (err) {
      const reason = (err as any).error || (err as Error).message;
      logInfo('retry', { attempt: attempt + 1, reason });
      if (attempt === maxMasks - 1) {
        logError('abort', { attempts: attempt + 1, reason });
        throw err;
      }
    }
  }

  throw { message: 'puzzle_invalid', error: 'fill_failed', detail: undefined };
}

export async function loadDemoFromFile(): Promise<Puzzle> {
  const url = `/demo-15x15.json?ts=${Date.now()}`; // cache-buster
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('demo-15x15.json not found');

  const raw = await res.json();
  console.log('Loaded puzzle:', raw.title);

  if (!raw.cells || !Array.isArray(raw.cells) || raw.cells.length !== 225) {
    throw new Error('Invalid demo puzzle format');
  }

  // --- fix clue text that came in as [id, "Text"] OR as a string like "[1, 'Text']"
  const coerceClueText = (t: any): string => {
    if (Array.isArray(t)) return String(t[1] ?? t[0] ?? '');
    if (t && typeof t === 'object' && 'clue' in t) return String((t as any).clue ?? '');
    if (typeof t === 'string') {
      // try to parse stringified list: [number, 'Text']  or  [number, "Text"]
      const m = t.match(/^\s*\[\s*\d+\s*,\s*["'](.+?)["']\s*\]\s*$/);
      if (m) return m[1];
      return t;
    }
    return '';
  };

  const cells = raw.cells as Cell[];
  const size = 15;
  const grid: string[] = [];
  for (let r = 0; r < size; r++) {
    let row = '';
    for (let c = 0; c < size; c++) {
      row += cells[r * size + c].isBlack ? '#' : '.';
    }
    grid.push(row);
  }
  const slots = findSlots(grid);

  const normalizeClues = (arr: any[], slotArr: Slot[]): Clue[] =>
    (arr ?? []).map((c: any, idx: number) => {
      const len = slotArr[idx]?.length ?? Number(c.length);
      return {
        number: Number(c.number),
        text: cleanClue(coerceClueText(c.text)),
        length: len,
        enumeration: `(${len})`,
      };
    });

  return {
    id: String(raw.id ?? 'demo'),
    title: String(raw.title ?? 'Imported Puzzle'),
    theme: String(raw.theme ?? ''),
    across: normalizeClues(raw.across, slots.across),
    down: normalizeClues(raw.down, slots.down),
    cells,
  };
}

function getCell(cells: Cell[], size: number, r: number, c: number) {
  return cells[r * size + c];
}
