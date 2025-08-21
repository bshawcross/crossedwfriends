import fs from "fs";
import path from "path";
import { isValidFill } from "@/utils/validateWord";
import type { WordEntry } from "./puzzle";

export function normalizeAnswer(raw: string): string {
  return raw.replace(/[^A-Za-z]/g, "").toUpperCase();
}
export function answerLen(raw: string): number {
  return normalizeAnswer(raw).length;
}

function loadBanlist(): Set<string> {
  const fullPath = path.join(process.cwd(), "banks", "banlist.txt");
  try {
    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    const set = new Set<string>();
    for (const line of lines) {
      const word = normalizeAnswer(line);
      if (answerLen(line) === 0) continue;
      if (!isValidFill(word, 3)) continue;
      set.add(word);
    }
    return set;
  } catch {
    return new Set();
  }
}

export const banlist = loadBanlist();

/**
 * Build a candidate pool mapping word length to a list of unique answers.
 * Primary sources are supplied as an array of string arrays. All entries are
 * normalized and invalid or multi-word entries are discarded.
 */
export function buildCandidatePool(
  sources: string[][] = [],
): Map<number, WordEntry[]> {
  const byLen = new Map<number, Map<string, WordEntry>>();
  let rank = 0;

  const addWord = (raw: string) => {
    const word = normalizeAnswer(raw);
    const len = answerLen(raw);
    if (len === 0 || banlist.has(word) || !isValidFill(word, 3)) {
      rank++;
      return;
    }
    if (!byLen.has(len)) byLen.set(len, new Map());
    const existing = byLen.get(len)!.get(word);
    if (!existing || rank < existing.frequency) {
      byLen.get(len)!.set(word, { answer: word, clue: "", frequency: rank });
    }
    rank++;
  };

  for (const list of sources) {
    for (const w of list) addWord(w);
  }

  const out = new Map<number, WordEntry[]>();
  for (const [len, map] of byLen.entries()) {
    const arr = Array.from(map.values()).sort((a, b) => a.frequency - b.frequency);
    out.set(len, arr);
  }
  return out;
}

/**
 * Read a word bank file from the banks directory and return an array of
 * normalized, unique words. Invalid entries (multi-word, punctuation, etc)
 * are discarded.
 */
function readBankFile(file: string): string[] {
  const fullPath = path.join(process.cwd(), "banks", file);
  try {
    return fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  } catch {
    return [];
  }
}

/**
 * Preloaded candidate pool from the default word bank text files.
 */
function loadCandidatePoolFromBanks(): Map<number, WordEntry[]> {
  const files = [
    "anchors_13.txt",
    "anchors_15.txt",
    "mid_7to12.txt",
    "glue_3to6.txt",
  ];
  const sources = files.map((f) => readBankFile(f));
  return buildCandidatePool(sources);
}

export const candidatePoolByLength = loadCandidatePoolFromBanks();

export type CandidatePool = Map<number, WordEntry[]>;
