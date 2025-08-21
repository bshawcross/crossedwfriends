import { isValidFill } from "@/utils/validateWord";
import { normalizeAnswer, answerLen } from "./candidatePool";
import { parseGen } from "./parseGen";
import type { WordEntry } from "./puzzle";
import { spawnSync } from "child_process";

const MIN_LEN = 3;
const BANNED_LENGTHS = new Set([2]);

type SlotLike = { length: number };

function queryTier3(mask: string, len: number): WordEntry[] {
  const endpoint = process.env.TIER3_URL;
  if (!endpoint) return [];
  const prompt = `Regex mask: /${mask}/\nLength: ${len}\n` +
    "Return a JSON array of 20 objects with 'answer' and 'clue' fields.";
  try {
    const payload = JSON.stringify({ prompt });
    const args = [
      "-s",
      "-X",
      "POST",
      endpoint,
      "-H",
      "Content-Type: application/json",
      "-d",
      payload,
    ];
    const res = spawnSync("curl", args, { encoding: "utf8" });
    if (res.status !== 0) return [];
    return parseGen(res.stdout).map((e) => ({
      answer: e.answer,
      clue: e.clue,
      frequency: Infinity,
    }));
  } catch {
    return [];
  }
}

export function getCandidates(
  slot: SlotLike,
  pattern: string[],
  topical: WordEntry[],
  global: WordEntry[],
): WordEntry[] {
  const len = slot.length;
  if (BANNED_LENGTHS.has(len)) return [];
  const match = (w: WordEntry) => {
    const ans = normalizeAnswer(w.answer);
    return (
      answerLen(w.answer) === len &&
      pattern.every((ch, i) => !ch || ans[i] === ch) &&
      isValidFill(ans, MIN_LEN)
    );
  };
  const topicalCands = topical
    .filter(match)
    .sort((a, b) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity));
  const globalCands = global
    .filter(match)
    .sort((a, b) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity));
  const mask = pattern.map((ch) => ch || ".").join("");
  const llmCands = queryTier3(mask, len);
  const seen = new Set<string>();
  const merged: WordEntry[] = [];
  for (const list of [topicalCands, globalCands, llmCands]) {
    for (const cand of list) {
      const key = cand.answer;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(cand);
      }
    }
  }
  return merged;
}

