import { composeStyles } from '@/shared/style-engine/compose-styles';
import { background } from '@/shared/style-engine/resolvers/background';
import { padding } from '@/shared/style-engine/resolvers/spacing';
import type { ThemeContextValue } from '@/shared/theme';

const theme = { colors: { background: { surface: '#fff' } } } as unknown as ThemeContextValue;

describe('composeStyles', () => {
  it('base → 바인딩 순 병합', () => {
    expect(
      composeStyles({ color: 'surface' }, { height: 32 }, { color: background }, theme),
    ).toEqual({ height: 32, backgroundColor: '#fff' });
  });
  it('리졸버 출력이 base의 같은 키를 덮는다', () => {
    expect(
      composeStyles(
        { color: 'surface' },
        { backgroundColor: '#000000' },
        { color: background },
        theme,
      ),
    ).toEqual({ backgroundColor: '#fff' });
  });
  it('미지정 prop은 변환 미호출(무방출 중앙 가드)', () => {
    expect(composeStyles({}, undefined, { color: background }, theme)).toEqual({});
  });
  it('alias — 풀네임(뒤 선언)이 축약을 덮음', () => {
    const out = composeStyles(
      { p: '100', padding: '300' },
      undefined,
      { p: padding, padding },
      theme,
    );
    expect(out.paddingTop).toBe(24);
  });
  it('축약만 지정 시 축약 적용', () => {
    const out = composeStyles({ p: '100' }, undefined, { p: padding, padding }, theme);
    expect(out.paddingTop).toBe(8);
  });
  it('base 객체를 변형하지 않음(신선 accumulator)', () => {
    const base = { height: 10 };
    composeStyles({ color: 'surface' }, base, { color: background }, theme);
    expect(base).toEqual({ height: 10 });
  });
});
