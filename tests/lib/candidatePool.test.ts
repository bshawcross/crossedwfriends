import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  normalizeAnswer,
  buildCandidatePool,
  candidatePoolByLength,
} from '../../lib/candidatePool';

describe('normalizeAnswer', () => {
  it('uppercases and trims valid single words', () => {
    expect(normalizeAnswer('  hello ')).toBe('HELLO');
  });

  it('rejects multi-word or punctuated entries', () => {
    expect(normalizeAnswer('New York')).toBeNull();
    expect(normalizeAnswer('spider-man')).toBeNull();
    expect(normalizeAnswer('hi!')).toBeNull();
  });
});

describe('buildCandidatePool', () => {
  it('normalizes and dedupes words from sources', () => {
    const primary = [
      ['cat', 'dog', 'multi word', 'bee'],
      ['DOG', 'fox'],
    ];
    const pool = buildCandidatePool(primary);
    const len3 = pool.get(3) || [];
    // Primary words normalized and deduped
    expect(len3).toContain('CAT');
    expect(len3).toContain('DOG');
    expect(len3.filter((w) => w === 'DOG').length).toBe(1);
    expect(len3).toContain('BEE');
    expect(len3).toContain('FOX');
    expect(len3).not.toContain('MULTI WORD');
  });
});

describe('candidatePoolByLength', () => {
  it('loads banks and normalizes entries', () => {
    const len13 = candidatePoolByLength.get(13) || [];
    expect(len13.length).toBeGreaterThan(0);
    expect(len13.every((w) => /^[A-Z]+$/.test(w))).toBe(true);
  });

  it('matches counts from bank files', () => {
    const bankDir = path.join(process.cwd(), 'banks');
    const files = ['anchors_13.txt', 'anchors_15.txt', 'mid_7to12.txt', 'glue_3to6.txt'];
    const expected = new Map<number, Set<string>>();
    for (const f of files) {
      const lines = fs.readFileSync(path.join(bankDir, f), 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const word = normalizeAnswer(line);
        if (!word) continue;
        const len = word.length;
        if (!expected.has(len)) expected.set(len, new Set());
        expected.get(len)!.add(word);
      }
    }
    for (const [len, words] of expected.entries()) {
      const pool = candidatePoolByLength.get(len) || [];
      expect(pool.length).toBe(words.size);
    }
  });
});
