import { spacing } from '../resolvers/spacing';
import { gap } from '../resolvers/gap';
import { backgroundColor } from '../resolvers/background-color';
import { radius } from '../resolvers/radius';
import { flow } from '../resolvers/flow';
import type { ThemeContextValue } from '@/shared/theme';

// spacing/gap read the token scale directly (aliased import), not theme — a stub theme is fine.
const theme = {} as unknown as ThemeContextValue;

describe('spacing resolver — padding', () => {
  it('스칼라 토큰을 4변으로 정규화', () => {
    expect(spacing.resolve({ padding: '300' }, theme)).toEqual({
      paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24,
    });
  });
  it('스칼라 원시 px 그대로', () => {
    expect(spacing.resolve({ padding: 14 }, theme)).toEqual({
      paddingTop: 14, paddingRight: 14, paddingBottom: 14, paddingLeft: 14,
    });
  });
  it('2-value [Y,X]', () => {
    expect(spacing.resolve({ padding: ['100', 14] }, theme)).toEqual({
      paddingTop: 8, paddingRight: 14, paddingBottom: 8, paddingLeft: 14,
    });
  });
  it('3-value [top,X,bottom]', () => {
    expect(spacing.resolve({ padding: ['100', 14, '300'] }, theme)).toEqual({
      paddingTop: 8, paddingRight: 14, paddingBottom: 24, paddingLeft: 14,
    });
  });
  it('4-value 시계방향 [t,r,b,l]', () => {
    expect(spacing.resolve({ padding: ['100', 14, '300', 2] }, theme)).toEqual({
      paddingTop: 8, paddingRight: 14, paddingBottom: 24, paddingLeft: 2,
    });
  });
  it('p는 padding alias', () => {
    expect(spacing.resolve({ p: '100' }, theme)).toEqual({
      paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8,
    });
  });
  it('padding이 p보다 우선', () => {
    expect(spacing.resolve({ padding: '300', p: '100' }, theme).paddingTop).toBe(24);
  });
  it('스칼라 0도 명시 방출(falsy 가드 회귀 방지)', () => {
    expect(spacing.resolve({ padding: 0 }, theme)).toEqual({
      paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
    });
  });
});

describe('spacing resolver — margin', () => {
  it('margin도 동일 shorthand로 4변 방출', () => {
    expect(spacing.resolve({ margin: ['100', 14] }, theme)).toEqual({
      marginTop: 8, marginRight: 14, marginBottom: 8, marginLeft: 14,
    });
  });
  it('m은 margin alias, margin이 m보다 우선', () => {
    expect(spacing.resolve({ m: '300' }, theme).marginTop).toBe(24);
    expect(spacing.resolve({ margin: '300', m: '100' }, theme).marginTop).toBe(24);
  });
  it('padding+margin 동시 방출', () => {
    expect(spacing.resolve({ padding: '100', margin: '300' }, theme)).toEqual({
      paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8,
      marginTop: 24, marginRight: 24, marginBottom: 24, marginLeft: 24,
    });
  });
  it('미지정은 무방출', () => {
    expect(spacing.resolve({}, theme)).toEqual({});
    expect(spacing.props).toEqual(['padding', 'p', 'margin', 'm']);
  });
});

describe('gap resolver', () => {
  it('토큰/원시px, 미지정 무방출', () => {
    expect(gap.resolve({ gap: '100' }, theme)).toEqual({ gap: 8 });
    expect(gap.resolve({ gap: 5 }, theme)).toEqual({ gap: 5 });
    expect(gap.resolve({}, theme)).toEqual({});
    expect(gap.props).toEqual(['gap']);
  });
});

const themeWithColors = {
  colors: { background: { surface: '#ffffff', inset: '#f4f4f4' } },
  radius: { md: 8, xl: 99 },
} as unknown as ThemeContextValue;

describe('backgroundColor resolver', () => {
  it('그룹키를 backgroundColor로 매핑', () => {
    expect(backgroundColor.resolve({ color: 'surface' }, themeWithColors)).toEqual({ backgroundColor: '#ffffff' });
    expect(backgroundColor.resolve({ color: 'inset' }, themeWithColors)).toEqual({ backgroundColor: '#f4f4f4' });
  });
  it('미지정 무방출, props', () => {
    expect(backgroundColor.resolve({}, themeWithColors)).toEqual({});
    expect(backgroundColor.props).toEqual(['color']);
  });
});

describe('radius resolver', () => {
  it('토큰 매핑 + 미지정 무방출', () => {
    expect(radius.resolve({ radius: 'md' }, themeWithColors)).toEqual({ borderRadius: 8 });
    expect(radius.resolve({}, themeWithColors)).toEqual({});
  });
});

describe('flow resolver', () => {
  it('justify/align 통과, 미지정 무방출', () => {
    expect(flow.resolve({ justify: 'center', align: 'flex-end' }, themeWithColors)).toEqual({
      justifyContent: 'center', alignItems: 'flex-end',
    });
    expect(flow.resolve({ justify: 'space-between' }, themeWithColors)).toEqual({ justifyContent: 'space-between' });
    expect(flow.resolve({}, themeWithColors)).toEqual({});
    expect(flow.props).toEqual(['justify', 'align']);
  });
});
