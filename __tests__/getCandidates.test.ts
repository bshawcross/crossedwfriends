import { describe, it, expect, vi } from 'vitest';
import { getCandidates } from '../lib/getCandidates';
import type { WordEntry } from '../lib/puzzle';

const llmJson = JSON.stringify([
  { answer: 'apple', clue: 'fruit' },
  { answer: 'alpha', clue: 'first' },
  { answer: 'agate', clue: 'stone' },
]);

vi.mock('child_process', () => ({
  spawnSync: () => ({ status: 0, stdout: llmJson }),
  default: { spawnSync: () => ({ status: 0, stdout: llmJson }) },
}));

describe('getCandidates', () => {
  it('filters candidates by mask including LLM items', () => {
    const slot = { length: 5 };
    const pattern = ['A', '', '', '', 'E'];
    const topical: WordEntry[] = [
      { answer: 'AGATE', clue: '', frequency: 1 },
      { answer: 'ALERT', clue: '', frequency: 2 },
    ];
    const global: WordEntry[] = [
      { answer: 'ALARM', clue: '', frequency: 3 },
    ];
    process.env.TIER3_URL = 'http://example.com';
    const res = getCandidates(slot, pattern, topical, global);
    expect(res.map((c) => c.answer)).toEqual(['AGATE', 'APPLE']);
    expect(res).toHaveLength(2);
    delete process.env.TIER3_URL;
  });
});
