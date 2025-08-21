import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  normalizeAnswer,
  answerLen,
  buildCandidatePool,
  candidatePoolByLength,
  banlist,
} from '../../lib/candidatePool';

describe('buildCandidatePool', () => {
  it('normalizes, dedupes, assigns frequency and respects banlist', () => {
    const primary = [
      ['cat', 'dog', 'multi word', 'bee'],
      ['DOG', 'fox'],
    ];
    banlist.add('FOX');
    const pool = buildCandidatePool(primary);
    const len3 = pool.get(3) || [];
    const answers = len3.map((w) => w.answer);
    expect(answers).toContain('CAT');
    expect(answers).toContain('DOG');
    expect(len3.filter((w) => w.answer === 'DOG').length).toBe(1);
    expect(answers).toContain('BEE');
    expect(answers).not.toContain('FOX');
    const cat = len3.find((w) => w.answer === 'CAT')!;
    const dog = len3.find((w) => w.answer === 'DOG')!;
    expect(cat.frequency).toBeLessThan(dog.frequency);
    banlist.delete('FOX');
  });
});

describe('candidatePoolByLength', () => {
  it('loads banks and normalizes entries', () => {
    const len13 = candidatePoolByLength.get(13) || [];
    expect(len13.length).toBeGreaterThan(0);
    expect(len13.every((w) => /^[A-Z]+$/.test(w.answer))).toBe(true);
  });

  it('matches counts from bank files', () => {
    const bankDir = path.join(process.cwd(), 'banks');
    const files = ['anchors_13.txt', 'anchors_15.txt', 'mid_7to12.txt', 'glue_3to6.txt'];
    const expected = new Map<number, Set<string>>();
    for (const f of files) {
      const lines = fs.readFileSync(path.join(bankDir, f), 'utf8').split(/\r?\n/);
      for (const line of lines) {
        if (answerLen(line) === 0) continue;
        const word = normalizeAnswer(line);
        const len = answerLen(line);
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
