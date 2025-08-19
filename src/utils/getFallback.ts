import rawFallbackWords from "../data/fallbackWords";
import { isValidFill } from "./validateWord";

const FALLBACK_WORDS: Record<number, string[]> = Object.fromEntries(
  Object.entries(rawFallbackWords).map(([len, words]) => [
    Number(len),
    words.filter((w) => w.length === Number(len) && isValidFill(w, 2)),
  ]),
);

export function getFallback(
  len: number,
  letters: string[] = [],
  opts: { allow2?: boolean; rng?: () => number } = {},
): string | null {
  const minLen = opts.allow2 ? 2 : 3;
  const candidates = (FALLBACK_WORDS[len] || []).filter(
    (w) => isValidFill(w, minLen) && letters.every((ch, i) => !ch || w[i] === ch),
  );
  if (candidates.length === 0) return null;
  const rand = opts.rng ?? Math.random;
  return candidates[Math.floor(rand() * candidates.length)];
}
