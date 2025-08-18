import { cleanClue } from './clueClean';
import { findSlots, Slot } from './slotFinder';
import { planHeroPlacements } from './heroPlacement';
import { buildMask } from '@/grid/mask';
import { validateSymmetry, validateMinSlotLength } from '../src/validate/puzzle';
import { chooseAnswer } from '@/utils/chooseAnswer';
import { logError } from '../utils/logger';
import { repairMask } from './repairMask';

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
  opts: { allow2?: boolean } = {},
  mask?: boolean[][],
): Puzzle {
  const size = mask ? mask.length : 15;
  const cells: Cell[] = [];
  const minLen = opts.allow2 ? 2 : 3;
  const boolGrid = mask
    ? repairMask(mask, minLen, 50, opts.allow2)
    : buildMask(size, 36, 5000, minLen);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isBlack = boolGrid[r][c];
      cells.push({ row: r, col: c, isBlack, answer: '', clueNumber: null, userInput: '', isSelected: false });
    }
  }
  if (!validateSymmetry(boolGrid)) {
    throw new Error('grid_not_symmetric');
  }
  if (!opts.allow2) {
    const detail = validateMinSlotLength(boolGrid, minLen);
    if (detail) {
      logError('slot_too_short', { detail });
      process.exit(1);
    }
  }

  // place hero terms before slot finding
  const heroMap = new Map<string, string>();
  const heroCells = new Set<string>();
  const heroPlacements = planHeroPlacements(heroTerms);
  heroPlacements.forEach((p) => {
    heroMap.set(`${p.row}_${p.col}_${p.dir}`, p.term);
    for (let i = 0; i < p.term.length; i++) {
      const cell = getCell(cells, size, p.row, p.col + i);
      cell.isBlack = false;
      cell.answer = p.term[i] ?? '';
      heroCells.add(`${p.row}_${p.col + i}`);
    }
  });

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
  type SlotDir = Slot & { direction: 'across' | 'down'; number?: number };
  const slotMap = new Map<string, SlotDir[]>();
  slots.across.forEach((s) => {
    const key = `${s.row}_${s.col}`;
    const arr = slotMap.get(key) || [];
    arr.push({ ...s, direction: 'across' });
    slotMap.set(key, arr);
  });
  slots.down.forEach((s) => {
    const key = `${s.row}_${s.col}`;
    const arr = slotMap.get(key) || [];
    arr.push({ ...s, direction: 'down' });
    slotMap.set(key, arr);
  });

  const remaining = wordList.map((w) => ({ answer: w.answer.toUpperCase(), clue: w.clue }));
  const getEntry = (len: number, letters: string[]) => {
    try {
      return chooseAnswer(len, letters, remaining, opts);
    } catch {
      return undefined;
    }
  };

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
        const letters: string[] = [];
        if (slot.direction === 'across') {
          for (let i = 0; i < slot.length; i++) {
            const rr = r;
            const cc = c + i;
            letters[i] = heroCells.has(`${rr}_${cc}`) ? get(rr, cc).answer : '';
          }
        } else {
          for (let i = 0; i < slot.length; i++) {
            const rr = r + i;
            const cc = c;
            letters[i] = heroCells.has(`${rr}_${cc}`) ? get(rr, cc).answer : '';
          }
        }
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
        const entry = letters.every((ch) => ch)
          ? undefined
          : getEntry(slot.length, letters);
        if (!entry) {
          if (letters.every((ch) => ch)) {
            const ans = letters.join('');
            const clueText = cleanClue(ans);
            if (slot.direction === 'across') {
              across.push({ number: num, text: clueText, length: slot.length, enumeration });
            } else {
              down.push({ number: num, text: clueText, length: slot.length, enumeration });
            }
            return;
          }
          console.error(`No word entry for length ${slot.length}`);
          throw new Error(`Missing word entry for length ${slot.length}`);
        }
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
