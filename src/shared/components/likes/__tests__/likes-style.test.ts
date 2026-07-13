import { buildLikesVisual, formatLikeCount } from '../likes-style';

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

describe('buildLikesVisual', () => {
  it('small: icon 12 / body-sm, large: icon 16 / label-md', () => {
    expect(buildLikesVisual('small', false)).toMatchObject({ iconSize: 12, labelVariant: 'body-sm' });
    expect(buildLikesVisual('large', false)).toMatchObject({ iconSize: 16, labelVariant: 'label-md' });
  });

  it('gap은 항상 4', () => {
    expect(buildLikesVisual('small', false).gap).toBe(4);
    expect(buildLikesVisual('large', true).gap).toBe(4);
  });

  it('liked → secondary.secondary, 아니면 text.subtle', () => {
    expect(buildLikesVisual('large', true).color).toBe('secondary.secondary');
    expect(buildLikesVisual('large', false).color).toBe('text.subtle');
  });
});
