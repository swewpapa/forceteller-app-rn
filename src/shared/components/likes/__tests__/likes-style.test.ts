import { formatLikeCount } from '@/shared/components/likes/likes-style';

describe('formatLikeCount', () => {
  it('천단위 콤마', () => {
    expect(formatLikeCount(0)).toBe('0');
    expect(formatLikeCount(999)).toBe('999');
    expect(formatLikeCount(1000)).toBe('1,000');
    expect(formatLikeCount(9999)).toBe('9,999');
    expect(formatLikeCount(1234567)).toBe('1,234,567');
  });

  it('음수는 0으로 클램프, 소수는 버림', () => {
    expect(formatLikeCount(-5)).toBe('0');
    expect(formatLikeCount(12.9)).toBe('12');
  });
});
