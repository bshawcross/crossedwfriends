import fallbackWords from "../data/fallbackWords";
import { isValidFill } from "./validateWord";

export function getFallback(
  len: number,
  letters: string[],
  opts: { allow2?: boolean } = {},
): { answer: string; clue: string } | undefined {
  const minLen = opts.allow2 ? 2 : 3;
  const list = fallbackWords[len] || [];
  const candidates = list.filter(
    (w) => letters.every((ch, i) => !ch || w[i] === ch) && isValidFill(w, minLen),
  );
  if (candidates.length > 0) {
    const word = candidates[Math.floor(Math.random() * candidates.length)];
    return { answer: word, clue: word };
  }
  const generated = Array.from({ length: len }, (_, i) =>
    letters[i] || String.fromCharCode(65 + (i % 26)),
  ).join("");
  if (isValidFill(generated, minLen)) {
    return { answer: generated, clue: generated };
  }
  return undefined;
}
