import { candidatePoolByLength } from '../lib/candidatePool';

async function main() {
  // Output counts per word length from bank-derived pool
  const counts: Record<string, number> = {};
  for (const [len, words] of candidatePoolByLength.entries()) {
    counts[len] = words.length;
  }
  console.table(counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
