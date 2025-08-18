import denylist from "../../data/denylist.json";

const denySet = new Set<string>(denylist);

export function isValidFill(input: string, minLen = 3): boolean {
  const word = input.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(word)) return false;
  if (word.length < minLen) return false;
  if (/(.)\1\1/.test(word)) return false;
  if (denySet.has(word)) return false;
  return true;
}
