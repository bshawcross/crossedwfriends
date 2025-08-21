import fs from "fs";
import path from "path";
import { isValidFill } from "@/utils/validateWord";
import type { WordEntry } from "./puzzle";

/**
 * Normalize an answer string by trimming, uppercasing and ensuring it is a
 * single word containing only the letters A-Z. Returns null if the input
 * contains whitespace, punctuation or otherwise fails validation.
 */
export function normalizeAnswer(input: string): string | null {
  const word = input.trim().toUpperCase();
  // Reject if not purely letters or contains multiple words
  if (!/^[A-Z]+$/.test(word)) return null;
  // Ensure the word passes fill validation (min length handled by caller)
  if (!isValidFill(word, 3)) return null;
  return word;
}

function loadBanlist(): Set<string> {
  const fullPath = path.join(process.cwd(), "banks", "banlist.txt");
  try {
    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    const set = new Set<string>();
    for (const line of lines) {
      const word = normalizeAnswer(line);
      if (word) set.add(word);
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
    if (!word || banlist.has(word)) {
      rank++;
      return;
    }
    const len = word.length;
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
