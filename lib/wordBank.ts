export type WordBank = Record<number, string[]>;

export function buildWordBank(words: string[]): WordBank {
  const bank: Record<number, Set<string>> = {};

  for (const raw of words) {
    const word = raw.trim().toUpperCase();
    if (!/^[A-Z]{3,15}$/.test(word)) continue;
    const len = word.length;
    if (!bank[len]) bank[len] = new Set();
    bank[len].add(word);
  }

  const out: WordBank = {};
  for (const lenStr in bank) {
    const len = Number(lenStr);
    out[len] = Array.from(bank[len]).sort();
  }
  return out;
}
