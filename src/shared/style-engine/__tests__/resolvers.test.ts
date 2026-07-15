import { background } from '@/shared/style-engine/resolvers/background';
import { textColor } from '@/shared/style-engine/resolvers/text-color';
import { font } from '@/shared/style-engine/resolvers/font';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {
  colors: { text: { default: '#191919' }, background: { surface: '#ffffff' } },
  typography: { 'label-lg': { fontSize: 16, fontWeight: '500' } },
} as unknown as ThemeContextValue;

describe('background resolver', () => {
  it('그룹키 → backgroundColor', () => {
    expect(background('surface', theme)).toEqual({ backgroundColor: '#ffffff' });
  });
});

describe('textColor resolver', () => {
  it('ColorPath → color', () => {
    expect(textColor('text.default', theme)).toEqual({ color: '#191919' });
  });
});

describe('font resolver', () => {
  it('타입스케일 variant → 스타일 묶음', () => {
    expect(font('label-lg', theme)).toEqual({ fontSize: 16, fontWeight: '500' });
  });
});
