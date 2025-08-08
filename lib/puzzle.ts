export type Cell = {
  row: number;
  col: number;
  isBlack: boolean;
  answer: string;
  clueNumber: number | null;
  userInput: string;
  isSelected: boolean;
}
export type Clue = { number:number, text:string, length:number }
export type Puzzle = {
  id: string;
  title: string;
  theme: string;
  across: Clue[];
  down: Clue[];
  cells: Cell[];
}

// lib/puzzle.ts
export function coordsToIndex(row: number, col: number, size = 15) {
  return row * size + col;
}

function hash(s: string) {
  let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h>>>0) % 97;
}

export function generateDaily(seed: string): Puzzle {
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

  // numbering
  let num=1; const get=(r:number,c:number)=>cells[r*size+c];
  const across: Clue[]=[]; const down: Clue[]=[]
  for (let r=0;r<size;r++){
    for (let c=0;c<size;c++){
      const cell=get(r,c); if (cell.isBlack) continue;
      const startAcross=(c===0||get(r,c-1).isBlack)&&(c+1<size&&!get(r,c+1).isBlack)
      const startDown  =(r===0||get(r-1,c).isBlack)&&(r+1<size&&!get(r+1,c).isBlack)
      if (startAcross||startDown){
        cell.clueNumber=num;
        if (startAcross){ let len=1; while(c+len<size&&!get(r,c+len).isBlack) len++; across.push({number:num,text:`Across ${num}: placeholder`,length:len}); }
        if (startDown){ let len=1; while(r+len<size&&!get(r+len,c).isBlack) len++; down.push({number:num,text:`Down ${num}: placeholder`,length:len}); }
        num++;
      }
    }
  }
  return { id: seed, title:'Daily Placeholder', theme:'seasonal/current-events', across, down, cells }
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

  const normalizeClues = (arr: any[]): Clue[] =>
    (arr ?? []).map((c: any) => ({
      number: Number(c.number),
      text: coerceClueText(c.text),
      length: Number(c.length),
    }));

  return {
    id: String(raw.id ?? 'demo'),
    title: String(raw.title ?? 'Imported Puzzle'),
    theme: String(raw.theme ?? ''),
    across: normalizeClues(raw.across),
    down: normalizeClues(raw.down),
    cells: raw.cells as Cell[],
  };
}
