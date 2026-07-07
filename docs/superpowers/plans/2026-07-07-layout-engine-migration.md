# Layout 엔진 마이그레이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Box/Row/Column을 `buildLayoutStyle` 수동 병합에서 `withStyleProps` 엔진으로 이관하고, 공유 리졸버(spacing/gap/backgroundColor/radius/flow)를 확립한다.

**Architecture:** 신규 순수 리졸버 5종을 `style-engine/resolvers/`에 TDD로 추가 → Box/Row/Column을 `withStyleProps(View, { base?, resolvers })`로 재작성 → `layout-style.ts` 삭제. 공개 API 보존(색 prop `background`→`color`, `margin`/`m` 추가 제외; 소비처 영향 0).

**Tech Stack:** RN 0.85 / React 19 / TypeScript / Jest. 신규 의존성 0.

**참조:** 스펙 `docs/superpowers/specs/2026-07-07-layout-engine-migration-design.md`, 규약 `docs/design-system/component-prop-conventions.md`.

**공통 규칙:** 커밋은 각 태스크 끝 1개(플랜 승인 위임). **push 금지.** 테스트 `pnpm test`, 타입 `pnpm exec tsc --noEmit`, 린트 `pnpm exec eslint <path> --max-warnings=0`. 스코프 `git add` (NOT `-A` — untracked OTA 문서 있음).

**⚠️ 네임 충돌 주의:** 리졸버 `spacing`/`radius`는 토큰 스케일 `spacing`/`radius`(`@/shared/theme`)와 같은 이름. 리졸버 파일 안에서 토큰을 alias import(`import { spacing as spacingScale }`)로 받아 충돌 회피.

---

## File Structure

```
[신규] src/shared/lib/style-engine/resolvers/spacing.ts   # padding/p·margin/m (shorthand) + SpaceValue/PaddingValue 타입
[신규] src/shared/lib/style-engine/resolvers/gap.ts       # gap (SpaceValue)
[신규] src/shared/lib/style-engine/resolvers/background-color.ts  # color(그룹키) → backgroundColor
[신규] src/shared/lib/style-engine/resolvers/radius.ts    # radius(RadiusKey)
[신규] src/shared/lib/style-engine/resolvers/flow.ts      # justify/align
[신규] src/shared/lib/style-engine/__tests__/layout-resolvers.test.ts
[수정] src/shared/lib/style-engine/index.ts               # 신규 5종 export
[수정] src/shared/components/layout/box.tsx               # withStyleProps로 축소
[수정] src/shared/components/layout/row.tsx
[수정] src/shared/components/layout/column.tsx
[수정] src/shared/components/layout/index.ts              # layout-style 타입 export 제거
[삭제] src/shared/components/layout/layout-style.ts
[삭제] src/shared/components/layout/__tests__/layout-style.test.ts  # 케이스는 layout-resolvers.test.ts로 포팅
```

---

### Task 0: 브랜치 + 스펙 커밋 ①

- [ ] **Step 1: 브랜치** (현재 main, #10 머지됨)

```bash
git -C /Users/martin/Workspace/un7qi3inc/forceteller-app-rn checkout main && git pull --ff-only
git checkout -b feature/layout-engine-migration
```

- [ ] **Step 2: 스펙 커밋** (스코프 지정)

```bash
git add docs/superpowers/specs/2026-07-07-layout-engine-migration-design.md docs/superpowers/plans/2026-07-07-layout-engine-migration.md
git status --short   # 위 2개만 확인
git commit -m "docs(layout): Box/Row/Column 엔진 마이그레이션 스펙/플랜

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1: spacing + gap 리졸버 (커밋 ② TDD)

**Files:** Create `resolvers/spacing.ts`, `resolvers/gap.ts`, Test `__tests__/layout-resolvers.test.ts`(spacing/gap 부분)

- [ ] **Step 1: 실패 테스트 작성** — `__tests__/layout-resolvers.test.ts` (spacing/gap 블록. 나머지 리졸버 블록은 Task 2에서 추가)

```ts
import { spacing } from '../resolvers/spacing';
import { gap } from '../resolvers/gap';
import type { ThemeContextValue } from '@/shared/theme';

// spacing 토큰: '100'=8, '300'=24 (theme/generated/spacing 기준). 원시 px는 그대로.
const theme = {} as unknown as ThemeContextValue; // spacing/gap은 theme 안 씀(토큰 스케일 직접 import)

describe('spacing resolver — padding', () => {
  it('스칼라 토큰을 4변으로 정규화', () => {
    expect(spacing.resolve({ padding: '300' }, theme)).toEqual({
      paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24,
    });
  });
  it('스칼라 원시 px 그대로', () => {
    expect(spacing.resolve({ padding: 14 }, theme)).toEqual({
      paddingTop: 14, paddingRight: 14, paddingBottom: 14, paddingLeft: 14,
    });
  });
  it('2-value [Y,X]', () => {
    expect(spacing.resolve({ padding: ['100', 14] }, theme)).toEqual({
      paddingTop: 8, paddingRight: 14, paddingBottom: 8, paddingLeft: 14,
    });
  });
  it('3-value [top,X,bottom]', () => {
    expect(spacing.resolve({ padding: ['100', 14, '300'] }, theme)).toEqual({
      paddingTop: 8, paddingRight: 14, paddingBottom: 24, paddingLeft: 14,
    });
  });
  it('4-value 시계방향 [t,r,b,l]', () => {
    expect(spacing.resolve({ padding: ['100', 14, '300', 2] }, theme)).toEqual({
      paddingTop: 8, paddingRight: 14, paddingBottom: 24, paddingLeft: 2,
    });
  });
  it('p는 padding alias', () => {
    expect(spacing.resolve({ p: '100' }, theme)).toEqual({
      paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8,
    });
  });
  it('padding이 p보다 우선', () => {
    expect(spacing.resolve({ padding: '300', p: '100' }, theme).paddingTop).toBe(24);
  });
  it('스칼라 0도 명시 방출(falsy 가드 회귀 방지)', () => {
    expect(spacing.resolve({ padding: 0 }, theme)).toEqual({
      paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
    });
  });
});

describe('spacing resolver — margin', () => {
  it('margin도 동일 shorthand로 4변 방출', () => {
    expect(spacing.resolve({ margin: ['100', 14] }, theme)).toEqual({
      marginTop: 8, marginRight: 14, marginBottom: 8, marginLeft: 14,
    });
  });
  it('m은 margin alias, margin이 m보다 우선', () => {
    expect(spacing.resolve({ m: '300' }, theme).marginTop).toBe(24);
    expect(spacing.resolve({ margin: '300', m: '100' }, theme).marginTop).toBe(24);
  });
  it('padding+margin 동시 방출', () => {
    expect(spacing.resolve({ padding: '100', margin: '300' }, theme)).toEqual({
      paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8,
      marginTop: 24, marginRight: 24, marginBottom: 24, marginLeft: 24,
    });
  });
  it('미지정은 무방출', () => {
    expect(spacing.resolve({}, theme)).toEqual({});
    expect(spacing.props).toEqual(['padding', 'p', 'margin', 'm']);
  });
});

describe('gap resolver', () => {
  it('토큰/원시px, 미지정 무방출', () => {
    expect(gap.resolve({ gap: '100' }, theme)).toEqual({ gap: 8 });
    expect(gap.resolve({ gap: 5 }, theme)).toEqual({ gap: 5 });
    expect(gap.resolve({}, theme)).toEqual({});
    expect(gap.props).toEqual(['gap']);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run `pnpm test -- layout-resolvers` → FAIL (모듈 없음). (테스트의 실제 spacing 토큰 값 8/24는 Step 3 전에 `src/shared/theme/generated/spacing.ts`에서 `'100'`/`'300'` 값을 확인해 일치시킨다. 다르면 테스트 숫자를 실제 값으로 교정 후 진행.)

- [ ] **Step 3: spacing.ts 구현**

```ts
import type { ViewStyle } from 'react-native';
import { spacing as spacingScale, type SpacingKey } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** 문자열 = spacing 토큰 키('300'→24px), 숫자 = 원시 px(의도적 이탈 — 호출부 가시). */
export type SpaceValue = SpacingKey | number;

/** CSS padding shorthand의 배열 번역: 스칼라=전방향, [Y,X], [top,X,bottom], [t,r,b,l](시계). */
export type PaddingValue =
  | SpaceValue
  | readonly [SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue, SpaceValue];

export type SpacingProps = {
  padding?: PaddingValue;
  /** padding alias. 동시 지정 시 padding 우선. */
  p?: PaddingValue;
  margin?: PaddingValue;
  /** margin alias. 동시 지정 시 margin 우선. */
  m?: PaddingValue;
};

function resolveSpace(value: SpaceValue): number {
  return typeof value === 'string' ? spacingScale[value] : value;
}

/** [top,right,bottom,left]로 정규화 — RN shorthand 해석에 의존 안 함. */
function resolveEdges(value: PaddingValue): [number, number, number, number] {
  if (typeof value === 'string' || typeof value === 'number') {
    const all = resolveSpace(value);
    return [all, all, all, all];
  }
  if (value.length === 2) {
    const [y, x] = value;
    return [resolveSpace(y), resolveSpace(x), resolveSpace(y), resolveSpace(x)];
  }
  if (value.length === 3) {
    const [top, x, bottom] = value;
    return [resolveSpace(top), resolveSpace(x), resolveSpace(bottom), resolveSpace(x)];
  }
  const [top, right, bottom, left] = value;
  return [resolveSpace(top), resolveSpace(right), resolveSpace(bottom), resolveSpace(left)];
}

/** padding/margin shorthand → 4변 명시. 미지정 prop은 키 미방출. */
export const spacing: Resolver<SpacingProps> = {
  props: ['padding', 'p', 'margin', 'm'],
  resolve(values, _theme): ViewStyle {
    const out: ViewStyle = {};
    const pad = values.padding ?? values.p;
    if (pad !== undefined) {
      const [t, r, b, l] = resolveEdges(pad);
      out.paddingTop = t;
      out.paddingRight = r;
      out.paddingBottom = b;
      out.paddingLeft = l;
    }
    const mar = values.margin ?? values.m;
    if (mar !== undefined) {
      const [t, r, b, l] = resolveEdges(mar);
      out.marginTop = t;
      out.marginRight = r;
      out.marginBottom = b;
      out.marginLeft = l;
    }
    return out;
  },
};
```

- [ ] **Step 4: gap.ts 구현**

```ts
import type { ViewStyle } from 'react-native';
import { spacing as spacingScale } from '@/shared/theme';
import type { Resolver } from '../resolver';
import type { SpaceValue } from './spacing';

export type GapProps = { gap?: SpaceValue };

export const gap: Resolver<GapProps> = {
  props: ['gap'],
  resolve(values, _theme): ViewStyle {
    if (values.gap === undefined) return {};
    return { gap: typeof values.gap === 'string' ? spacingScale[values.gap] : values.gap };
  },
};
```

- [ ] **Step 5: 통과 + 타입** — Run `pnpm test -- layout-resolvers && pnpm exec tsc --noEmit` → PASS, 0 errors.

- [ ] **Step 6: 커밋**

```bash
git add src/shared/lib/style-engine
git commit -m "feat(style-engine): spacing(padding/p·margin/m) + gap 리졸버 (TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: backgroundColor + radius + flow 리졸버 + 배럴 (커밋 ③ TDD)

**Files:** Create `resolvers/background-color.ts`, `resolvers/radius.ts`, `resolvers/flow.ts`, Modify `__tests__/layout-resolvers.test.ts`(블록 추가) + `index.ts`

- [ ] **Step 1: 테스트 블록 추가** — `layout-resolvers.test.ts`에 import + describe 추가:

```ts
import { backgroundColor } from '../resolvers/background-color';
import { radius } from '../resolvers/radius';
import { flow } from '../resolvers/flow';

const themeWithColors = {
  colors: { background: { surface: '#ffffff', inset: '#f4f4f4' } },
  radius: { md: 8, xl: 99 },
} as unknown as ThemeContextValue;

describe('backgroundColor resolver', () => {
  it('그룹키를 backgroundColor로 매핑', () => {
    expect(backgroundColor.resolve({ color: 'surface' }, themeWithColors)).toEqual({ backgroundColor: '#ffffff' });
    expect(backgroundColor.resolve({ color: 'inset' }, themeWithColors)).toEqual({ backgroundColor: '#f4f4f4' });
  });
  it('미지정 무방출, props', () => {
    expect(backgroundColor.resolve({}, themeWithColors)).toEqual({});
    expect(backgroundColor.props).toEqual(['color']);
  });
});

describe('radius resolver', () => {
  it('토큰 매핑 + 미지정 무방출', () => {
    expect(radius.resolve({ radius: 'md' }, themeWithColors)).toEqual({ borderRadius: 8 });
    expect(radius.resolve({}, themeWithColors)).toEqual({});
  });
});

describe('flow resolver', () => {
  it('justify/align 통과, 미지정 무방출', () => {
    expect(flow.resolve({ justify: 'center', align: 'flex-end' }, themeWithColors)).toEqual({
      justifyContent: 'center', alignItems: 'flex-end',
    });
    expect(flow.resolve({ justify: 'space-between' }, themeWithColors)).toEqual({ justifyContent: 'space-between' });
    expect(flow.resolve({}, themeWithColors)).toEqual({});
    expect(flow.props).toEqual(['justify', 'align']);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run `pnpm test -- layout-resolvers` → FAIL (신규 모듈 없음).

- [ ] **Step 3: background-color.ts 구현**

```ts
import type { ViewStyle } from 'react-native';
import type { ModeColors } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** background 시맨틱 그룹 키(예: 'surface'). 레이아웃 컨테이너 배경 전용. */
export type BackgroundKey = keyof ModeColors['background'];
export type BackgroundColorProps = { color?: BackgroundKey };

/**
 * prop `color`(그룹키) → backgroundColor. 레이아웃 색 prop.
 * ⚠️ 전환기: 엔진에 이미 `color` 리졸버(props background/borderColor, ColorPath)가 있음 —
 * export명↔prop명이 엇갈리는 건 Chip 우회(ColorPath)의 잔재. 무채색 chip 토큰 후속에서 통일.
 * 각 아톰은 하나만 사용(레이아웃=backgroundColor, Chip=color)이라 런타임 충돌 없음.
 */
export const backgroundColor: Resolver<BackgroundColorProps> = {
  props: ['color'],
  resolve(values, theme): ViewStyle {
    return values.color ? { backgroundColor: theme.colors.background[values.color] } : {};
  },
};
```

- [ ] **Step 4: radius.ts 구현**

```ts
import type { ViewStyle } from 'react-native';
import type { RadiusKey } from '@/shared/theme';
import type { Resolver } from '../resolver';

export type RadiusProps = { radius?: RadiusKey };

export const radius: Resolver<RadiusProps> = {
  props: ['radius'],
  resolve(values, theme): ViewStyle {
    return values.radius ? { borderRadius: theme.radius[values.radius] } : {};
  },
};
```

- [ ] **Step 5: flow.ts 구현**

```ts
import type { ViewStyle } from 'react-native';
import type { Resolver } from '../resolver';

/** flex 정렬 통과(토큰 아님). justify=주축 분배, align=교차축 정렬. */
export type FlowProps = {
  justify?: ViewStyle['justifyContent'];
  align?: ViewStyle['alignItems'];
};

export const flow: Resolver<FlowProps> = {
  props: ['justify', 'align'],
  resolve(values, _theme): ViewStyle {
    const out: ViewStyle = {};
    if (values.justify !== undefined) out.justifyContent = values.justify;
    if (values.align !== undefined) out.alignItems = values.align;
    return out;
  },
};
```

- [ ] **Step 6: 엔진 배럴에 5종 추가** — `src/shared/lib/style-engine/index.ts` 끝에:

```ts
export { spacing, type SpacingProps, type SpaceValue, type PaddingValue } from './resolvers/spacing';
export { gap, type GapProps } from './resolvers/gap';
export { backgroundColor, type BackgroundColorProps, type BackgroundKey } from './resolvers/background-color';
export { radius, type RadiusProps } from './resolvers/radius';
export { flow, type FlowProps } from './resolvers/flow';
```

- [ ] **Step 7: 통과 + 타입 + 린트** — Run `pnpm test -- layout-resolvers && pnpm exec tsc --noEmit && pnpm exec eslint src/shared/lib/style-engine --max-warnings=0` → PASS, 0 errors, clean.

- [ ] **Step 8: 커밋**

```bash
git add src/shared/lib/style-engine
git commit -m "feat(style-engine): backgroundColor/radius/flow 리졸버 + 배럴 (TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Box/Row/Column 재작성 + layout-style 삭제 (커밋 ④)

**Files:** Modify `box.tsx`, `row.tsx`, `column.tsx`, `layout/index.ts`; Delete `layout-style.ts`, `__tests__/layout-style.test.ts`

- [ ] **Step 1: box.tsx 재작성** (전체 교체)

```tsx
import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import {
  backgroundColor,
  radius,
  spacing,
  withStyleProps,
  type BackgroundColorProps,
  type RadiusProps,
  type SpacingProps,
} from '@/shared/lib/style-engine';

/** 배경·패딩·radius를 갖는 시각적 컨테이너(Flutter Container 대응). 나열·간격은 Row/Column. */
export const Box = withStyleProps<SpacingProps & BackgroundColorProps & RadiusProps, ViewProps>(View, {
  resolvers: [spacing, backgroundColor, radius],
});

export type BoxProps = ComponentProps<typeof Box>;
```

- [ ] **Step 2: row.tsx 재작성** (전체 교체)

```tsx
import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import {
  backgroundColor,
  flow,
  gap,
  radius,
  spacing,
  withStyleProps,
  type BackgroundColorProps,
  type FlowProps,
  type GapProps,
  type RadiusProps,
  type SpacingProps,
} from '@/shared/lib/style-engine';

/** 가로 나열(Flutter Row 대응). justify=주축 분배, align=교차축 정렬. */
export const Row = withStyleProps<
  SpacingProps & GapProps & BackgroundColorProps & RadiusProps & FlowProps,
  ViewProps
>(View, {
  base: { flexDirection: 'row' },
  resolvers: [spacing, gap, backgroundColor, radius, flow],
});

export type RowProps = ComponentProps<typeof Row>;
```

- [ ] **Step 3: column.tsx 재작성** (전체 교체 — row.tsx와 동일하되 flexDirection: 'column')

```tsx
import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import {
  backgroundColor,
  flow,
  gap,
  radius,
  spacing,
  withStyleProps,
  type BackgroundColorProps,
  type FlowProps,
  type GapProps,
  type RadiusProps,
  type SpacingProps,
} from '@/shared/lib/style-engine';

/** 세로 나열(Flutter Column 대응). justify=주축 분배, align=교차축 정렬. */
export const Column = withStyleProps<
  SpacingProps & GapProps & BackgroundColorProps & RadiusProps & FlowProps,
  ViewProps
>(View, {
  base: { flexDirection: 'column' },
  resolvers: [spacing, gap, backgroundColor, radius, flow],
});

export type ColumnProps = ComponentProps<typeof Column>;
```

- [ ] **Step 4: layout 배럴 갱신** — `src/shared/components/layout/index.ts` (전체 교체):

```ts
export { Box, type BoxProps } from './box';
export { Row, type RowProps } from './row';
export { Column, type ColumnProps } from './column';
```
(제거된 `FlowProps, PaddingValue, SharedLayoutProps, SpaceValue` re-export는 외부 미사용 확인됨. PaddingValue/SpaceValue가 필요하면 `@/shared/lib/style-engine`에서 import.)

- [ ] **Step 5: layout-style.ts + 구 테스트 삭제**

```bash
git rm src/shared/components/layout/layout-style.ts
git rm src/shared/components/layout/__tests__/layout-style.test.ts
```
(케이스는 Task 1~2의 `layout-resolvers.test.ts`로 이미 포팅됨.)

- [ ] **Step 6: 전체 검증** — Run `pnpm exec tsc --noEmit && pnpm exec eslint . --max-warnings=0 && pnpm test`
Expected: 0 tsc errors(소비처 6파일 + shared 내부가 계약 보존으로 컴파일), eslint clean, 전체 PASS(기존 - layout-style 테스트 + layout-resolvers 신규). `background=` 사용 소비처가 없으므로 `color` 리네임으로 인한 컴파일 에러도 없어야 함. 만약 어떤 소비처가 `background=`를 쓰고 있었다면(예상 밖) 그 파일을 `color=`로 교정하고 보고.

- [ ] **Step 7: 커밋**

```bash
git add src/shared/components/layout
git commit -m "refactor(layout): Box/Row/Column을 withStyleProps로 이관 (buildLayoutStyle 제거)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 규약 문서 + 최종 리뷰 + finishing

- [ ] **Step 1: 규약 §8에 레이아웃 색 prop 한 줄 추가** — `docs/design-system/component-prop-conventions.md`의 아토믹/스타일엔진 섹션에: "열린 레이아웃(Box/Row/Column)의 색 prop = `color`(자기 그룹키 `keyof ModeColors['background']`, 예 `color=\"surface\"`); 아톰은 슬롯별 색(Chip `containerColor` 등). 레이아웃 `color`(그룹키) ↔ Chip `background`(ColorPath) 불일치는 무채색 chip 토큰 후속에서 통일 예정." 커밋:

```bash
git add docs/design-system/component-prop-conventions.md
git commit -m "docs(conventions): 레이아웃 color prop 규칙 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 2: 최종 통합 리뷰** — 컨트롤러가 서브에이전트로 전체 브랜치(main..HEAD) 리뷰: 게이트 재확인, buildLayoutStyle 완전 제거, 공개 API 보존(소비처 무변경), 리졸버 idiom 일관성, 네임충돌 alias 확인.

- [ ] **Step 3: 시각 검증(가능 시)** — dev 앱으로 홈/로그인 레이아웃 회귀 확인. 네이티브 바이너리 이슈(RNGoogleSignin)로 막히면 Martin 수동 QA 이연(전례).

- [ ] **Step 4: finishing-a-development-branch** — Martin에게 push+PR 옵션 제시(push는 명시 승인 후).

---

## 완료 기준

- [ ] `pnpm test` 전체 PASS (기존 − layout-style 테스트 + layout-resolvers 신규)
- [ ] `pnpm exec tsc --noEmit` / `pnpm exec eslint . --max-warnings=0` 클린
- [ ] `layout-style.ts`/`buildLayoutStyle` 삭제, Box/Row/Column이 withStyleProps 기반
- [ ] 공개 API 보존 — 소비처 6파일 코드 무변경(`background`→`color`는 사용처 0이라 무영향), `margin`/`m` 추가
- [ ] 커밋 ~5개, 브랜치 `feature/layout-engine-migration`, **push 안 함**
