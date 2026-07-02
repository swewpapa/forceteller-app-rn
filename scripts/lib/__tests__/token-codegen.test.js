// scripts/lib/__tests__/token-codegen.test.js
'use strict';

const {
  camelize,
  toCodeKey,
  resolveColor,
  validateSymmetry,
  generate,
} = require('../token-codegen');

const primitive = {
  palette: {
    gray: {
      100: { type: 'color', value: '#E8E8E8' },
      900: { type: 'color', value: '#191919' },
    },
    'kkarina-blue': { 500: { type: 'color', value: '#5870d0' } },
    white: { type: 'color', value: '#ffffff' },
  },
};

describe('camelize', () => {
  it('converts kebab-case to camelCase', () => {
    expect(camelize('kkarina-blue')).toBe('kkarinaBlue');
    expect(camelize('force-inversed')).toBe('forceInversed');
    expect(camelize('default')).toBe('default');
  });
});

describe('toCodeKey', () => {
  it('strips accent prefixes to avoid duplication', () => {
    expect(toCodeKey('accent', 'accent-wood')).toBe('wood');
    expect(toCodeKey('accent', 'on-accent-wood')).toBe('onWood');
    expect(toCodeKey('accent', 'accent-wood-tonal')).toBe('woodTonal');
    expect(toCodeKey('accent', 'on-accent-wood-tonal')).toBe('onWoodTonal');
  });
  it('camelizes keys of other groups', () => {
    expect(toCodeKey('primary', 'on-primary-disabled')).toBe('onPrimaryDisabled');
    expect(toCodeKey('text', 'force-inversed')).toBe('forceInversed');
  });
});

describe('resolveColor', () => {
  it('resolves a palette reference to a path', () => {
    expect(resolveColor('{palette.gray.900}', {}, primitive)).toEqual({
      kind: 'palette',
      path: ['gray', '900'],
    });
  });
  it('keeps an off-palette literal hex, lowercased', () => {
    expect(resolveColor('#C38800', {}, primitive)).toEqual({
      kind: 'literal',
      hex: '#c38800',
    });
  });
  it('resolves semantic cross-references scope-first', () => {
    const scope = {
      primary: { primary: { type: 'color', value: '{palette.white}' } },
    };
    expect(resolveColor('{primary.primary}', scope, primitive)).toEqual({
      kind: 'palette',
      path: ['white'],
    });
  });
  it('throws on a broken reference', () => {
    expect(() => resolveColor('{palette.gray.999}', {}, primitive)).toThrow(
      'broken reference',
    );
  });
  it('throws on a circular reference', () => {
    const scope = {
      a: { x: { type: 'color', value: '{b.y}' } },
      b: { y: { type: 'color', value: '{a.x}' } },
    };
    expect(() => resolveColor('{a.x}', scope, primitive)).toThrow('circular');
  });
  it('throws on an invalid hex literal', () => {
    expect(() => resolveColor('not-a-color', {}, primitive)).toThrow(
      'invalid hex',
    );
  });
});

describe('validateSymmetry', () => {
  it('throws listing asymmetric keys', () => {
    const day = { text: { default: {}, subtle: {} } };
    const night = { text: { default: {} } };
    expect(() => validateSymmetry(day, night)).toThrow(
      'day only: [text.subtle]',
    );
  });
});

describe('generate', () => {
  const semantic = {
    primary: { primary: { type: 'color', value: '{palette.gray.900}' } },
    secondary: { secondary: { type: 'color', value: '{palette.kkarina-blue.500}' } },
    accent: { 'accent-wood': { type: 'color', value: '{palette.gray.100}' } },
    background: { surface: { type: 'color', value: '{palette.white}' } },
    text: { force: { type: 'color', value: '#c38800' } },
    stroke: { primary: { type: 'color', value: '{primary.primary}' } },
  };
  const tokens = { primitive, theme: { day: semantic, night: semantic } };

  it('emits palette constants and semantic colors referencing them', () => {
    const { paletteTs, modeColorsTs } = generate(tokens);
    expect(paletteTs).toContain('export const palette = {');
    expect(paletteTs).toContain('kkarinaBlue: {');
    expect(paletteTs).toContain("900: '#191919',");
    expect(paletteTs).toContain("white: '#ffffff',");
    expect(modeColorsTs).toContain("import { palette } from './palette';");
    expect(modeColorsTs).toContain('export type ModeColors = {');
    expect(modeColorsTs).toContain('primary: palette.gray[900],');
    expect(modeColorsTs).toContain('wood: palette.gray[100],');
    expect(modeColorsTs).toContain("force: '#c38800',");
    expect(modeColorsTs).toContain('export const dayColors: ModeColors');
    expect(modeColorsTs).toContain('export const nightColors: ModeColors');
  });
  it('throws when a semantic group is missing', () => {
    const broken = {
      primitive,
      theme: { day: { ...semantic }, night: { ...semantic } },
    };
    delete broken.theme.day.stroke;
    delete broken.theme.night.stroke;
    expect(() => generate(broken)).toThrow('missing semantic group: stroke');
  });
  it('throws when tokens contain an unknown semantic group', () => {
    const withExtra = {
      primitive,
      theme: {
        day: { ...semantic, elevation: { level: { type: 'color', value: '{palette.white}' } } },
        night: { ...semantic, elevation: { level: { type: 'color', value: '{palette.white}' } } },
      },
    };
    expect(() => generate(withExtra)).toThrow('unknown semantic group: elevation');
  });
});
