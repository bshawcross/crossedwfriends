import { describe, it, expect } from 'vitest';
import { normalizeAnswer, answerLen } from '../../lib/candidatePool';

describe('normalizeAnswer', () => {
  it('strips non-letters and uppercases', () => {
    expect(normalizeAnswer('  spider-man ')).toBe('SPIDERMAN');
    expect(normalizeAnswer("don't stop" )).toBe('DONTSTOP');
  });
});

describe('answerLen', () => {
  it('computes length after normalization', () => {
    expect(answerLen(' hi! ')).toBe(2);
    expect(answerLen('123abc')).toBe(3);
  });
});
