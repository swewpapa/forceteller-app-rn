# 디자인 토큰 색상 시스템 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 토큰 JSON(`assets/design-tokens/tokens.json`)을 원본으로 codegen → day/night 시맨틱 컬러 + system/day/night 테마 전환(MMKV 영속)을 도입하고, placeholder 팔레트 소비처를 전부 마이그레이션한다.

**Architecture:** `tokens.json` → `scripts/generate-theme.js`(CJS, 의존성 0) → `src/shared/theme/generated/{palette,colors}.ts`(시맨틱이 palette 상수 참조) → `ThemeProvider`(Context + MMKV) → `useTheme()`/`useAppColors()`. 스펙: [2026-07-02-design-tokens-color-system-design.md](../specs/2026-07-02-design-tokens-color-system-design.md)

**Tech Stack:** Node CJS codegen, react-native-mmkv 4.x(`createMMKV`), React Context, jest(@react-native/jest-preset)

---

## 실행 전제 (반드시 읽을 것)

1. **브랜치**: `main`에서 `feature/design-tokens-color-system` 분기. 실행 시점에 워킹 트리에 미커밋 변경(탭바 리네이밍, auth 작업 등)이 있으면 **건드리지 말고 사용자(Martin)에게 정리 방침을 먼저 확인**한다.
2. **`git push` 절대 금지.** 커밋은 아래 4개 커밋 스텝에서만, 실행 시작 전 사용자에게 커밋 위임을 1회 확인한다.
3. **tokens.json 원본**: `/private/tmp/claude-501/-Users-martin-Workspace-un7qi3inc-forceteller-app-rn/f4452087-4024-490e-9ae6-02abd23d836c/scratchpad/design-tokens.json`에 보존돼 있다. 파일이 없으면(다른 세션) 사용자에게 export JSON을 다시 요청한다.
4. **테스트 기대치**: main 기반 worktree에서는 기존 실패 0건 — **"전부 PASS"가 성공 기준**이다. (auth-api.test.ts 실패는 env-separation 브랜치의 WIP 상태에서만 존재했던 이슈로, 이 worktree엔 해당 없음. 2026-07-02 실측 확인)
5. 생성 파일(`src/shared/theme/generated/*`)은 손으로 수정하지 않는다 — 항상 `npm run generate:theme`으로 재생성.

## 파일 맵

| 파일 | 작업 | 책임 |
|---|---|---|
| `assets/design-tokens/tokens.json` | Create | 토큰 원본 (손수정 금지) |
| `scripts/lib/token-codegen.js` | Create | codegen 순수 함수 (파싱/해석/직렬화) |
| `scripts/lib/__tests__/token-codegen.test.js` | Create | codegen 단위 테스트 |
| `scripts/generate-theme.js` | Create | codegen 엔트리 (파일 IO + prettier) |
| `src/shared/theme/generated/palette.ts` | Generate | 팔레트 상수 (생성물) |
| `src/shared/theme/generated/colors.ts` | Generate | SemanticColors + day/nightColors (생성물) |
| `src/shared/theme/resolve-theme.ts` | Create | `(mode, osScheme) → 'day'\|'night'` 순수 함수 |
| `src/shared/theme/__tests__/resolve-theme.test.ts` | Create | resolveTheme 테스트 |
| `src/shared/theme/theme-storage.ts` | Create | 모드 영속 (KVStore DI) |
| `src/shared/theme/__tests__/theme-storage.test.ts` | Create | storage 테스트 (fake KVStore) |
| `src/shared/theme/theme-provider.tsx` | Create | ThemeProvider + Context |
| `src/shared/theme/use-theme.ts` | Create | `useTheme()`/`useAppColors()` |
| `src/app/providers/app-providers.tsx` | Modify | ThemeProvider 합성 |
| `src/shared/theme/index.ts` | Modify | 공개 API 전환 |
| `src/shared/theme/navigation-theme.ts` | Modify | day/night 기반 재작성 |
| `src/app/navigation/root-navigator.tsx` | Modify | resolvedTheme 기반 테마 선택 |
| `src/app/App.tsx` | Modify | ThemedStatusBar 도입 |
| `src/app/navigation/tab-bar.tsx` | Modify | 시맨틱 마이그레이션 |
| `src/shared/components/screen-container.tsx` | Modify | 〃 |
| `src/shared/components/placeholder-screen.tsx` | Modify | 〃 |
| `src/features/home/screens/home-screen.tsx` | Modify | 〃 |
| `src/features/auth/screens/login-screen.tsx` | Modify | 〃 |
| `src/features/web/screens/web-screen.tsx` | Modify | 〃 |
| `src/shared/theme/colors.ts` | Delete | 구 placeholder 팔레트 |
| `src/shared/theme/useAppColors.ts` | Delete | 구 훅 |

## 역할 기준 매핑 표 (스펙 "의미 교차" 해소 — 확정본)

| 구 키 (실사용처) | 신 시맨틱 | hex 변화 |
|---|---|---|
| `colors.background` (#FFFFFF — 화면 배경) | `colors.background.surface` | 없음 (#ffffff) |
| `colors.text` (#1A1530) | `colors.text.default` | #191919로 교정 (미세) |
| `colors.textMuted` (#6B6486) | `colors.text.subtle` | #686868로 교정 (미세) |
| `colors.tabBarBorder` (#E8E8E8 — 화면 구분선으로도 사용 중) | `colors.stroke.subtle` | 없음 (#e8e8e8) |
| `colors.tabBarActive` (#191919) | `colors.text.default` | 없음 |
| `colors.tabBarInactive` (#ADADAD) | `colors.text.muted` | 없음 (#adadad) |
| `colors.tabBarBackground` (#FFFFFF) | `colors.background.surface` | 없음 |
| navigation `background`/`card` (씬/헤더 배경) | `background.surface` | card #F4F2FA→#ffffff (placeholder 교정) |
| navigation `primary`/`text`/`border` | `primary.primary`/`text.default`/`stroke.default` | placeholder 교정 |
| 미사용 구 키: `surface`, `primary`, `border` | 대응 불필요 (소비처 0) | — |

**주의**: 치환 순서 — `colors.textMuted`를 `colors.text`보다 **먼저** 치환할 것 (접두 겹침). `colors.background` → `colors.background.surface` 치환 후 재치환 금지.

---

### Task 1: 토큰 원본 배치

**Files:**
- Create: `assets/design-tokens/tokens.json`

- [ ] **Step 1: 디렉토리 생성 + 원본 복사**

```bash
mkdir -p assets/design-tokens
cp "/private/tmp/claude-501/-Users-martin-Workspace-un7qi3inc-forceteller-app-rn/f4452087-4024-490e-9ae6-02abd23d836c/scratchpad/design-tokens.json" assets/design-tokens/tokens.json
```

(스크래치패드 파일이 없으면 중단하고 사용자에게 토큰 JSON을 요청한다.)

- [ ] **Step 2: JSON 유효성 + 필수 키 확인**

Run: `node -e "const t=require('./assets/design-tokens/tokens.json'); console.log(Object.keys(t.primitive.palette).length, Object.keys(t.theme))"`
Expected: `9 [ 'day', 'night' ]` (팔레트 8색군+white, day/night 존재)

### Task 2: codegen 순수 함수 (TDD)

**Files:**
- Create: `scripts/lib/token-codegen.js`
- Test: `scripts/lib/__tests__/token-codegen.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
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
    const { paletteTs, colorsTs } = generate(tokens);
    expect(paletteTs).toContain("export const palette = {");
    expect(paletteTs).toContain("kkarinaBlue: {");
    expect(paletteTs).toContain("900: '#191919',");
    expect(paletteTs).toContain("white: '#ffffff',");
    expect(colorsTs).toContain("import { palette } from './palette';");
    expect(colorsTs).toContain('export type SemanticColors = {');
    expect(colorsTs).toContain('primary: palette.gray[900],');
    expect(colorsTs).toContain('wood: palette.gray[100],');
    expect(colorsTs).toContain("force: '#c38800',");
    expect(colorsTs).toContain('export const dayColors: SemanticColors');
    expect(colorsTs).toContain('export const nightColors: SemanticColors');
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
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest scripts/lib/__tests__/token-codegen.test.js`
Expected: FAIL — `Cannot find module '../token-codegen'`

- [ ] **Step 3: 구현 작성**

```js
// scripts/lib/token-codegen.js
'use strict';

const HEX_RE = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
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
  return out;
}

const HEADER = `// AUTO-GENERATED by scripts/generate-theme.js — DO NOT EDIT.
// Source: assets/design-tokens/tokens.json ("npm run generate:theme"로 재생성)
`;

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

function renderColorsTs(day, night) {
  const lines = [HEADER, "import { palette } from './palette';", ''];
  lines.push('export type SemanticColors = {');
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
    lines.push(`export const ${name}: SemanticColors = {`);
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
  validateSymmetry(day, night);
  const palette = buildPalette(primitive.palette);
  const dayResolved = buildSemantic(day, primitive);
  const nightResolved = buildSemantic(night, primitive);
  return {
    paletteTs: renderPaletteTs(palette),
    colorsTs: renderColorsTs(dayResolved, nightResolved),
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
  generate,
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest scripts/lib/__tests__/token-codegen.test.js`
Expected: PASS (전 케이스)

### Task 3: codegen 엔트리 + 생성물 + 커밋 ①

**Files:**
- Create: `scripts/generate-theme.js`
- Modify: `package.json` (scripts에 1줄)
- Generate: `src/shared/theme/generated/palette.ts`, `src/shared/theme/generated/colors.ts`

- [ ] **Step 1: 엔트리 스크립트 작성**

```js
// scripts/generate-theme.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { generate } = require('./lib/token-codegen');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/design-tokens/tokens.json');
const OUT_DIR = path.join(ROOT, 'src/shared/theme/generated');

const tokens = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const { paletteTs, colorsTs } = generate(tokens);

fs.mkdirSync(OUT_DIR, { recursive: true });
const palettePath = path.join(OUT_DIR, 'palette.ts');
const colorsPath = path.join(OUT_DIR, 'colors.ts');
fs.writeFileSync(palettePath, paletteTs);
fs.writeFileSync(colorsPath, colorsTs);
execFileSync('npx', ['prettier', '--write', palettePath, colorsPath], {
  stdio: 'inherit',
});
console.log(
  `generated: ${path.relative(ROOT, palettePath)}, ${path.relative(ROOT, colorsPath)}`,
);
```

- [ ] **Step 2: package.json scripts에 추가**

`"test": "jest"` 라인 뒤에:

```json
    "generate:theme": "node scripts/generate-theme.js",
```

- [ ] **Step 3: 생성 실행 + 생성물 검증**

Run: `npm run generate:theme`
Expected: `generated: src/shared/theme/generated/palette.ts, src/shared/theme/generated/colors.ts`

Run: `rg -c "palette\." src/shared/theme/generated/colors.ts && rg -n "force: '#c38800'" src/shared/theme/generated/colors.ts`
Expected: palette 참조 다수 + day의 `force: '#c38800'` (off-palette 리터럴 확인. night는 `force: '#db9f15'`)

- [ ] **Step 4: 전체 검증**

Run: `npm run typecheck && npm run lint && npm test`
Expected: typecheck/lint 클린. 테스트는 auth-api 기존 1건 실패 외 전부 PASS

(참고: RN eslint 설정이 `scripts/*.js`의 Node 전역/require를 지적하면 해당 파일 상단에 `/* eslint-env node */` 주석을 추가한다. 그래도 남으면 `.eslintrc` overrides가 아니라 파일 단위 주석으로 해결 — 설정 파일 수정은 범위 밖.)

- [ ] **Step 5: 커밋 ①**

```bash
git add assets/design-tokens scripts src/shared/theme/generated package.json
git commit -m "feat(theme): add design token source and codegen pipeline"
```

### Task 4: resolveTheme (TDD)

**Files:**
- Create: `src/shared/theme/resolve-theme.ts`
- Test: `src/shared/theme/__tests__/resolve-theme.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/theme/__tests__/resolve-theme.test.ts
import { resolveTheme } from '../resolve-theme';

describe('resolveTheme', () => {
  it.each([
    ['system', 'light', 'day'],
    ['system', 'dark', 'night'],
    ['system', null, 'day'],
    ['day', 'dark', 'day'],
    ['night', 'light', 'night'],
  ] as const)('mode=%s, os=%s → %s', (mode, osScheme, expected) => {
    expect(resolveTheme(mode, osScheme)).toBe(expected);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/shared/theme/__tests__/resolve-theme.test.ts`
Expected: FAIL — `Cannot find module '../resolve-theme'`

- [ ] **Step 3: 구현**

```ts
// src/shared/theme/resolve-theme.ts
import type { ColorSchemeName } from 'react-native';

export type ThemeMode = 'system' | 'day' | 'night';
export type ResolvedTheme = 'day' | 'night';

/** 사용자 모드와 OS 스킴(light/dark/null)을 최종 테마로 확정한다. */
export function resolveTheme(
  mode: ThemeMode,
  osScheme: ColorSchemeName,
): ResolvedTheme {
  if (mode === 'system') {
    return osScheme === 'dark' ? 'night' : 'day';
  }
  return mode;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest src/shared/theme/__tests__/resolve-theme.test.ts`
Expected: PASS (5 cases)

### Task 5: theme-storage (TDD)

**Files:**
- Create: `src/shared/theme/theme-storage.ts`
- Test: `src/shared/theme/__tests__/theme-storage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/theme/__tests__/theme-storage.test.ts
import { createThemeStorage, type KVStore } from '../theme-storage';

function fakeStore(): KVStore {
  const map = new Map<string, string>();
  return {
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('theme-storage', () => {
  it('defaults to system when nothing stored', () => {
    expect(createThemeStorage(fakeStore()).getMode()).toBe('system');
  });

  it('persists and reads back a mode', () => {
    const s = createThemeStorage(fakeStore());
    s.setMode('night');
    expect(s.getMode()).toBe('night');
  });

  it('falls back to system on an unknown stored value', () => {
    const store = fakeStore();
    store.set('theme.mode', 'neon');
    expect(createThemeStorage(store).getMode()).toBe('system');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/shared/theme/__tests__/theme-storage.test.ts`
Expected: FAIL — `Cannot find module '../theme-storage'`

- [ ] **Step 3: 구현** (splash-storage의 KVStore DI 선례 — 구조적 타입이라 4줄 중복 허용)

```ts
// src/shared/theme/theme-storage.ts
import type { ThemeMode } from './resolve-theme';

/** MMKV의 부분 인터페이스 — 테스트에서 fake 주입 가능하게 DI. (splash-storage 선례) */
export type KVStore = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
};

const KEY_MODE = 'theme.mode';
const MODES: readonly ThemeMode[] = ['system', 'day', 'night'];

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value !== undefined && (MODES as readonly string[]).includes(value);
}

export function createThemeStorage(store: KVStore) {
  return {
    /** 저장값이 없거나 알 수 없는 값이면 'system'. */
    getMode(): ThemeMode {
      const raw = store.getString(KEY_MODE);
      return isThemeMode(raw) ? raw : 'system';
    },
    setMode(mode: ThemeMode): void {
      store.set(KEY_MODE, mode);
    },
  };
}

export type ThemeStorage = ReturnType<typeof createThemeStorage>;
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest src/shared/theme/__tests__/theme-storage.test.ts`
Expected: PASS (3 cases)

### Task 6: ThemeProvider + 훅 + Provider 합성 + 커밋 ②

**Files:**
- Create: `src/shared/theme/theme-provider.tsx`, `src/shared/theme/use-theme.ts`
- Modify: `src/shared/theme/index.ts` (새 export 추가 — 구 export는 아직 유지), `src/app/providers/app-providers.tsx`

- [ ] **Step 1: ThemeProvider 작성**

```tsx
// src/shared/theme/theme-provider.tsx
import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { dayColors, nightColors, type SemanticColors } from './generated/colors';
import { resolveTheme, type ResolvedTheme, type ThemeMode } from './resolve-theme';
import { createThemeStorage } from './theme-storage';

export type ThemeContextValue = {
  colors: SemanticColors;
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const storage = createThemeStorage(createMMKV({ id: 'theme' }));

export function ThemeProvider({ children }: PropsWithChildren) {
  // MMKV는 동기 읽기라 초기 렌더부터 저장된 모드가 반영된다(스플래시 하이드레이션 불일치 없음).
  const [mode, setModeState] = useState<ThemeMode>(() => storage.getMode());
  const osScheme = useColorScheme();
  const resolvedTheme = resolveTheme(mode, osScheme);

  const setMode = useCallback((next: ThemeMode) => {
    storage.setMode(next);
    setModeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedTheme === 'night' ? nightColors : dayColors,
      mode,
      resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

- [ ] **Step 2: 훅 작성**

```ts
// src/shared/theme/use-theme.ts
import { useContext } from 'react';
import type { SemanticColors } from './generated/colors';
import { ThemeContext, type ThemeContextValue } from './theme-provider';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within <ThemeProvider>');
  }
  return ctx;
}

/** 시맨틱 컬러만 필요한 컴포넌트용 편의 훅 (기존 useAppColors 계약 계승). */
export function useAppColors(): SemanticColors {
  return useTheme().colors;
}
```

**주의:** 이 시점에 `use-theme.ts`의 `useAppColors`는 index에서 export하지 않는다 (구 `useAppColors.ts`와 이름 충돌 — Task 7에서 일괄 전환).

- [ ] **Step 3: index에 새 export 추가 (구 export 유지)**

```ts
// src/shared/theme/index.ts — 전체 교체
export { darkColors, lightColors, type AppColors } from './colors';
export { spacing } from './spacing';
export { useAppColors } from './useAppColors';
export { navigationDarkTheme, navigationLightTheme } from './navigation-theme';
export { ThemeProvider } from './theme-provider';
export { useTheme } from './use-theme';
export type { SemanticColors } from './generated/colors';
export type { ThemeMode, ResolvedTheme } from './resolve-theme';
```

- [ ] **Step 4: AppProviders에 합성**

```tsx
// src/app/providers/app-providers.tsx — 전체 교체
import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/shared/lib';
import { ThemeProvider } from '@/shared/theme';

/** Composes the app-wide providers (safe area, theme, server-state cache). */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 5: 전체 검증**

Run: `npm run typecheck && npm run lint && npm test`
Expected: typecheck/lint 클린. auth-api 기존 1건 외 전부 PASS

- [ ] **Step 6: 커밋 ②**

```bash
git add src/shared/theme src/app/providers
git commit -m "feat(theme): add ThemeProvider with system/day/night mode and MMKV persistence"
```

### Task 7: 소비처 일괄 마이그레이션 + 커밋 ③

**Files:**
- Modify: `src/shared/theme/index.ts`, `src/shared/theme/navigation-theme.ts`, `src/app/navigation/root-navigator.tsx`, `src/app/App.tsx`, `src/app/navigation/tab-bar.tsx`, `src/shared/components/screen-container.tsx`, `src/shared/components/placeholder-screen.tsx`, `src/features/home/screens/home-screen.tsx`, `src/features/auth/screens/login-screen.tsx`, `src/features/web/screens/web-screen.tsx`

**이 태스크는 index 전환 때문에 중간 상태에서 typecheck가 깨진다 — Step 1~8을 모두 마친 뒤 검증한다.**

- [ ] **Step 1: index를 최종 공개 API로 교체**

```ts
// src/shared/theme/index.ts — 전체 교체
export { ThemeProvider } from './theme-provider';
export { useTheme, useAppColors } from './use-theme';
export type { SemanticColors } from './generated/colors';
export type { ThemeMode, ResolvedTheme } from './resolve-theme';
export { navigationDayTheme, navigationNightTheme } from './navigation-theme';
export { spacing } from './spacing';
```

- [ ] **Step 2: navigation-theme 재작성**

```ts
// src/shared/theme/navigation-theme.ts — 전체 교체
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { dayColors, nightColors } from './generated/colors';

/**
 * React Navigation 테마(헤더/씬 배경)를 시맨틱 컬러에 맞춘다.
 * 씬/헤더 배경은 화면 기본 배경 역할이라 background.surface(기존 white 시각 유지).
 */
export const navigationDayTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: dayColors.primary.primary,
    background: dayColors.background.surface,
    card: dayColors.background.surface,
    text: dayColors.text.default,
    border: dayColors.stroke.default,
  },
};

export const navigationNightTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: nightColors.primary.primary,
    background: nightColors.background.surface,
    card: nightColors.background.surface,
    text: nightColors.text.default,
    border: nightColors.stroke.default,
  },
};
```

- [ ] **Step 3: root-navigator를 resolvedTheme 기반으로**

[src/app/navigation/root-navigator.tsx](../../src/app/navigation/root-navigator.tsx)에서:

```tsx
// 변경 전
import { useColorScheme } from 'react-native';
import { navigationDarkTheme, navigationLightTheme } from '@/shared/theme';
...
  const scheme = useColorScheme();
...
      theme={scheme === 'dark' ? navigationDarkTheme : navigationLightTheme}

// 변경 후 (useColorScheme import 제거)
import { navigationDayTheme, navigationNightTheme, useTheme } from '@/shared/theme';
...
  const { resolvedTheme } = useTheme();
...
      theme={resolvedTheme === 'night' ? navigationNightTheme : navigationDayTheme}
```

- [ ] **Step 4: App.tsx — ThemedStatusBar**

```tsx
// src/app/App.tsx — 전체 교체
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppProviders } from './providers';
import { RootNavigator } from './navigation';
import { SplashGate } from './splash';
import { http, authTokenStore, createAuthRequestInterceptor } from '@/shared/lib';
import { useAuthStore } from '@/features/auth';
import { useTheme } from '@/shared/theme';

// 앱 시작 시 토큰 주입 request 인터셉터를 등록한다(모듈 로드 1회).
// http가 auth-token을 직접 import하면 순환이 되므로 app 레이어에서 연결한다.
http.interceptors.request.use(createAuthRequestInterceptor(authTokenStore));

// 수동 day/night 모드에서도 상태바가 따라오도록 OS 스킴이 아닌 resolvedTheme을 본다.
function ThemedStatusBar() {
  const { resolvedTheme } = useTheme();
  return (
    <StatusBar
      barStyle={resolvedTheme === 'night' ? 'light-content' : 'dark-content'}
    />
  );
}

function App() {
  // MMKV 토큰 존재 여부로 초기 auth status를 결정한다.
  // useEffect를 사용하는 이유: restore()는 store 상태를 변경하는 액션이라
  // React 18 StrictMode에서 렌더 사이클 밖 store mutation이 경고를 유발할 수 있고,
  // App 마운트 전 상태 변경은 SplashGate 등 downstream consumer에 hydration 불일치 위험이 있다.
  // authTokenStore(MMKV)는 동기 읽기이므로 async 타이밍 문제는 없다.
  useEffect(() => {
    useAuthStore.getState().restore();
  }, []);

  return (
    <AppProviders>
      <ThemedStatusBar />
      <SplashGate>
        <RootNavigator />
      </SplashGate>
    </AppProviders>
  );
}

export default App;
```

- [ ] **Step 5: tab-bar 마이그레이션**

[src/app/navigation/tab-bar.tsx](../../src/app/navigation/tab-bar.tsx)에서:

```tsx
// import 변경
import { useAppColors, type SemanticColors } from '@/shared/theme'; // AppColors → SemanticColors

// 컴포넌트 본문
const color = focused ? colors.text.default : colors.text.muted;

// makeStyles 시그니처 + 스타일
function makeStyles(colors: SemanticColors, bottomInset: number) {
  ...
    bar: {
      ...
      backgroundColor: colors.background.surface,
      borderTopColor: colors.stroke.subtle,
      ...
    },
  ...
    labelActive: { color: colors.text.default },
    labelInactive: { color: colors.text.muted },
}
```

- [ ] **Step 6: screen-container 마이그레이션**

[src/shared/components/screen-container.tsx](../../src/shared/components/screen-container.tsx)에서: `type AppColors` → `type SemanticColors` (import 포함), `backgroundColor: colors.background` → `colors.background.surface`

- [ ] **Step 7: 나머지 4개 화면 — 치환 표 적용**

각 파일에서 아래 순서로 치환 (grep 기준 발생 위치 병기). `AppColors` 타입 참조가 있으면 `SemanticColors`로 교체:

| 파일 | 치환 (순서대로) |
|---|---|
| `placeholder-screen.tsx` | `colors.textMuted`→`colors.text.subtle` (L38), `colors.text`→`colors.text.default` (L33) |
| `home-screen.tsx` | `colors.tabBarBorder`→`colors.stroke.subtle` (L25,34,50,66), `colors.text`→`colors.text.default` (L16,27,36,52,68) |
| `login-screen.tsx` | `colors.tabBarBorder`→`colors.stroke.subtle` (L40), `colors.text`→`colors.text.default` (L39,41) |
| `web-screen.tsx` | `colors.background`→`colors.background.surface` (L59), `colors.text`→`colors.text.default` (L69) |

- [ ] **Step 8: 구 이름 잔여 참조 확인**

Run: `rg -n "lightColors|darkColors|AppColors|navigationLightTheme|navigationDarkTheme|textMuted|tabBarBorder|tabBarActive|tabBarInactive|tabBarBackground" src --glob '!src/shared/theme/colors.ts' --glob '!src/shared/theme/useAppColors.ts'`
Expected: 매치 0건

- [ ] **Step 9: 전체 검증**

Run: `npm run typecheck && npm run lint && npm test`
Expected: typecheck/lint 클린. auth-api 기존 1건 외 전부 PASS

- [ ] **Step 10: 커밋 ③**

```bash
git add src/shared/theme src/app src/features src/shared/components
git commit -m "refactor(theme): migrate consumers to semantic token colors"
```

### Task 8: 구 팔레트 제거 + 최종 검증 + 커밋 ④

**Files:**
- Delete: `src/shared/theme/colors.ts`, `src/shared/theme/useAppColors.ts`

- [ ] **Step 1: 파일 삭제**

```bash
rm src/shared/theme/colors.ts src/shared/theme/useAppColors.ts
```

- [ ] **Step 2: 잔여 참조 최종 확인**

Run: `rg -n "from './colors'|from './useAppColors'|AppColors" src`
Expected: `generated/colors` 관련(`from './generated/colors'`, `SemanticColors`)만 매치, 구 모듈 참조 0건

- [ ] **Step 3: 재생성 멱등성 확인** (생성물이 소스와 sync인지)

Run: `npm run generate:theme && git diff --stat src/shared/theme/generated`
Expected: diff 없음

- [ ] **Step 4: 전체 검증**

Run: `npm run typecheck && npm run lint && npm test`
Expected: typecheck/lint 클린. auth-api 기존 1건 외 전부 PASS

- [ ] **Step 5: 커밋 ④**

```bash
git add -A src/shared/theme
git commit -m "chore(theme): remove legacy placeholder palette"
```

---

## 완료 기준

- [ ] `npm run generate:theme` 재실행 시 diff 0 (멱등)
- [ ] typecheck/lint 클린, 테스트는 기존 auth-api 1건 외 전부 PASS
- [ ] 구 `AppColors`/`lightColors`/`darkColors`/`tabBar*` 참조 0건
- [ ] day 모드에서 기존 화면 시각 변화: 탭바 0, 배경 0, 텍스트 근사 교정(#1A1530→#191919 계열)만
- [ ] 후속(범위 밖): 토글 UI, 웹뷰 동기화, 치수/타이포/섀도 토큰, 컴포넌트 레이어
