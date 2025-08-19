import { isValidFill } from "@/utils/validateWord";
import { getFallback } from "@/utils/getFallback";
import { logInfo, logWarn } from "@/utils/logger";
import type { WordEntry } from "./puzzle";
import type { Slot } from "./slotFinder";

export type SolverSlot = Slot & { direction: "across" | "down"; id: string };

export interface SolveParams {
  board: string[][];
  slots: SolverSlot[];
  heroes?: WordEntry[];
  dict: WordEntry[];
  opts?: {
    allow2?: boolean;
    heroThreshold?: number;
    maxFillAttempts?: number;
    maxFallbackRate?: number;
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
  const { board, slots, dict } = params;
  const heroes: WordEntry[] = [...(params.heroes || [])];
  const heroThreshold = params.opts?.heroThreshold ?? 10;
  const maxFillAttempts = params.opts?.maxFillAttempts ?? 100000;
  const MAX_FALLBACK_RATE = params.opts?.maxFallbackRate ?? 0.1;
  const totalSlots = slots.length;
  let fallbackCount = 0;
  const minLen = params.opts?.allow2 ? 2 : 3;

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
  const slotIntersections = new Map<string, Set<string>>();
  const slotById = new Map(slots.map((s) => [s.id, s]));
  for (const s of slots) {
    let count = 0;
    const set = new Set<string>();
    for (let i = 0; i < s.length; i++) {
      const r = s.direction === "across" ? s.row : s.row + i;
      const c = s.direction === "across" ? s.col + i : s.col;
      const key = `${r}_${c}`;
      const others = cellSlots.get(key) || [];
      if (others.length > 1) {
        count++;
        for (const o of others) if (o.id !== s.id) set.add(o.id);
      }
    }
    intersectionCount.set(s.id, count);
    slotIntersections.set(s.id, set);
  }

  const assignments = new Map<string, WordEntry>();
  const heroAttempts = new Map<string, number>();
  let attempts = 0;
  let failureReason = "max_fill_attempts";

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
    return changed;
  };

  const unplace = (changed: string[]): void => {
    for (const key of changed) {
      const [r, c] = key.split("_").map(Number);
      board[r][c] = "";
    }
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

  const candidatesFor = (pattern: string[], len: number): WordEntry[] => {
    const heroCandidates = heroes.filter(
      (w) =>
        w.answer.length === len &&
        pattern.every((ch, i) => !ch || w.answer[i] === ch) &&
        isValidFill(w.answer, minLen),
    );
    const dictCandidates = dict.filter(
      (w) =>
        w.answer.length === len &&
        pattern.every((ch, i) => !ch || w.answer[i] === ch) &&
        isValidFill(w.answer, minLen),
    );
    const cands = [...heroCandidates, ...dictCandidates];
    const fb = getFallback(len, pattern, { allow2: params.opts?.allow2 });
    if (fb && isValidFill(fb, minLen)) cands.push({ answer: fb, clue: fb });
    return cands;
  };

  const candidateCount = (slot: SolverSlot): number =>
    candidatesFor(getLetters(slot), slot.length).length;

  const orderSlots = (remaining: SolverSlot[]): SolverSlot[] =>
    [...remaining].sort((a, b) => {
      const ca = candidateCount(a);
      const cb = candidateCount(b);
      if (ca !== cb) return ca - cb;
      const ia = intersectionCount.get(a.id) || 0;
      const ib = intersectionCount.get(b.id) || 0;
      if (ia !== ib) return ib - ia;
      if (a.length !== b.length) return b.length - a.length;
      return 0;
    });

  const backtrack = (): boolean => {
    if (assignments.size === slots.length) return true;
    if (attempts >= maxFillAttempts) {
      logInfo("backtrack", { attempts, reason: "max_fill_attempts" });
      failureReason = "max_fill_attempts";
      return false;
    }

    const remaining = slots.filter((s) => !assignments.has(s.id));
    const ordered = orderSlots(remaining);
    const slot = ordered[0];
    const candidates = candidatesFor(getLetters(slot), slot.length);
    for (const cand of candidates) {
      attempts++;
      if (!canPlace(slot, cand.answer)) continue;
      const changed = place(slot, cand.answer);
      assignments.set(slot.id, cand);
      const removeFrom = heroes.includes(cand)
        ? heroes
        : dict.includes(cand)
        ? dict
        : null;
      const isFallback = !removeFrom;
      if (removeFrom) {
        const idx = removeFrom.indexOf(cand);
        removeFrom.splice(idx, 1);
      }
      if (isFallback) {
        logInfo("fallback_word_used", { length: slot.length, answer: cand.answer });
        fallbackCount++;
        const rate = fallbackCount / totalSlots;
        if (rate > MAX_FALLBACK_RATE) {
          logWarn("fallback_rate_exceeded", { rate });
          assignments.delete(slot.id);
          unplace(changed);
          fallbackCount--;
          failureReason = "fallback_rate_exceeded";
          return false;
        }
      }
      let dead = false;
      const neighbors = slotIntersections.get(slot.id) || new Set();
      for (const nid of neighbors) {
        if (assignments.has(nid)) continue;
        const ns = slotById.get(nid)!;
        const count = candidatesFor(getLetters(ns), ns.length).length;
        if (count === 0) {
          dead = true;
          break;
        }
      }
      if (!dead && backtrack()) return true;
      if (failureReason === "fallback_rate_exceeded") {
        assignments.delete(slot.id);
        unplace(changed);
        if (removeFrom) removeFrom.push(cand);
        if (isFallback) fallbackCount--;
        return false;
      }
      assignments.delete(slot.id);
      unplace(changed);
      if (removeFrom) removeFrom.push(cand);
      if (isFallback) fallbackCount--;
      logInfo("backtrack", { slot: slot.id, attempts });
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
      if (attempts >= maxFillAttempts) {
        logInfo("backtrack", { attempts, reason: "max_fill_attempts" });
        failureReason = "max_fill_attempts";
        return false;
      }
    }
    return false;
  };

  const success = backtrack();
  if (success) {
    return { ok: true, assignments };
  }
  return { ok: false, reason: failureReason, attempts };
}

