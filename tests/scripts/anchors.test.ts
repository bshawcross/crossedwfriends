import { describe, it, expect } from 'vitest';
import seedrandom from 'seedrandom';
import { findSlots, type Slot } from '../../lib/slotFinder';
import { candidatePoolByLength } from '../../lib/candidatePool';
import { selectAnchors } from '../../scripts/genDaily';

function crossingCounts(slots: { across: Slot[]; down: Slot[] }) {
  const cellCount = new Map<string, number>();
  for (const s of slots.across) {
    for (let i = 0; i < s.length; i++) {
      const key = `${s.row}_${s.col + i}`;
      cellCount.set(key, (cellCount.get(key) || 0) + 1);
    }
  }
  for (const s of slots.down) {
    for (let i = 0; i < s.length; i++) {
      const key = `${s.row + i}_${s.col}`;
      cellCount.set(key, (cellCount.get(key) || 0) + 1);
    }
  }
  const crossings = (s: Slot, orientation: 'across' | 'down') => {
    let count = 0;
    for (let i = 0; i < s.length; i++) {
      const r = orientation === 'across' ? s.row : s.row + i;
      const c = orientation === 'across' ? s.col + i : s.col;
      if ((cellCount.get(`${r}_${c}`) || 0) > 1) count++;
    }
    return count;
  };
  return crossings;
}

describe('selectAnchors', () => {
  it('chooses anchors that fit and have six or more crossings', () => {
    const size = 15;
    // Build deterministic grid with center 15 slot and two 13 slots
    const grid = Array.from({ length: size }, () => Array(size).fill(false));
    grid[6][0] = grid[6][14] = true;
    grid[8][0] = grid[8][14] = true;
    const gridStr = grid.map((row) => row.map((b) => (b ? '#' : '.')).join(''));
    const slots = findSlots(gridStr);
    const anchors = selectAnchors(
      slots,
      size,
      candidatePoolByLength,
      seedrandom('a'),
      new Set(),
    );
    expect(anchors).toHaveLength(2);
    expect(anchors.some((w) => w.length === 15)).toBe(true);
    expect(anchors.some((w) => w.length === 13)).toBe(true);

    const crossings = crossingCounts(slots);
    const centerRow = Math.floor(size / 2);
    const center15 = slots.across.find(
      (s) => s.length === 15 && s.row === centerRow && s.col === 0,
    );
    const thirteen = slots.across.find(
      (s) => s.length === 13 && s.col === 1 &&
        (s.row === centerRow - 1 || s.row === centerRow + 1),
    );
    expect(center15 && crossings(center15, 'across')).toBeGreaterThanOrEqual(6);
    expect(thirteen && crossings(thirteen, 'across')).toBeGreaterThanOrEqual(6);
  });
});
