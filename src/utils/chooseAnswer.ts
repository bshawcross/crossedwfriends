import { isValidFill } from "./validateWord";
import { getFallback } from "./getFallback";
import { logInfo } from "@/utils/logger";
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
  const fb = getFallback(len, letters);
  if (fb) {
    logInfo("fallback_word_used", { length: len, answer: fb });
    return { answer: fb, clue: fb };
  }
  throw new Error(`Missing word entry for length ${len}`);
}
