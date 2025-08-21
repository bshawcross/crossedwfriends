import type { SolverSlot } from "../../lib/solver";
import type { WordEntry } from "../../lib/puzzle";

export const board5x5: string[][] = [
  ["#", "#", "#", "#", "#"],
  ["#", "A", "", "", "#"],
  ["#", "D", "E", "", "#"],
  ["#", "G", "", "I", "#"],
  ["#", "#", "#", "#", "#"],
];

export const slots5x5: SolverSlot[] = [
  { row: 1, col: 1, length: 3, direction: "across", id: "across_1_1" },
  { row: 2, col: 1, length: 3, direction: "across", id: "across_2_1" },
  { row: 3, col: 1, length: 3, direction: "across", id: "across_3_1" },
  { row: 1, col: 1, length: 3, direction: "down", id: "down_1_1" },
  { row: 1, col: 2, length: 3, direction: "down", id: "down_1_2" },
  { row: 1, col: 3, length: 3, direction: "down", id: "down_1_3" },
];

export const dict5x5: WordEntry[] = [
  { answer: "ABC", clue: "abc", frequency: 0 },
  { answer: "DEF", clue: "def", frequency: 1 },
  { answer: "GHI", clue: "ghi", frequency: 2 },
  { answer: "ADG", clue: "adg", frequency: 3 },
  { answer: "BEH", clue: "beh", frequency: 4 },
  { answer: "CFI", clue: "cfi", frequency: 5 },
];
