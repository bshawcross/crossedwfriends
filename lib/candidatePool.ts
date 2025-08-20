import fallbackWords from "../src/data/fallbackWords";
import { isValidFill } from "@/utils/validateWord";

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

/**
 * Build a candidate pool mapping word length to a list of unique answers.
 * Primary sources are supplied as an array of string arrays. All entries are
 * normalized and invalid or multi-word entries are discarded. Fallback lists
 * are merged automatically.
 */
export function buildCandidatePool(
  sources: string[][] = [],
): Map<number, string[]> {
  const byLen = new Map<number, Set<string>>();

  const addWord = (raw: string) => {
    const word = normalizeAnswer(raw);
    if (!word) return;
    const len = word.length;
    if (!byLen.has(len)) byLen.set(len, new Set());
    byLen.get(len)!.add(word);
  };

  // Add words from primary sources
  for (const list of sources) {
    for (const w of list) addWord(w);
  }

  // Merge fallback lists
  for (const words of Object.values(fallbackWords)) {
    for (const w of words) addWord(w);
  }

  // Convert sets to arrays
  const out = new Map<number, string[]>();
  for (const [len, set] of byLen.entries()) {
    out.set(len, Array.from(set));
  }
  return out;
}

export type CandidatePool = Map<number, string[]>;
