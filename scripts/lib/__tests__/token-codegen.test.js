// scripts/lib/__tests__/token-codegen.test.js
'use strict';

const {
  camelize,
  toCodeKey,
  resolveColor,
  validateSymmetry,
  buildDimensionScale,
  renderDimensionScaleTs,
  buildTypography,
  renderTypographyTs,
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

describe('buildDimensionScale', () => {
  it('extracts numeric values from dimension leaves, keys as-is', () => {
    const node = {
      50: { type: 'dimension', value: 4 },
      100: { type: 'dimension', value: 8 },
    };
    expect(buildDimensionScale(node, 'spacing')).toEqual({ 50: 4, 100: 8 });
  });
  it('throws when a leaf is not a dimension', () => {
    const node = { xs: { type: 'color', value: '#fff' } };
    expect(() => buildDimensionScale(node, 'radius')).toThrow(
      'invalid dimension: radius.xs',
    );
  });
  it('throws when value is not a number', () => {
    const node = { xs: { type: 'dimension', value: '2' } };
    expect(() => buildDimensionScale(node, 'radius')).toThrow(
      'invalid dimension: radius.xs',
    );
  });
});

describe('renderDimensionScaleTs', () => {
  it('renders a numeric-keyed const object', () => {
    const ts = renderDimensionScaleTs('spacing', { 50: 4, 100: 8 });
    expect(ts).toContain('export const spacing = {');
    expect(ts).toContain('50: 4,');
    expect(ts).toContain('100: 8,');
    expect(ts).toContain('} as const;');
  });
});

describe('buildTypography', () => {
  const typographyNode = {
    'font-family': { type: 'string', value: 'Noto Sans KR' },
    numeric: { type: 'dimension', value: 0 },
    'headline-lg': {
      type: 'typography',
      value: {
        fontSize: 28,
        fontFamily: 'Noto Sans KR',
        fontWeight: 700,
        lineHeight: 36,
        letterSpacing: -1,
        textDecoration: 'none',
      },
    },
  };

  it('extracts variants, ignoring the known non-variant siblings', () => {
    const result = buildTypography(typographyNode);
    expect(Object.keys(result)).toEqual(['headline-lg']);
  });

  it('throws on a non-typography entry that is not a known ignored sibling', () => {
    const withStray = {
      ...typographyNode,
      'headine-lg': { type: 'typograhpy', value: { fontSize: 28 } },
    };
    expect(() => buildTypography(withStray)).toThrow(
      'unexpected non-typography entry: headine-lg',
    );
  });

  it('throws when a variant is missing a required field', () => {
    const broken = {
      'headline-lg': {
        type: 'typography',
        value: {
          fontSize: 28,
          fontFamily: 'Noto Sans KR',
          fontWeight: 700,
          lineHeight: 36,
          letterSpacing: -1,
          // textDecoration 누락
        },
      },
    };
    expect(() => buildTypography(broken)).toThrow(
      'missing typography field: headline-lg.textDecoration',
    );
  });

  it('throws when no typography variants remain after filtering', () => {
    const onlySiblings = {
      'font-family': { type: 'string', value: 'Noto Sans KR' },
      numeric: { type: 'dimension', value: 0 },
    };
    expect(() => buildTypography(onlySiblings)).toThrow(
      'no typography variants',
    );
  });

  it('renames textDecoration to textDecorationLine', () => {
    const result = buildTypography(typographyNode);
    expect(result['headline-lg']).toEqual({
      fontSize: 28,
      fontFamily: 'Noto Sans KR',
      fontWeight: 700,
      lineHeight: 36,
      letterSpacing: -1,
      textDecorationLine: 'none',
    });
    expect(result['headline-lg']).not.toHaveProperty('textDecoration');
  });

  it('throws when a typography entry has an unknown field', () => {
    const broken = {
      'headline-lg': {
        type: 'typography',
        value: { fontSize: 28, unknownField: 1 },
      },
    };
    expect(() => buildTypography(broken)).toThrow(
      'unknown typography field: headline-lg.unknownField',
    );
  });
});

describe('renderTypographyTs', () => {
  it('renders a TypographyVariant union type and a style record', () => {
    const ts = renderTypographyTs({
      'headline-lg': {
        fontSize: 28,
        fontFamily: 'Noto Sans KR',
        fontWeight: 700,
        lineHeight: 36,
        letterSpacing: -1,
        textDecorationLine: 'none',
      },
    });
    expect(ts).toContain("import type { TextStyle } from 'react-native';");
    expect(ts).toContain('export type TypographyVariant =\n  | "headline-lg";');
    expect(ts).toContain(
      'export const typographyStyles: Record<TypographyVariant, TextStyle> = {',
    );
    expect(ts).toContain('"headline-lg": {');
    expect(ts).toContain('fontSize: 28,');
    expect(ts).toContain('textDecorationLine: "none",');
  });

  it('escapes quotes in string values so generated TS stays valid', () => {
    const ts = renderTypographyTs({
      'body-md': { fontFamily: "Helvetica's Neue", fontSize: 14 },
    });
    expect(ts).toContain(`fontFamily: "Helvetica's Neue",`);
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
  const primitiveWithScales = {
    ...primitive,
    spacing: { 50: { type: 'dimension', value: 4 } },
    radius: { xs: { type: 'dimension', value: 2 } },
    typography: {
      'headline-lg': {
        type: 'typography',
        value: {
          fontSize: 28,
          fontFamily: 'Noto Sans KR',
          fontWeight: 700,
          lineHeight: 36,
          letterSpacing: -1,
          textDecoration: 'none',
        },
      },
    },
  };
  const tokens = {
    primitive: primitiveWithScales,
    theme: { day: semantic, night: semantic },
  };

  it('emits palette constants and semantic colors referencing them', () => {
    const { paletteTs, modeColorsTs, spacingTs, radiusTs, typographyTs } = generate(tokens);
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
    expect(spacingTs).toContain('export const spacing = {');
    expect(spacingTs).toContain('50: 4,');
    expect(radiusTs).toContain('export const radius = {');
    expect(radiusTs).toContain('xs: 2,');
    expect(typographyTs).toContain('export type TypographyVariant');
    expect(typographyTs).toContain('"headline-lg"');
    expect(typographyTs).toContain('fontWeight: 700,');
  });
  it('throws when a semantic group is missing', () => {
    const broken = {
      primitive: primitiveWithScales,
      theme: { day: { ...semantic }, night: { ...semantic } },
    };
    delete broken.theme.day.stroke;
    delete broken.theme.night.stroke;
    expect(() => generate(broken)).toThrow('missing semantic group: stroke');
  });
  it('throws when tokens contain an unknown semantic group', () => {
    const withExtra = {
      primitive: primitiveWithScales,
      theme: {
        day: { ...semantic, elevation: { level: { type: 'color', value: '{palette.white}' } } },
        night: { ...semantic, elevation: { level: { type: 'color', value: '{palette.white}' } } },
      },
    };
    expect(() => generate(withExtra)).toThrow('unknown semantic group: elevation');
  });
  it('throws when primitive lacks spacing/radius/typography', () => {
    expect(() =>
      generate({ primitive, theme: { day: semantic, night: semantic } }),
    ).toThrow('primitive.spacing, primitive.radius, primitive.typography');
  });
});
