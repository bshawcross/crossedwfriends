import fallbackWords from "../data/fallbackWords";
import { isValidFill } from "./validateWord";

const FALLBACK_WORDS: Record<number, string[]> = fallbackWords.reduce(
  (acc, w) => {
    if (!isValidFill(w, 2)) return acc;
    const len = w.length;
    if (!acc[len]) acc[len] = [];
    acc[len].push(w);
    return acc;
  },
  {} as Record<number, string[]>,
);

export function getFallback(
  len: number,
  letters: string[] = [],
  opts: { rng?: () => number } = {},
): string | null {
  if (len === 2) {
    throw new Error("Two-letter answers are banned (slotLen=2).");
  }
  const candidates = (FALLBACK_WORDS[len] || []).filter(
    (w) => isValidFill(w, 3) && letters.every((ch, i) => !ch || w[i] === ch),
  );
  if (candidates.length === 0) return null;
  const rand = opts.rng ?? Math.random;
  return candidates[Math.floor(rand() * candidates.length)];
}
