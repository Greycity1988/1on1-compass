import { describe, expect, it } from 'vitest';
import { suggestCycleName } from './cycles';

describe('suggestCycleName', () => {
  it('names the period of the date', () => {
    expect(suggestCycleName('ko', new Date(2026, 10, 18))).toBe('2026년 연말 면담');
    expect(suggestCycleName('ko', new Date(2027, 2, 1))).toBe('2027년 상반기 면담');
    expect(suggestCycleName('en', new Date(2027, 7, 1))).toBe('2027 H2 review');
  });

  it('moves on to the next free period', () => {
    expect(suggestCycleName('ko', new Date(2026, 10, 18), ['2026년 연말 면담'])).toBe('2027년 상반기 면담');
    expect(suggestCycleName('en', new Date(2027, 2, 1), ['2027 H1 review', '2027 H2 review'])).toBe('2027 year-end review');
  });
});
