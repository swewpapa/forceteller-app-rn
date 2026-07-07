import { color } from '../resolvers/color';
import { textColor } from '../resolvers/text-color';
import { font } from '../resolvers/font';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {
  colors: { text: { default: '#191919' }, background: { surface: '#ffffff' } },
  typography: { 'label-lg': { fontSize: 16, fontWeight: '500' } },
} as unknown as ThemeContextValue;

describe('color resolver', () => {
  it('background/borderColor 경로 해석', () => {
    expect(color.resolve({ background: 'background.surface' }, theme)).toEqual({ backgroundColor: '#ffffff' });
    expect(color.resolve({ borderColor: 'text.default' }, theme)).toEqual({ borderColor: '#191919' });
  });
  it('미지정은 무출력, props 노출', () => {
    expect(color.resolve({}, theme)).toEqual({});
    expect(color.props).toEqual(['background', 'borderColor']);
  });
});

describe('textColor resolver', () => {
  it('color 경로 해석', () => {
    expect(textColor.resolve({ color: 'text.default' }, theme)).toEqual({ color: '#191919' });
    expect(textColor.resolve({}, theme)).toEqual({});
  });
});

describe('font resolver', () => {
  it('타입스케일 variant를 스타일 묶음으로', () => {
    expect(font.resolve({ font: 'label-lg' }, theme)).toEqual({ fontSize: 16, fontWeight: '500' });
    expect(font.resolve({}, theme)).toEqual({});
  });
});
