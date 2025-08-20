import { describe, it, expect } from 'vitest';
import { normalizeAnswer, buildCandidatePool } from '../../lib/candidatePool';

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
  it('normalizes, dedupes and merges fallback lists', () => {
    const primary = [
      ['cat', 'dog', 'multi word', 'bee'],
      ['DOG', 'fox']
    ];
    const pool = buildCandidatePool(primary);
    const len3 = pool.get(3) || [];
    // Primary words normalized and deduped
    expect(len3).toContain('CAT');
    expect(len3).toContain('DOG');
    expect(len3.filter((w) => w === 'DOG').length).toBe(1);
    expect(len3).toContain('BEE');
    expect(len3).toContain('FOX');
    // Fallback words merged (SUN is from fallback list)
    expect(len3).toContain('SUN');
    // Fallback pool provides longer lengths as well
    expect(pool.get(15)).toBeDefined();
  });
});
