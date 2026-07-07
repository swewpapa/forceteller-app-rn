import { resolveColorPath } from '../color-path';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {
  colors: {
    text: { default: '#191919', muted: '#adadad' },
    background: { surface: '#ffffff' },
    stroke: { subtle: '#e8e8e8' },
  },
} as unknown as ThemeContextValue;

describe('resolveColorPath', () => {
  it('그룹.키 경로를 색 문자열로 해석한다', () => {
    expect(resolveColorPath('text.default', theme)).toBe('#191919');
    expect(resolveColorPath('background.surface', theme)).toBe('#ffffff');
    expect(resolveColorPath('stroke.subtle', theme)).toBe('#e8e8e8');
  });
});
