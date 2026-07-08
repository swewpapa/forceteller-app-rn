import { aspectRatio } from '../resolvers/aspect-ratio';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {} as unknown as ThemeContextValue; // aspectRatio는 theme 미사용

describe('aspectRatio resolver', () => {
  it('number를 aspectRatio 스타일로 통과', () => {
    expect(aspectRatio(144 / 92, theme)).toEqual({ aspectRatio: 144 / 92 });
    expect(aspectRatio(1.905, theme)).toEqual({ aspectRatio: 1.905 });
  });
});
