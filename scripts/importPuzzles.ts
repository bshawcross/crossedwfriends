import fs from 'fs';
import path from 'path';
import { Firestore } from '@google-cloud/firestore';
import { execFile } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type PuzJson = {
  title: string;
  author: string;
  dimensions: { width: number; height: number };
  solution: string[][];
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function parsePuz(filePath: string): Promise<PuzJson> {
  const script = path.join(__dirname, 'puz2json.py');
  const { stdout } = await execFileAsync('python3', [script, filePath]);
  return JSON.parse(stdout);
}

async function parseIpuz(filePath: string): Promise<PuzJson> {
  const text = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function importPuzzle(firestore: Firestore, sourcePath: string) {
  const ext = path.extname(sourcePath).toLowerCase();
  let puzzle: PuzJson;
  if (ext === '.puz') {
    puzzle = await parsePuz(sourcePath);
  } else if (ext === '.ipuz') {
    puzzle = await parseIpuz(sourcePath);
  } else {
    return;
  }
  const width = puzzle.dimensions?.width;
  const height = puzzle.dimensions?.height;
  if (width !== 15 || height !== 15) {
    console.info('skipping', sourcePath);
    return;
  }
  const solution = puzzle.solution || [];
  const cells: { row: number; col: number; answer: string; isBlack: boolean }[] = [];
  const answers: string[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const raw = solution[r]?.[c] || '';
      const ch = raw.toUpperCase();
      const isBlack = ch === '#' || ch === '.' || ch === '';
      const answer = isBlack ? '' : ch;
      if (answer) answers.push(answer);
      cells.push({ row: r, col: c, answer, isBlack });
    }
  }
  const hash = crypto.createHash('sha256').update(answers.join('')).digest('hex').slice(0, 10);
  const puzzleId = `${slug(puzzle.author || 'anon')}-${slug(puzzle.title || 'untitled')}-${hash}`;

  const docRef = firestore.collection('puzzles').doc(puzzleId);
  const batch = firestore.batch();
  batch.set(docRef, {
    title: puzzle.title || '',
    author: puzzle.author || '',
    width,
    height,
  });
  for (const cell of cells) {
    const cellRef = docRef.collection('cells').doc(`${cell.row}_${cell.col}`);
    batch.set(cellRef, {
      row: cell.row,
      col: cell.col,
      answer: cell.answer,
      isBlack: cell.isBlack,
    });
  }
  await batch.commit();
  console.info('imported', puzzleId, sourcePath);
}

async function main() {
  const dir = process.env.PUZZLE_IMPORT_DIR;
  if (!dir) {
    throw new Error('PUZZLE_IMPORT_DIR env var missing');
  }
  const firestore = new Firestore({
    projectId: process.env.FIRESTORE_PROJECT_ID,
  });
  const files = await fs.promises.readdir(dir);
  for (const f of files) {
    const sourcePath = path.join(dir, f);
    const stat = await fs.promises.stat(sourcePath);
    if (!stat.isFile()) continue;
    try {
      await importPuzzle(firestore, sourcePath);
    } catch (err) {
      console.error('failed', sourcePath, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

