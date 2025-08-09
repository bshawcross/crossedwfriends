import { describe, it, expect } from 'vitest';
import { yyyyMmDd } from '../../utils/date';

describe('yyyyMmDd', () => {
  it('formats date as YYYY-MM-DD', () => {
    const d = new Date('2024-05-06T00:00:00Z');
    expect(yyyyMmDd(d, 'UTC')).toBe('2024-05-06');
  });
});
