import { isValidFill } from "@/utils/validateWord";
import { logInfo, logWarn } from "@/utils/logger";
import type { WordEntry } from "./puzzle";
import type { Slot } from "./slotFinder";
import seedrandom from "seedrandom";

export type SolverSlot = Slot & { direction: "across" | "down"; id: string };

export interface SolveParams {
  board: string[][];
  slots: SolverSlot[];
  heroes?: WordEntry[];
  dict: WordEntry[];
  rng?: () => number;
  opts?: {
    heroThreshold?: number;
    maxBranchAttempts?: number;
    maxTotalAttempts?: number;
    maxTimeBudgetMs?: number;
    gridSize?: number;
    patternSet?: string;
    dictsPath?: string;
  };
}

export interface SolveSuccess {
  ok: true;
  assignments: Map<string, WordEntry>;
}

export interface SolveFailure {
  ok: false;
  reason: string;
  attempts: number;
}

export type SolveResult = SolveSuccess | SolveFailure;

export function solve(params: SolveParams): SolveResult {
  const { board, slots } = params;
  const rng = params.rng ?? Math.random;
  const shuffle = <T>(arr: T[]): void => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  const heroes: WordEntry[] = [...(params.heroes || [])];
  const dict: WordEntry[] = [...params.dict];
  shuffle(heroes);
  shuffle(dict);
  const heroThreshold = params.opts?.heroThreshold ?? 10;
  const maxBranchAttempts = params.opts?.maxBranchAttempts ?? 100000;
  const maxTotalAttempts = params.opts?.maxTotalAttempts ?? Infinity;
  const maxTimeBudgetMs = params.opts?.maxTimeBudgetMs ?? Infinity;
  const startTime = Date.now();
  const minLen = 3;

  for (const s of slots) {
    if (s.length < minLen) {
      const meta =
        s.direction === "across"
          ? { type: s.direction, r: s.row, c0: s.col, c1: s.col + s.length - 1, len: s.length }
          : {
              type: s.direction,
              r: s.col,
              c0: s.row,
              c1: s.row + s.length - 1,
              len: s.length,
            };
      logInfo("slot_too_short", meta);
      return { ok: false, reason: "slot_too_short", attempts: 0 };
    }
  }

  // Precompute intersection metadata
  const cellSlots = new Map<string, SolverSlot[]>();
  for (const s of slots) {
    for (let i = 0; i < s.length; i++) {
      const r = s.direction === "across" ? s.row : s.row + i;
      const c = s.direction === "across" ? s.col + i : s.col;
      const key = `${r}_${c}`;
      if (!cellSlots.has(key)) cellSlots.set(key, []);
      cellSlots.get(key)!.push(s);
    }
  }
  const intersectionCount = new Map<string, number>();
  for (const s of slots) {
    let count = 0;
    for (let i = 0; i < s.length; i++) {
      const r = s.direction === "across" ? s.row : s.row + i;
      const c = s.direction === "across" ? s.col + i : s.col;
      const key = `${r}_${c}`;
      const others = cellSlots.get(key) || [];
      if (others.length > 1) {
        count++;
      }
    }
    intersectionCount.set(s.id, count);
  }

  const assignments = new Map<string, WordEntry>();
  const heroAttempts = new Map<string, number>();
  let branchAttempts = 0;
  let totalAttempts = 0;
  let failureReason = "dead_end";

  const checkCaps = (): boolean => {
    if (branchAttempts >= maxBranchAttempts || totalAttempts >= maxTotalAttempts) {
      logInfo("dead_end", {
        reason: branchAttempts >= maxBranchAttempts ? "max_branch_attempts" : "max_total_attempts",
        branchAttempts,
        totalAttempts,
      });
      return false;
    }
    if (Date.now() - startTime >= maxTimeBudgetMs) {
      logInfo("dead_end", {
        reason: "time_budget",
        branchAttempts,
        totalAttempts,
      });
      return false;
    }
    return true;
  };

  const canPlace = (slot: SolverSlot, word: string): boolean => {
    for (let i = 0; i < slot.length; i++) {
      const r = slot.direction === "across" ? slot.row : slot.row + i;
      const c = slot.direction === "across" ? slot.col + i : slot.col;
      const ch = board[r][c];
      if (ch && ch !== word[i]) return false;
    }
    return true;
  };

  const place = (slot: SolverSlot, word: string): string[] => {
    const changed: string[] = [];
    for (let i = 0; i < slot.length; i++) {
      const r = slot.direction === "across" ? slot.row : slot.row + i;
      const c = slot.direction === "across" ? slot.col + i : slot.col;
      if (!board[r][c]) {
        board[r][c] = word[i];
        changed.push(`${r}_${c}`);
      }
    }
    logInfo("place", {
      slotId: slot.id,
      row: slot.row,
      col: slot.col,
      direction: slot.direction,
      word,
    });
    return changed;
  };

  const unplace = (slot: SolverSlot, changed: string[], word: string): void => {
    for (const key of changed) {
      const [r, c] = key.split("_").map(Number);
      board[r][c] = "";
    }
    logInfo("undo", {
      slotId: slot.id,
      row: slot.row,
      col: slot.col,
      direction: slot.direction,
      word,
    });
  };

  const getLetters = (slot: SolverSlot): string[] => {
    const arr: string[] = [];
    for (let i = 0; i < slot.length; i++) {
      const r = slot.direction === "across" ? slot.row : slot.row + i;
      const c = slot.direction === "across" ? slot.col + i : slot.col;
      arr[i] = board[r][c];
    }
    return arr;
  };

  const BANNED_LENGTHS = new Set([2]);
  const candidatesFor = (pattern: string[], len: number): WordEntry[] => {
    if (BANNED_LENGTHS.has(len)) return [];
    const matches = (w: WordEntry) =>
      w.answer.length === len &&
      pattern.every((ch, i) => !ch || w.answer[i] === ch) &&
      isValidFill(w.answer, minLen);
    const heroCandidates = heroes.filter(matches).sort(
      (a, b) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity),
    );
    const dictCandidates = dict.filter(matches).sort(
      (a, b) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity),
    );
    return [...heroCandidates, ...dictCandidates];
  };

  const candidateCount = (slot: SolverSlot): number =>
    candidatesFor(getLetters(slot), slot.length).length;

  const orderSlots = (all: SolverSlot[]): SolverSlot[] => {
    const sortHeuristics = (arr: SolverSlot[]) =>
      arr.sort((a, b) => {
        if (b.length !== a.length) return b.length - a.length;
        const ca = candidateCount(a);
        const cb = candidateCount(b);
        if (ca !== cb) return ca - cb;
        const ia = intersectionCount.get(a.id) || 0;
        const ib = intersectionCount.get(b.id) || 0;
        return ib - ia;
      });
    const isAnchored = (s: SolverSlot) => getLetters(s).some(Boolean);
    const anchored = sortHeuristics(all.filter(isAnchored));
    const rest = sortHeuristics(all.filter((s) => !isAnchored(s)));
    return [...anchored, ...rest];
  };

  const slotOrder = orderSlots(slots);

  const rankLCV = (slot: SolverSlot, cands: WordEntry[]): WordEntry[] => {
    const scored = cands.map((cand) => {
      let score = 0;
      for (let i = 0; i < slot.length; i++) {
        const r = slot.direction === "across" ? slot.row : slot.row + i;
        const c = slot.direction === "across" ? slot.col + i : slot.col;
        const key = `${r}_${c}`;
        const others = cellSlots.get(key) || [];
        for (const o of others) {
          if (o.id === slot.id || assignments.has(o.id)) continue;
          const idx = o.direction === "across" ? c - o.col : r - o.row;
          const pattern = getLetters(o);
          pattern[idx] = cand.answer[i];
          const freq = candidatesFor(pattern, o.length).length;
          score += freq;
        }
      }
      return { cand, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.cand);
  };

  const anySlotZeroCandidates = (): boolean => {
    for (const s of slotOrder) {
      if (assignments.has(s.id)) continue;
      if (candidatesFor(getLetters(s), s.length).length === 0) return true;
    }
    return false;
  };

  const backtrack = (): boolean => {
    totalAttempts++;
    if (!checkCaps()) return false;

    if (assignments.size === slots.length) return true;

    const slot = slotOrder.find((s) => !assignments.has(s.id))!;
    const letters = getLetters(slot);
    const pattern = letters.join("");
    let candidates = rankLCV(slot, candidatesFor(letters, slot.length));
    if (candidates.length === 0) return false;

    for (const cand of candidates) {
      branchAttempts++;
      if (!checkCaps()) return false;
      if (!canPlace(slot, cand.answer)) continue;
      const changed = place(slot, cand.answer);
      assignments.set(slot.id, cand);
      logInfo("place_word", {
        slotId: slot.id,
        row: slot.row,
        col: slot.col,
        direction: slot.direction,
        pattern,
        word: cand.answer,
        attempts: branchAttempts,
      });
      const removeFrom = heroes.includes(cand)
        ? heroes
        : dict.includes(cand)
        ? dict
        : null;
      if (removeFrom) {
        const idx = removeFrom.indexOf(cand);
        removeFrom.splice(idx, 1);
      }
      const dead = anySlotZeroCandidates();
      if (!dead && backtrack()) return true;
      assignments.delete(slot.id);
      unplace(slot, changed, cand.answer);
      if (removeFrom) removeFrom.push(cand);
      const meta = {
        slotId: slot.id,
        row: slot.row,
        col: slot.col,
        direction: slot.direction,
        pattern,
        word: cand.answer,
        attempts: branchAttempts,
      };
      if (dead) {
        logInfo("dead_end", meta);
      }
      logInfo("backtrack", meta);
      if (heroes.includes(cand)) {
        const count = (heroAttempts.get(cand.answer) || 0) + 1;
        heroAttempts.set(cand.answer, count);
        if (count > heroThreshold) {
          const idx = heroes.indexOf(cand);
          if (idx !== -1) {
            heroes.splice(idx, 1);
            dict.push(cand);
            logWarn("hero_demoted", {
              word: cand.answer,
              reason: "no_fit_after_threshold",
            });
            continue;
          }
        }
      }
      if (!checkCaps()) return false;
    }
    return false;
  };

  const success = backtrack();
  if (success) {
    logInfo("success", { attempts: branchAttempts });
    return { ok: true, assignments };
  }
  logInfo("final_failure", { reason: failureReason, attempts: branchAttempts });
  return { ok: false, reason: failureReason, attempts: branchAttempts };
}

export interface SolveWithBacktrackingParams extends SolveParams {
  seed?: string;
  maxRestarts?: number;
}

export interface SolveWithBacktrackingLog {
  restart: number;
  reason: string;
  attempts: number;
  blacklisted?: string;
}

export interface SolveWithBacktrackingResult {
  ok: boolean;
  puzzle?: Map<string, WordEntry>;
  logs: SolveWithBacktrackingLog[];
}

export function solveWithBacktracking(
  params: SolveWithBacktrackingParams,
): SolveWithBacktrackingResult {
  const {
    seed,
    maxRestarts = 3,
    board,
    slots,
    heroes = [],
    dict,
    opts,
  } = params;
  const logs: SolveWithBacktrackingLog[] = [];
  const blacklist = new Set<string>();

  for (let restart = 0; restart < maxRestarts; restart++) {
    const seedSuffix = seed ? `${seed}-${restart}` : undefined;
    const rng = seedSuffix ? seedrandom(seedSuffix) : Math.random;
    const filteredDict = dict.filter((w) => !blacklist.has(w.answer));
    const filteredHeroes = heroes.filter((w) => !blacklist.has(w.answer));
    logInfo("restart_begin", { restart: restart + 1 });
    const result = solve({
      board: board.map((row) => [...row]),
      slots: [...slots],
      heroes: filteredHeroes,
      dict: filteredDict,
      rng,
      opts,
    });
    if (result.ok) {
      logInfo("restart_success", { restart: restart + 1, attempts: result.attempts });
      return { ok: true, puzzle: result.assignments, logs };
    }

    const bad = filteredDict[0]?.answer;
    if (bad) blacklist.add(bad);
    const log = {
      restart: restart + 1,
      reason: result.reason,
      attempts: result.attempts,
      blacklisted: bad,
    };
    logs.push(log);
    logInfo("restart_failed", log);
  }
  logInfo("restart_giveup", { restarts: maxRestarts });
  return { ok: false, logs };
}

