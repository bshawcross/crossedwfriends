import { isValidFill } from "./validateWord";
import type { WordEntry } from "../../lib/puzzle";

export function chooseAnswer(
  len: number,
  letters: string[],
  pool: WordEntry[],
): WordEntry {
  if (len === 2) {
    throw new Error("Two-letter answers are banned (slotLen=2).");
  }
  const minLen = 3;
  const idx = pool.findIndex(
    (w) =>
      w.answer.length === len &&
      letters.every((ch, i) => !ch || w.answer[i] === ch) &&
      isValidFill(w.answer, minLen),
  );
  if (idx !== -1) {
    return pool.splice(idx, 1)[0];
  }
  throw new Error(`Missing word entry for length ${len}`);
}
