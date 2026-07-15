import { composeStyles } from '@/shared/style-engine/compose-styles';
import { boxResolvers, flexResolvers } from '@/shared/components/layout/bindings';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {} as unknown as ThemeContextValue; // padding/margin은 spacing 스케일 직접 참조

describe('layout bindings — alias 우선순위(실제 바인딩)', () => {
  it('padding이 p를 덮는다', () => {
    expect(
      composeStyles({ p: '100', padding: '300' }, undefined, boxResolvers, theme).paddingTop,
    ).toBe(24);
  });
  it('margin이 m을 덮는다', () => {
    expect(
      composeStyles({ m: '100', margin: '300' }, undefined, boxResolvers, theme).marginTop,
    ).toBe(24);
  });
  it('flexResolvers도 동일 alias 순서 상속', () => {
    expect(
      composeStyles({ p: '100', padding: '300' }, undefined, flexResolvers, theme).paddingTop,
    ).toBe(24);
  });
});
