import { composeStyles, collectResolverProps } from '../compose-styles';
import { color } from '../resolvers/color';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {
  colors: { background: { surface: '#fff' }, text: { default: '#191919' } },
} as unknown as ThemeContextValue;

describe('collectResolverProps', () => {
  it('리졸버 소비 prop 합집합', () => {
    expect(collectResolverProps([color])).toEqual(new Set(['background', 'borderColor']));
  });
});

describe('composeStyles', () => {
  it('base → 리졸버 순 병합', () => {
    expect(composeStyles({ background: 'background.surface' }, { height: 32, borderColor: 'transparent' }, [color], theme))
      .toEqual({ height: 32, borderColor: 'transparent', backgroundColor: '#fff' });
  });
  it('리졸버가 base를 덮는다', () => {
    expect(composeStyles({ borderColor: 'text.default' }, { borderColor: 'transparent' }, [color], theme).borderColor)
      .toBe('#191919');
  });
  it('base 없으면 리졸버 결과만', () => {
    expect(composeStyles({ background: 'background.surface' }, undefined, [color], theme)).toEqual({ backgroundColor: '#fff' });
  });
});
