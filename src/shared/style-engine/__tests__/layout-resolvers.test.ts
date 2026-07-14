import { padding, margin } from '@/shared/style-engine/resolvers/spacing';
import { gap } from '@/shared/style-engine/resolvers/gap';
import { radius } from '@/shared/style-engine/resolvers/radius';
import { justify, align } from '@/shared/style-engine/resolvers/alignment';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {} as unknown as ThemeContextValue; // padding/gap은 spacing 스케일 직접 참조

describe('padding resolver', () => {
  it('스칼라 토큰 → 4변', () => {
    expect(padding('300', theme)).toEqual({
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
    });
  });
  it('스칼라 원시 px', () => {
    expect(padding(14, theme)).toEqual({
      paddingTop: 14,
      paddingRight: 14,
      paddingBottom: 14,
      paddingLeft: 14,
    });
  });
  it('2-value [Y,X]', () => {
    expect(padding(['100', 14], theme)).toEqual({
      paddingTop: 8,
      paddingRight: 14,
      paddingBottom: 8,
      paddingLeft: 14,
    });
  });
  it('3-value [top,X,bottom]', () => {
    expect(padding(['100', 14, '300'], theme)).toEqual({
      paddingTop: 8,
      paddingRight: 14,
      paddingBottom: 24,
      paddingLeft: 14,
    });
  });
  it('4-value [t,r,b,l]', () => {
    expect(padding(['100', 14, '300', 2], theme)).toEqual({
      paddingTop: 8,
      paddingRight: 14,
      paddingBottom: 24,
      paddingLeft: 2,
    });
  });
  it('스칼라 0 명시 방출', () => {
    expect(padding(0, theme)).toEqual({
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    });
  });
});

describe('margin resolver', () => {
  it('동일 shorthand로 4변', () => {
    expect(margin(['100', 14], theme)).toEqual({
      marginTop: 8,
      marginRight: 14,
      marginBottom: 8,
      marginLeft: 14,
    });
  });
});

describe('gap resolver', () => {
  it('토큰/원시px', () => {
    expect(gap('100', theme)).toEqual({ gap: 8 });
    expect(gap(5, theme)).toEqual({ gap: 5 });
  });
});

const themeWithColors = {
  colors: { background: { surface: '#ffffff', inset: '#f4f4f4' } },
  radius: { md: 8, xl: 99 },
} as unknown as ThemeContextValue;

describe('radius resolver', () => {
  it('토큰 → borderRadius', () => {
    expect(radius('md', themeWithColors)).toEqual({ borderRadius: 8 });
  });
});

describe('alignment resolvers', () => {
  it('justify/align 통과', () => {
    expect(justify('center', themeWithColors)).toEqual({ justifyContent: 'center' });
    expect(align('flex-end', themeWithColors)).toEqual({ alignItems: 'flex-end' });
  });
});
