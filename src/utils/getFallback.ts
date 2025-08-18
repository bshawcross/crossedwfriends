import fallbackWords from "../data/fallbackWords";
import { isValidFill } from "./validateWord";

export function getFallback(
  len: number,
  letters: string[],
  opts: { allow2?: boolean } = {},
): { answer: string; clue: string } | undefined {
  const list = fallbackWords[len] || [];
  const candidates = list.filter(
    (w) => letters.every((ch, i) => !ch || w[i] === ch) && isValidFill(w, opts),
  );
  if (candidates.length > 0) {
    const word = candidates[Math.floor(Math.random() * candidates.length)];
    return { answer: word, clue: word };
  }
  const generated = letters.map((ch) => ch || "A").join("").padEnd(len, "A");
  if (isValidFill(generated, opts)) {
    return { answer: generated, clue: generated };
  }
  return undefined;
}
