import { cleanClue } from './clueClean';
import { findSlots, Slot } from './slotFinder';
import { isAnswerAllowed } from './answerPolicy';

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

function hash(s: string) {
  let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h>>>0) % 97;
}

export function generateDaily(seed: string, wordList: WordEntry[] = []): Puzzle {
  const size = 15;
  const cells: Cell[] = [];
  const blocks = new Set<string>();
  for (let r=0;r<size;r++){
    for (let c=0;c<size;c++){
      const cond = ((r+c+hash(seed))%5===0) || ((r%7===0)&&(c%4===0));
      if (cond){ blocks.add(`${r}_${c}`); blocks.add(`${size-1-r}_${size-1-c}`); }
    }
  }
  for (let r=0;r<size;r++){
    for (let c=0;c<size;c++){
      const isBlack = blocks.has(`${r}_${c}`)
      cells.push({ row:r, col:c, isBlack, answer:'', clueNumber:null, userInput:'', isSelected:false })
    }
  }

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
  const takeEntry = (len: number) => {
    const idx = remaining.findIndex((w) => w.answer.length === len && isAnswerAllowed(w.answer));
    if (idx !== -1) return remaining.splice(idx, 1)[0];
    return undefined;
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
        const entry = takeEntry(slot.length);
        const ans = entry?.answer ?? ''.padEnd(slot.length, ' ');
        const enumeration = `(${slot.length})`;
        const clueText = cleanClue(
          entry?.clue ?? `${slot.direction === 'across' ? 'Across' : 'Down'} ${num}`,
        );
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
