import { describe, it, expect } from 'vitest';
import { cleanClue } from '../lib/clueClean';

describe('cleanClue', () => {
  it('decodes HTML entities', () => {
    expect(cleanClue('Fish &amp; Chips &#039;sides&#039;')).toBe("Fish & Chips 'sides'");
  });
  it('removes HTML tags', () => {
    expect(cleanClue('Solve <b>this</b> clue')).toBe('Solve this clue');
  });
  it('strips URLs', () => {
    expect(cleanClue('Visit https://example.com for more')).toBe('Visit for more');
  });
  it('removes enumeration in parentheses', () => {
    expect(cleanClue('Alpha beta (5,3)')).toBe('Alpha beta');
  });
});
