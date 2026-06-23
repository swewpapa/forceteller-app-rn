import { formatDate } from '@/shared/utils';

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
