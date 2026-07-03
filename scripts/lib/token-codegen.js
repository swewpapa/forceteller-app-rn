// scripts/lib/token-codegen.js
'use strict';

const HEX_RE = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
// 고정 리스트인 이유: ModeColors 타입 형태를 예측 가능하게 유지 — 새 그룹은 의도적 코드 변경으로만 추가.
const SEMANTIC_GROUPS = ['primary', 'secondary', 'accent', 'background', 'text', 'stroke'];

function camelize(str) {
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/** 시맨틱 키 → 코드 키. accent 그룹은 접두 중복 제거(on-accent-wood → onWood). */
function toCodeKey(group, key) {
  if (group === 'accent') {
    return camelize(key.replace(/^on-accent-/, 'on-').replace(/^accent-/, ''));
  }
  return camelize(key);
}

/** '{palette.gray.900}' → ['palette','gray','900'], 참조가 아니면 null */
function parseReference(value) {
  if (typeof value !== 'string') return null;
  const m = /^\{([^{}]+)\}$/.exec(value);
  return m ? m[1].split('.') : null;
}

function getAtPath(root, path) {
  let node = root;
  for (const key of path) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[key];
  }
  return node;
}

function isColorLeaf(node) {
  return (
    node != null &&
    typeof node === 'object' &&
    node.type === 'color' &&
    typeof node.value === 'string'
  );
}

/**
 * 색상 토큰 값을 팔레트 경로 또는 리터럴 hex로 해석한다.
 * - {palette.*} → primitive.palette에서 조회 → { kind: 'palette', path }
 * - 시맨틱 상호참조 → scopeRoot(해당 테마) 우선, 없으면 primitiveRoot에서 재귀 해석
 * - 참조가 아니면 hex 검증 후 { kind: 'literal', hex }
 */
function resolveColor(rawValue, scopeRoot, primitiveRoot, seen = new Set()) {
  const ref = parseReference(rawValue);
  if (!ref) {
    if (!HEX_RE.test(rawValue)) throw new Error(`invalid hex value: ${rawValue}`);
    return { kind: 'literal', hex: rawValue.toLowerCase() };
  }
  const refKey = ref.join('.');
  if (seen.has(refKey)) throw new Error(`circular reference: {${refKey}}`);
  seen.add(refKey);

  if (ref[0] === 'palette') {
    const leaf = getAtPath(primitiveRoot.palette, ref.slice(1));
    if (!isColorLeaf(leaf)) throw new Error(`broken reference: {${refKey}}`);
    if (parseReference(leaf.value)) {
      throw new Error(`palette value must be a hex literal: {${refKey}}`);
    }
    if (!HEX_RE.test(leaf.value)) {
      throw new Error(`invalid hex value at {${refKey}}: ${leaf.value}`);
    }
    return { kind: 'palette', path: ref.slice(1) };
  }

  const leaf = getAtPath(scopeRoot, ref) ?? getAtPath(primitiveRoot, ref);
  if (!isColorLeaf(leaf)) throw new Error(`broken reference: {${refKey}}`);
  return resolveColor(leaf.value, scopeRoot, primitiveRoot, seen);
}

function collectSemanticKeys(themeScope) {
  const keys = [];
  for (const [group, entries] of Object.entries(themeScope)) {
    for (const key of Object.keys(entries)) keys.push(`${group}.${key}`);
  }
  return keys.sort();
}

function validateSymmetry(day, night) {
  const dayKeys = collectSemanticKeys(day);
  const nightKeys = collectSemanticKeys(night);
  const dayOnly = dayKeys.filter((k) => !nightKeys.includes(k));
  const nightOnly = nightKeys.filter((k) => !dayKeys.includes(k));
  if (dayOnly.length || nightOnly.length) {
    throw new Error(
      `theme key mismatch — day only: [${dayOnly.join(', ')}], night only: [${nightOnly.join(', ')}]`,
    );
  }
}

function isDimensionLeaf(node) {
  return (
    node != null &&
    typeof node === 'object' &&
    node.type === 'dimension' &&
    typeof node.value === 'number'
  );
}

/** primitive.spacing/radius → { 키: 숫자 } 플랫 레코드. 키는 원본 그대로(숫자든 alias든) 보존. */
function buildDimensionScale(scaleNode, label) {
  const out = {};
  for (const [key, leaf] of Object.entries(scaleNode)) {
    if (!isDimensionLeaf(leaf)) {
      throw new Error(`invalid dimension: ${label}.${key}`);
    }
    out[key] = leaf.value;
  }
  return out;
}

const TYPOGRAPHY_FIELD_RENAMES = { textDecoration: 'textDecorationLine' };
const TYPOGRAPHY_FIELDS = [
  'fontSize',
  'fontFamily',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textDecoration',
];

/**
 * primitive.typography → { variant명: TextStyle 필드 레코드 }.
 * type이 "typography"가 아닌 형제 키(font-family, numeric 등)는 무시한다 —
 * 용도가 불확실한 채로 남아있는 토큰 항목을 codegen이 임의로 해석하지 않기 위함.
 */
function buildTypography(typographyNode) {
  const out = {};
  for (const [key, node] of Object.entries(typographyNode)) {
    if (!node || node.type !== 'typography') continue;
    const value = node.value || {};
    const style = {};
    for (const [field, raw] of Object.entries(value)) {
      if (!TYPOGRAPHY_FIELDS.includes(field)) {
        throw new Error(
          `unknown typography field: ${key}.${field} — TYPOGRAPHY_FIELDS에 추가 필요`,
        );
      }
      const outField = TYPOGRAPHY_FIELD_RENAMES[field] || field;
      style[outField] = raw;
    }
    out[key] = style;
  }
  return out;
}

/** primitive.palette → { 코드그룹명: { 단계: hex } | hex(white 등 스칼라) } */
function buildPalette(paletteNode) {
  const out = {};
  for (const [name, node] of Object.entries(paletteNode)) {
    const codeName = camelize(name);
    if (isColorLeaf(node)) {
      if (!HEX_RE.test(node.value)) throw new Error(`invalid hex value: palette.${name}`);
      out[codeName] = node.value.toLowerCase();
      continue;
    }
    const steps = {};
    for (const [step, leaf] of Object.entries(node)) {
      if (!isColorLeaf(leaf) || !HEX_RE.test(leaf.value)) {
        throw new Error(`invalid palette leaf: palette.${name}.${step}`);
      }
      steps[step] = leaf.value.toLowerCase();
    }
    out[codeName] = steps;
  }
  return out;
}

function buildSemantic(themeScope, primitiveRoot) {
  const out = {};
  for (const group of SEMANTIC_GROUPS) {
    const entries = themeScope[group];
    if (!entries) throw new Error(`missing semantic group: ${group}`);
    const groupOut = {};
    for (const [key, leaf] of Object.entries(entries)) {
      if (!isColorLeaf(leaf)) throw new Error(`invalid token: ${group}.${key}`);
      groupOut[toCodeKey(group, key)] = resolveColor(leaf.value, themeScope, primitiveRoot);
    }
    out[group] = groupOut;
  }
  const unknown = Object.keys(themeScope).filter(
    (g) => !SEMANTIC_GROUPS.includes(g),
  );
  if (unknown.length) {
    throw new Error(
      `unknown semantic group: ${unknown.join(', ')} — SEMANTIC_GROUPS에 추가 필요`,
    );
  }
  return out;
}

const HEADER = `// AUTO-GENERATED by scripts/generate-tokens.js — DO NOT EDIT.
// Source: assets/design-tokens/tokens.json ("npm run generate:tokens"로 재생성)
`;

function renderDimensionScaleTs(exportName, scale) {
  const lines = [HEADER, `export const ${exportName} = {`];
  for (const [key, value] of Object.entries(scale)) {
    lines.push(`  ${key}: ${value},`);
  }
  lines.push('} as const;', '');
  return lines.join('\n');
}

function renderStyleValue(v) {
  return typeof v === 'string' ? `'${v}'` : String(v);
}

function renderTypographyTs(variants) {
  const names = Object.keys(variants);
  const lines = [HEADER, "import type { TextStyle } from 'react-native';", ''];
  lines.push('export type TypographyVariant =');
  lines.push(names.map((n) => `  | '${n}'`).join('\n') + ';');
  lines.push('');
  lines.push(
    'export const typographyStyles: Record<TypographyVariant, TextStyle> = {',
  );
  for (const name of names) {
    lines.push(`  '${name}': {`);
    for (const [field, v] of Object.entries(variants[name])) {
      lines.push(`    ${field}: ${renderStyleValue(v)},`);
    }
    lines.push('  },');
  }
  lines.push('};', '');
  return lines.join('\n');
}

function renderPaletteRef(path) {
  const [head, ...rest] = path;
  const group = camelize(head);
  return rest.length === 0 ? `palette.${group}` : `palette.${group}[${rest[0]}]`;
}

function renderValue(resolved) {
  return resolved.kind === 'palette' ? renderPaletteRef(resolved.path) : `'${resolved.hex}'`;
}

function renderPaletteTs(palette) {
  const lines = [HEADER, 'export const palette = {'];
  for (const [group, steps] of Object.entries(palette)) {
    if (typeof steps === 'string') {
      lines.push(`  ${group}: '${steps}',`);
      continue;
    }
    lines.push(`  ${group}: {`);
    for (const [step, hex] of Object.entries(steps)) {
      lines.push(`    ${step}: '${hex}',`);
    }
    lines.push('  },');
  }
  lines.push('} as const;', '');
  return lines.join('\n');
}

function renderModeColorsTs(day, night) {
  const lines = [HEADER, "import { palette } from './palette';", ''];
  lines.push('export type ModeColors = {');
  for (const [group, entries] of Object.entries(day)) {
    const fields = Object.keys(entries)
      .map((k) => `${k}: string`)
      .join('; ');
    lines.push(`  ${group}: { ${fields} };`);
  }
  lines.push('};', '');
  for (const [name, theme] of [
    ['dayColors', day],
    ['nightColors', night],
  ]) {
    lines.push(`export const ${name}: ModeColors = {`);
    for (const [group, entries] of Object.entries(theme)) {
      lines.push(`  ${group}: {`);
      for (const [key, resolved] of Object.entries(entries)) {
        lines.push(`    ${key}: ${renderValue(resolved)},`);
      }
      lines.push('  },');
    }
    lines.push('};', '');
  }
  return lines.join('\n');
}

function generate(tokens) {
  const primitive = tokens.primitive;
  const day = tokens.theme && tokens.theme.day;
  const night = tokens.theme && tokens.theme.night;
  if (!primitive || !primitive.palette || !day || !night) {
    throw new Error('tokens.json must contain primitive.palette, theme.day, theme.night');
  }
  if (!primitive.spacing || !primitive.radius || !primitive.typography) {
    throw new Error('tokens.json must contain primitive.spacing, primitive.radius, primitive.typography');
  }
  // primitive는 아직 소비하지 않는 그룹(예: shadow)을 더 가질 수 있다 — 여기선
  // 우리가 실제로 생성하는 것만 요구하고, 그 외 unknown 그룹은 의도적으로 무시한다.
  validateSymmetry(day, night);
  const palette = buildPalette(primitive.palette);
  const dayResolved = buildSemantic(day, primitive);
  const nightResolved = buildSemantic(night, primitive);
  const spacing = buildDimensionScale(primitive.spacing, 'spacing');
  const radius = buildDimensionScale(primitive.radius, 'radius');
  const typography = buildTypography(primitive.typography);
  return {
    paletteTs: renderPaletteTs(palette),
    modeColorsTs: renderModeColorsTs(dayResolved, nightResolved),
    spacingTs: renderDimensionScaleTs('spacing', spacing),
    radiusTs: renderDimensionScaleTs('radius', radius),
    typographyTs: renderTypographyTs(typography),
  };
}

module.exports = {
  camelize,
  toCodeKey,
  parseReference,
  resolveColor,
  validateSymmetry,
  buildPalette,
  buildSemantic,
  buildDimensionScale,
  renderDimensionScaleTs,
  buildTypography,
  renderTypographyTs,
  generate,
};
