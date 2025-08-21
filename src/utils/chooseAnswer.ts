import { isValidFill } from "./validateWord";
import type { WordEntry } from "../../lib/puzzle";
import { answerLen, normalizeAnswer } from "../../lib/candidatePool";

export function chooseAnswer(
  len: number,
  letters: string[],
  pool: WordEntry[],
): WordEntry {
  if (len === 2) {
    throw new Error("Two-letter answers are banned (slotLen=2).");
  }
  const minLen = 3;
  const idx = pool.findIndex((w) => {
    const ans = normalizeAnswer(w.answer);
    return (
      answerLen(w.answer) === len &&
      letters.every((ch, i) => !ch || ans[i] === ch) &&
      isValidFill(ans, minLen)
    );
  });
  if (idx !== -1) {
    return pool.splice(idx, 1)[0];
  }
  throw new Error(`Missing word entry for length ${len}`);
}
