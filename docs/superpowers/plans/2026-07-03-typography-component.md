# Typography 컴포넌트 + 토큰 codegen 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `assets/design-tokens/tokens.json`의 spacing/radius/typography를 codegen으로 편입시키고(색상 전용이던 파이프라인을 확장), 그 위에 토큰 소비 컴포넌트의 표준 패턴을 확립하는 첫 사례로 `Typography` 컴포넌트를 구현한다.

**Architecture:** `scripts/generate-theme.js`→`scripts/generate-tokens.js`로 확장(spacing.ts/radius.ts를 `theme/generated/`에, typography 데이터는 `components/Typography/`에 콜로케이트) → `Typography` 컴포넌트가 `variant`(필수)+`color`(text 그룹 한정)+`style`(레이아웃 탈출구) 3축으로 동작. 스펙: [2026-07-03-typography-component-design.md](../specs/2026-07-03-typography-component-design.md)

**Tech Stack:** 기존 Node CJS codegen 파이프라인(`scripts/lib/token-codegen.js`) 확장, React Native `TextStyle`/`TextProps`, jest.

---

## 실행 전제

1. **브랜치**: `main`에서 `feature/typography-component` 분기. 워킹 트리에 무관한 미커밋 변경이 있으면 건드리지 말고 사용자에게 먼저 확인한다.
2. **`git push` 금지.** 커밋은 각 태스크의 지정된 스텝에서만, 실행 시작 전 사용자에게 커밋 위임을 1회 확인한다.
3. **테스트 기대치**: 실행 전 `npm test` 기준선은 63/63 PASS. 각 태스크 종료 시 이 숫자가 늘어나기만 해야 하고 기존 테스트가 깨지면 안 된다.
4. 생성 파일(`*/generated/*.ts`, `generated/typography.ts`)은 손으로 수정하지 않는다 — 항상 `npm run generate:tokens`로 재생성.
5. `assets/design-tokens/tokens.json`은 원본이며 이 플랜에서 수정하지 않는다.

## 파일 맵

| 파일 | 작업 | 책임 |
|---|---|---|
| `scripts/lib/token-codegen.js` | Modify | `buildDimensionScale`(spacing/radius 공용), `buildTypography`, 각각의 render 함수 추가 |
| `scripts/lib/__tests__/token-codegen.test.js` | Modify | 신규 함수 단위 테스트 추가 |
| `scripts/generate-theme.js` | Rename+Modify | `scripts/generate-tokens.js`로 리네이밍, spacing/radius/typography 출력 추가(경로 분기) |
| `package.json` | Modify | `generate:theme`→`generate:tokens` 스크립트명 변경 |
| `src/shared/theme/generated/spacing.ts` | Generate | 신규 생성물 |
| `src/shared/theme/generated/radius.ts` | Generate | 신규 생성물 |
| `src/shared/theme/spacing.ts` | Delete | 구 수기 파일 |
| `src/shared/theme/index.ts` | Modify | `spacing` export 경로를 `generated/spacing`로 변경, `radius` export 추가 |
| `src/features/home/screens/home-screen.tsx` | Modify | `spacing.lg`/`spacing.sm` → 숫자 키 |
| `src/features/auth/screens/login-screen.tsx` | Modify | `spacing.lg`/`spacing.md` → 숫자 키 |
| `src/shared/components/placeholder-screen.tsx` | Modify | `spacing.lg`/`spacing.sm` → 숫자 키 |
| `src/shared/components/Typography/generated/typography.ts` | Generate | 신규 생성물 — Typography 전용 |
| `src/shared/components/Typography/Typography.tsx` | Create | 컴포넌트 본체 |
| `src/shared/components/Typography/index.ts` | Create | 배럴 |
| `src/shared/components/index.ts` | Modify | `Typography` export 추가 |

## spacing 치환 표 (확정 — 시각 변화 0)

| 구 키 | 신 키 | 값(px) |
|---|---|---|
| `xs` | `50` | 4 |
| `sm` | `100` | 8 |
| `md` | `200` | 16 |
| `lg` | `300` | 24 |
| `xl` | `400` | 32 |

---

### Task 1: codegen에 spacing/radius 빌더 추가 (TDD)

**Files:**
- Modify: `scripts/lib/token-codegen.js`
- Test: `scripts/lib/__tests__/token-codegen.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`scripts/lib/__tests__/token-codegen.test.js`의 `const { camelize, ... }` import 목록에 `buildDimensionScale`, `renderDimensionScaleTs`를 추가하고, 마지막 `describe('generate', ...)` 블록 앞에 새 describe를 추가한다:

```js
// import 목록 수정
const {
  camelize,
  toCodeKey,
  resolveColor,
  validateSymmetry,
  buildDimensionScale,
  renderDimensionScaleTs,
  generate,
} = require('../token-codegen');
```

```js
// describe('generate', ...) 앞에 추가
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
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest scripts/lib/__tests__/token-codegen.test.js -t "buildDimensionScale|renderDimensionScaleTs"`
Expected: FAIL — `buildDimensionScale is not a function` (또는 undefined 관련 에러)

- [ ] **Step 3: 구현 작성**

`scripts/lib/token-codegen.js`의 `buildPalette` 함수 앞에 추가:

```js
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
```

`HEADER` 정의 다음, `renderPaletteTs` 함수 앞에 추가:

```js
function renderDimensionScaleTs(exportName, scale) {
  const lines = [HEADER, `export const ${exportName} = {`];
  for (const [key, value] of Object.entries(scale)) {
    lines.push(`  ${key}: ${value},`);
  }
  lines.push('} as const;', '');
  return lines.join('\n');
}
```

`module.exports`에 `buildDimensionScale`, `renderDimensionScaleTs` 추가:

```js
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
  generate,
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest scripts/lib/__tests__/token-codegen.test.js`
Expected: PASS 전체 (기존 케이스 포함 회귀 없음)

### Task 2: codegen에 typography 빌더 추가 (TDD)

**Files:**
- Modify: `scripts/lib/token-codegen.js`
- Test: `scripts/lib/__tests__/token-codegen.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

import 목록에 `buildTypography`, `renderTypographyTs` 추가:

```js
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
```

`describe('buildDimensionScale', ...)` 뒤에 추가:

```js
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

  it('extracts only type:"typography" entries, ignoring string/dimension siblings', () => {
    const result = buildTypography(typographyNode);
    expect(Object.keys(result)).toEqual(['headline-lg']);
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
    expect(ts).toContain("export type TypographyVariant =\n  | 'headline-lg';");
    expect(ts).toContain(
      'export const typographyStyles: Record<TypographyVariant, TextStyle> = {',
    );
    expect(ts).toContain("'headline-lg': {");
    expect(ts).toContain('fontSize: 28,');
    expect(ts).toContain("textDecorationLine: 'none',");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest scripts/lib/__tests__/token-codegen.test.js -t "buildTypography|renderTypographyTs"`
Expected: FAIL — `buildTypography is not a function`

- [ ] **Step 3: 구현 작성**

`scripts/lib/token-codegen.js`에 `buildDimensionScale` 함수 뒤에 추가:

```js
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
        throw new Error(`unknown typography field: ${key}.${field}`);
      }
      const outField = TYPOGRAPHY_FIELD_RENAMES[field] || field;
      style[outField] = raw;
    }
    out[key] = style;
  }
  return out;
}
```

`renderDimensionScaleTs` 함수 뒤에 추가:

```js
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
```

`module.exports`에 `buildTypography`, `renderTypographyTs` 추가.

- [ ] **Step 4: 통과 확인**

Run: `npx jest scripts/lib/__tests__/token-codegen.test.js`
Expected: PASS 전체

### Task 3: generate() 확장 + 엔트리 스크립트 리네이밍/확장 + 커밋 ①

**Files:**
- Modify: `scripts/lib/token-codegen.js` (`generate` 함수, `HEADER` 상수)
- Rename+Modify: `scripts/generate-theme.js` → `scripts/generate-tokens.js`
- Modify: `package.json`

- [ ] **Step 1: `HEADER` 상수를 새 스크립트명으로 갱신**

`scripts/lib/token-codegen.js`의 `HEADER` 상수를 교체:

```js
const HEADER = `// AUTO-GENERATED by scripts/generate-tokens.js — DO NOT EDIT.
// Source: assets/design-tokens/tokens.json ("npm run generate:tokens"로 재생성)
`;
```

- [ ] **Step 2: `generate()` 함수 확장**

`scripts/lib/token-codegen.js`의 `generate` 함수를 교체:

```js
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
```

- [ ] **Step 3: 기존 `generate` 테스트를 새 반환 필드에 맞게 갱신**

`scripts/lib/__tests__/token-codegen.test.js`의 `describe('generate', ...)` 블록에서 `const tokens = { primitive, theme: ... }` 정의를 교체(spacing/radius/typography 추가):

```js
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
        value: { fontSize: 28, fontWeight: 700 },
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
    expect(typographyTs).toContain("'headline-lg'");
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
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest scripts/lib/__tests__/token-codegen.test.js`
Expected: PASS 전체 (16개 케이스 이상)

- [ ] **Step 5: 엔트리 스크립트 리네이밍 + 확장**

```bash
git mv scripts/generate-theme.js scripts/generate-tokens.js
```

`scripts/generate-tokens.js` 전체 교체:

```js
// scripts/generate-tokens.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { generate } = require('./lib/token-codegen');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/design-tokens/tokens.json');
const THEME_OUT_DIR = path.join(ROOT, 'src/shared/theme/generated');
const TYPOGRAPHY_OUT_DIR = path.join(
  ROOT,
  'src/shared/components/Typography/generated',
);

const tokens = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const { paletteTs, modeColorsTs, spacingTs, radiusTs, typographyTs } =
  generate(tokens);

fs.mkdirSync(THEME_OUT_DIR, { recursive: true });
fs.mkdirSync(TYPOGRAPHY_OUT_DIR, { recursive: true });

const outputs = [
  [path.join(THEME_OUT_DIR, 'palette.ts'), paletteTs],
  [path.join(THEME_OUT_DIR, 'mode-colors.ts'), modeColorsTs],
  [path.join(THEME_OUT_DIR, 'spacing.ts'), spacingTs],
  [path.join(THEME_OUT_DIR, 'radius.ts'), radiusTs],
  [path.join(TYPOGRAPHY_OUT_DIR, 'typography.ts'), typographyTs],
];

for (const [filePath, content] of outputs) {
  fs.writeFileSync(filePath, content);
}
execFileSync(
  'npx',
  ['prettier', '--write', ...outputs.map(([filePath]) => filePath)],
  { stdio: 'inherit' },
);
console.log(
  outputs
    .map(([filePath]) => `generated: ${path.relative(ROOT, filePath)}`)
    .join('\n'),
);
```

- [ ] **Step 6: package.json 스크립트명 변경**

`package.json`에서 `"generate:theme": "node scripts/generate-theme.js",`를 교체:

```json
    "generate:tokens": "node scripts/generate-tokens.js",
```

- [ ] **Step 7: 생성 실행 + 산출물 확인**

Run: `npm run generate:tokens`
Expected: 5개 파일 생성 로그 출력 (palette.ts, mode-colors.ts, spacing.ts, radius.ts, Typography/generated/typography.ts)

Run: `cat src/shared/theme/generated/spacing.ts && cat src/shared/theme/generated/radius.ts`
Expected: spacing.ts에 `50: 4,` ~ `1000: 80,` 15개 항목. radius.ts에 `xs: 2, md: 8, lg: 16, xl: 99,` (sm 없음 — 의도된 설계, 정상).

Run: `rg -n "textDecorationLine|fontWeight: 700" src/shared/components/Typography/generated/typography.ts | head -5`
Expected: `textDecorationLine`은 있고 `textDecoration`은 없음. `headline-lg`의 `fontWeight: 700,` 확인.

- [ ] **Step 8: 전체 검증**

Run: `npm run typecheck && npm run lint && npm test`
Expected: 전부 클린/PASS. 이 시점엔 구 `src/shared/theme/spacing.ts`(수기 파일)와 신규 `src/shared/theme/generated/spacing.ts`가 서로 다른 파일로 공존하고, `index.ts`는 아직 구 파일을 가리키고 있어 깨질 이유가 없다. `generated/typography.ts`도 아직 아무도 import하지 않지만 자체적으로 유효한 TS라 문제 없음.

Run: `rg -n "generate-theme|generate:theme" . --glob '!node_modules' --glob '!.git'`
Expected: 매치 0건 (문서/메모리 등 이 리포 밖 참조는 무시)

- [ ] **Step 9: 커밋 ① (git push 금지)**

```bash
git add scripts src/shared/theme/generated src/shared/components/Typography package.json
git commit -m "feat(tokens): extend codegen to spacing, radius, and typography

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: 기존 spacing.ts 제거 + 소비처 마이그레이션 + 커밋 ②

**Files:**
- Delete: `src/shared/theme/spacing.ts`
- Modify: `src/shared/theme/index.ts`
- Modify: `src/features/home/screens/home-screen.tsx`
- Modify: `src/features/auth/screens/login-screen.tsx`
- Modify: `src/shared/components/placeholder-screen.tsx`

- [ ] **Step 1: index.ts에서 spacing/radius export 경로 갱신**

`src/shared/theme/index.ts` 전체 교체:

```ts
export { ThemeProvider } from './theme-provider';
export { useTheme, useAppColors } from './use-theme';
export type { ModeColors } from './generated/mode-colors';
export type { ThemeMode, ResolvedTheme } from './resolve-theme';
export { navigationDayTheme, navigationNightTheme } from './navigation-theme';
export { spacing } from './generated/spacing';
export { radius } from './generated/radius';
```

- [ ] **Step 2: 구 spacing.ts 삭제**

```bash
rm src/shared/theme/spacing.ts
```

- [ ] **Step 3: home-screen.tsx 마이그레이션**

[src/features/home/screens/home-screen.tsx](../../src/features/home/screens/home-screen.tsx)의 `const styles = StyleSheet.create({...})` 블록에서:

```ts
// 변경 전
  body: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: '700' },
  link: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },

// 변경 후
  body: { flex: 1, padding: spacing[300], gap: spacing[300] },
  title: { fontSize: 24, fontWeight: '700' },
  link: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: spacing[100],
    paddingHorizontal: spacing[300],
    alignItems: 'center',
  },
```

- [ ] **Step 4: login-screen.tsx 마이그레이션**

[src/features/auth/screens/login-screen.tsx](../../src/features/auth/screens/login-screen.tsx)의 `const styles = StyleSheet.create({...})` 블록에서:

```ts
// 변경 전
  body: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  btn: { borderWidth: 1, borderRadius: 8, paddingVertical: spacing.md, alignItems: 'center' },

// 변경 후
  body: { flex: 1, padding: spacing[300], gap: spacing[300], justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  btn: { borderWidth: 1, borderRadius: 8, paddingVertical: spacing[200], alignItems: 'center' },
```

- [ ] **Step 5: placeholder-screen.tsx 마이그레이션**

[src/shared/components/placeholder-screen.tsx](../../src/shared/components/placeholder-screen.tsx)의 스타일 블록에서 (두 군데, 서로 다른 `StyleSheet.create` 호출 안에 있을 수 있음 — 각각의 정확한 줄을 찾아 치환):

```ts
// 변경 전
      flex: 1,
      padding: spacing.lg,
    },
// ...
      fontSize: 14,
      marginTop: spacing.sm,
    },

// 변경 후
      flex: 1,
      padding: spacing[300],
    },
// ...
      fontSize: 14,
      marginTop: spacing[100],
    },
```

- [ ] **Step 6: 잔여 참조 확인**

Run: `rg -n "spacing\.(xs|sm|md|lg|xl)\b" src`
Expected: 매치 0건

- [ ] **Step 7: 전체 검증**

Run: `npm run typecheck && npm run lint && npm test`
Expected: 전부 클린/PASS. 화면 시각 변화 없음(치환 표대로 동일 px).

- [ ] **Step 8: 커밋 ②**

```bash
git add src/shared/theme src/features src/shared/components
git commit -m "refactor(theme): migrate spacing consumers to numeric token scale

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 5: Typography 컴포넌트 구현 + 커밋 ③

**Files:**
- Create: `src/shared/components/Typography/Typography.tsx`
- Create: `src/shared/components/Typography/index.ts`
- Modify: `src/shared/components/index.ts`

- [ ] **Step 1: Typography.tsx 작성**

```tsx
// src/shared/components/Typography/Typography.tsx
import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useAppColors, type ModeColors } from '@/shared/theme';
import { typographyStyles, type TypographyVariant } from './generated/typography';

export type TypographyProps = Omit<TextProps, 'style' | 'children'> & {
  variant: TypographyVariant;
  color?: keyof ModeColors['text'];
  /**
   * 레이아웃 전용 탈출구(margin/flex/position 등). 색상·폰트 등 시각적 정체성은
   * variant/color로만 결정한다 — style로 덮어써도 되지만 그 용도로 쓰지 말 것.
   * 병합 순서상 항상 마지막이라 여기 넣은 값이 우선 적용된다.
   */
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function Typography({
  variant,
  color = 'default',
  style,
  children,
  ...rest
}: TypographyProps) {
  const colors = useAppColors();
  return (
    <Text
      style={[typographyStyles[variant], { color: colors.text[color] }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
```

- [ ] **Step 2: index.ts 배럴 작성**

```ts
// src/shared/components/Typography/index.ts
export { Typography, type TypographyProps } from './Typography';
```

- [ ] **Step 3: shared/components/index.ts에 export 추가**

`src/shared/components/index.ts`에 한 줄 추가:

```ts
export { ScreenContainer } from './screen-container';
export { PlaceholderScreen } from './placeholder-screen';
export { Typography } from './Typography';
```

- [ ] **Step 4: 전체 검증**

Run: `npm run typecheck && npm run lint && npm test`
Expected: 전부 클린/PASS

- [ ] **Step 5: 재생성 멱등성 확인**

Run: `npm run generate:tokens && git status --porcelain src/shared/theme/generated src/shared/components/Typography/generated/typography.ts`
Expected: diff 없음(생성물이 이미 소스와 sync)

- [ ] **Step 6: 커밋 ③**

```bash
git add src/shared/components
git commit -m "feat(components): add Typography component

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 6: 수동 시각 검증

**Files:** 없음(검증 전용)

- [ ] **Step 1: 개발 서버 기동 + 임시 사용처 삽입**

`src/features/home/screens/home-screen.tsx`의 기존 `<Text style={[styles.title, ...]}>` 바로 아래에 임시로 아래 코드를 추가해 여러 variant/color 조합을 눈으로 확인한다(확인 후 제거):

```tsx
<Typography variant="headline-md">헤드라인 미디엄</Typography>
<Typography variant="body-md" color="subtle">바디 미디엄 서틀</Typography>
<Typography variant="label-sm" color="link">라벨 스몰 링크</Typography>
```

(`Typography` import 추가: `import { Typography } from '@/shared/components';`)

Run: `npm run android` (또는 `npm run ios`)
Expected: 세 줄 모두 크래시 없이 렌더링. 폰트는 시스템 폰트로 보임(Noto Sans KR 미번들 — 스펙에 명시된 기대 동작, 정상).

- [ ] **Step 2: day/night 전환 확인**

기기/에뮬레이터의 다크모드를 토글해 `color="subtle"`/`color="link"` 텍스트 색상이 day/night 세트에 맞게 바뀌는지 확인.

- [ ] **Step 3: 임시 코드 제거**

Step 1에서 추가한 3줄과 import를 제거하고 원상 복구.

Run: `git diff --stat src/features/home/screens/home-screen.tsx`
Expected: 변경 없음(diff 0) — 원래 상태로 복원됐는지 확인.

Run: `npm run typecheck && npm test`
Expected: 클린/PASS (63+개 전부)

---

## 완료 기준

- [ ] `npm run generate:tokens` 재실행 시 diff 0 (멱등)
- [ ] typecheck/lint 클린, 테스트 전부 PASS (기존 63 + 신규 codegen 테스트)
- [ ] 구 `spacing.xs/sm/md/lg/xl` 참조 0건
- [ ] `Typography` 컴포넌트가 17개 variant 전부 렌더링 가능, day/night 전환 시 색상 반영 확인(수동)
- [ ] 후속(범위 밖): Button 등 다른 컴포넌트, 섀도 토큰, 폰트 번들링, `radius`/`numeric` 관련 미해결 항목
