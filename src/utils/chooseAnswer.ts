import { isValidFill } from "./validateWord";
import { getFallback } from "./getFallback";
import { logInfo, logError } from "@/utils/logger";
import type { WordEntry } from "../../lib/puzzle";

export function chooseAnswer(
  len: number,
  letters: string[],
  pool: WordEntry[],
  opts: { allow2?: boolean } = {},
): WordEntry | undefined {
  const minLen = opts.allow2 ? 2 : 3;
  const idx = pool.findIndex(
    (w) =>
      w.answer.length === len &&
      letters.every((ch, i) => !ch || w.answer[i] === ch) &&
      isValidFill(w.answer, minLen),
  );
  if (idx !== -1) {
    return pool.splice(idx, 1)[0];
  }
  const fb = getFallback(len, letters, opts);
  if (fb) {
    logInfo("fallback_word_used", { length: len, answer: fb.answer });
    return fb;
  }
  logError("choose_answer_failed", { length: len, letters: letters.join("") });
  return undefined;
}
