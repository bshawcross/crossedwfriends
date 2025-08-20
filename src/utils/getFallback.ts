import { candidatePoolByLength } from "../../lib/candidatePool";
import { isValidFill } from "./validateWord";

export function getFallback(
  len: number,
  letters: string[] = [],
  opts: { rng?: () => number } = {},
): string | null {
  if (len === 2) {
    throw new Error("Two-letter answers are banned (slotLen=2).");
  }
  const candidates = (candidatePoolByLength.get(len) || []).filter(
    (w) => isValidFill(w, 3) && letters.every((ch, i) => !ch || w[i] === ch),
  );
  if (candidates.length === 0) return null;
  const rand = opts.rng ?? Math.random;
  return candidates[Math.floor(rand() * candidates.length)];
}
