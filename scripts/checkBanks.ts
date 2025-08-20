import { promises as fs } from 'fs';
import path from 'path';
import { normalizeAnswer } from '../lib/candidatePool';

async function main() {
  const bankDir = path.join(process.cwd(), 'banks');
  const files = (await fs.readdir(bankDir)).filter((f) => f.endsWith('.txt'));
  const words = new Set<string>();
  for (const file of files) {
    const data = await fs.readFile(path.join(bankDir, file), 'utf8');
    for (const line of data.split(/\r?\n/)) {
      const word = normalizeAnswer(line);
      if (word) words.add(word);
    }
  }
  const counts: Record<number, number> = {};
  for (const w of words) {
    const len = w.length;
    counts[len] = (counts[len] || 0) + 1;
  }
  console.table(counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
