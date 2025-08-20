import { promises as fs } from 'fs';
import path from 'path';
import { buildCandidatePool } from '../lib/candidatePool';
import fallbackWords from '../src/data/fallbackWords';

async function main() {
  // Load primary word lists if present
  const allowlistPath = path.join(__dirname, '..', 'data', 'allowlist.json');
  let allowlist: string[] = [];
  try {
    const raw = await fs.readFile(allowlistPath, 'utf8');
    allowlist = JSON.parse(raw);
  } catch {
    // ignore if file missing
  }

  // Build pool from primary sources
  const pool = buildCandidatePool([allowlist]);

  // Ensure fallback words are merged
  for (const w of fallbackWords) {
    const len = w.length;
    const existing = pool.get(len) || [];
    const merged = new Set([...existing, w.toUpperCase()]);
    pool.set(len, Array.from(merged));
  }

  // Output counts per word length
  const counts: Record<string, number> = {};
  for (const [len, words] of pool.entries()) {
    counts[len] = words.length;
  }
  console.table(counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
