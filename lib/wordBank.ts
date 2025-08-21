import { normalizeAnswer, answerLen } from "./candidatePool";

export type WordBank = Record<number, string[]>;

export function buildWordBank(words: string[]): WordBank {
  const bank: Record<number, Set<string>> = {};

  for (const raw of words) {
    const word = normalizeAnswer(raw);
    const len = answerLen(raw);
    if (len < 3 || len > 15) continue;
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
