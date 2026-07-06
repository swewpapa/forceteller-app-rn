import type { ModeColors } from '@/shared/theme';
import { buildButtonStyle } from '../button-style';

// 리졸버는 primary/secondary 그룹만 조회하므로 최소 fixture로 충분하다.
const colors = {
  primary: {
    primary: '#191919',
    onPrimary: '#ffffff',
    primaryDisabled: '#cccccc',
    onPrimaryDisabled: '#ffffff',
  },
  secondary: {
    secondary: '#5870d0',
    onSecondary: '#ffffff',
    secondaryDisabled: '#d7e1f4',
    onSecondaryDisabled: '#ffffff',
  },
} as ModeColors;

const base = { color: 'primary', appearance: 'solid', size: 'lg', shape: 'rounded', disabled: false } as const;

describe('buildButtonStyle — solid 색', () => {
  it('solid primary 기본: bg=primary, text=onPrimary', () => {
    const r = buildButtonStyle({ ...base }, colors);
    expect(r.container.backgroundColor).toBe('#191919');
    expect(r.textColor).toBe('#ffffff');
    expect(r.container.borderWidth).toBeUndefined();
  });
  it('solid primary disabled: bg=primaryDisabled, text=onPrimaryDisabled', () => {
    const r = buildButtonStyle({ ...base, disabled: true }, colors);
    expect(r.container.backgroundColor).toBe('#cccccc');
    expect(r.textColor).toBe('#ffffff');
  });
  it('solid secondary 기본: bg=secondary, text=onSecondary', () => {
    const r = buildButtonStyle({ ...base, color: 'secondary' }, colors);
    expect(r.container.backgroundColor).toBe('#5870d0');
    expect(r.textColor).toBe('#ffffff');
  });
  it('solid secondary disabled: bg=secondaryDisabled', () => {
    const r = buildButtonStyle({ ...base, color: 'secondary', disabled: true }, colors);
    expect(r.container.backgroundColor).toBe('#d7e1f4');
  });
});

describe('buildButtonStyle — outline 색(color-aware, bg 투명)', () => {
  it('outline primary 기본: 투명 bg, border/text=primary', () => {
    const r = buildButtonStyle({ ...base, appearance: 'outline' }, colors);
    expect(r.container.backgroundColor).toBe('transparent');
    expect(r.container.borderWidth).toBe(1);
    expect(r.container.borderColor).toBe('#191919');
    expect(r.textColor).toBe('#191919');
  });
  it('outline secondary 기본: border/text=secondary', () => {
    const r = buildButtonStyle({ ...base, appearance: 'outline', color: 'secondary' }, colors);
    expect(r.container.borderColor).toBe('#5870d0');
    expect(r.textColor).toBe('#5870d0');
  });
  it('outline primary disabled: 투명 bg, border/text=primaryDisabled', () => {
    const r = buildButtonStyle({ ...base, appearance: 'outline', disabled: true }, colors);
    expect(r.container.backgroundColor).toBe('transparent');
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.textColor).toBe('#cccccc');
  });
  it('outline secondary disabled: border/text=secondaryDisabled', () => {
    const r = buildButtonStyle({ ...base, appearance: 'outline', color: 'secondary', disabled: true }, colors);
    expect(r.container.borderColor).toBe('#d7e1f4');
    expect(r.textColor).toBe('#d7e1f4');
  });
});

describe('buildButtonStyle — size', () => {
  it('lg: height 56, px 16, typography label-lg', () => {
    const r = buildButtonStyle({ ...base, size: 'lg' }, colors);
    expect(r.container.height).toBe(56);
    expect(r.container.paddingHorizontal).toBe(16);
    expect(r.typography).toBe('label-lg');
  });
  it('md: height 40, px 16, typography label-md', () => {
    const r = buildButtonStyle({ ...base, size: 'md' }, colors);
    expect(r.container.height).toBe(40);
    expect(r.container.paddingHorizontal).toBe(16);
    expect(r.typography).toBe('label-md');
  });
  it('sm: height 32, px 12, typography label-md', () => {
    const r = buildButtonStyle({ ...base, size: 'sm' }, colors);
    expect(r.container.height).toBe(32);
    expect(r.container.paddingHorizontal).toBe(12);
    expect(r.typography).toBe('label-md');
  });
});

describe('buildButtonStyle — shape', () => {
  it('rounded: borderRadius 8', () => {
    expect(buildButtonStyle({ ...base, shape: 'rounded' }, colors).container.borderRadius).toBe(8);
  });
  it('pill: borderRadius 99', () => {
    expect(buildButtonStyle({ ...base, shape: 'pill' }, colors).container.borderRadius).toBe(99);
  });
});

describe('buildButtonStyle — 공통 레이아웃', () => {
  it('row + center + gap 8', () => {
    const r = buildButtonStyle({ ...base }, colors);
    expect(r.container.flexDirection).toBe('row');
    expect(r.container.alignItems).toBe('center');
    expect(r.container.justifyContent).toBe('center');
    expect(r.container.gap).toBe(8);
  });
});
