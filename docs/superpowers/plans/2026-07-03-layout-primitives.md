# 레이아웃 프리미티브 (Box·Row·Column) 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 토큰 타입 props를 받는 Box/Row/Column 레이아웃 프리미티브를 구현하고 기존 3개 화면을 마이그레이션한다 (시각 diff 0).

**Architecture:** 순수 함수 `buildLayoutStyle`이 토큰→ViewStyle 매핑을 전담(padding 4변 정규화, 문자열=토큰/숫자=원시 px). 세 컴포넌트는 View를 직접 렌더하고 빌더만 공유하며, 사용자 `style`은 항상 병합 마지막. codegen/생성물 무변경 — 기존 `theme/generated/` 소비만.

**Tech Stack:** RN 0.85 / TypeScript / jest(순수 로직 유닛테스트, RTL 미도입)

**스펙:** `docs/superpowers/specs/2026-07-03-layout-primitives-design.md`

**제약:**
- **선행 조건: PR #4(feature/typography-component)가 main에 머지되어 있어야 한다.** Task 0에서 검증하고, 미머지면 중단 후 보고.
- `git push` 금지. PR 생성은 Martin의 명시 요청 시에만.
- `git add`는 항상 pathspec 명시 (untracked OTA 문서 2건이 working tree에 있음 — 쓸어담기 금지).
- 테스트 기준선: main(PR #4 머지 후) `npm test` **76 passed**. 각 커밋에서 감소 금지.

**플랜 작성 시점에 검증된 가정:** `` `${keyof typeof spacing}` `` 문자열 리터럴 키로 숫자 키 객체 `spacing`을 인덱싱하는 것은 이 repo의 tsc 설정에서 통과함(2026-07-03 tsc --noEmit exit 0으로 직접 확인). 구현자가 재검증할 필요 없음.

---

## File Structure

| 경로 | 작업 | 책임 |
|---|---|---|
| `src/shared/theme/index.ts` | Modify | `SpacingKey`/`RadiusKey` 타입 export 추가 |
| `src/shared/components/layout/layout-style.ts` | Create | prop 타입 + `buildLayoutStyle` 순수 함수 (토큰 매핑 전담) |
| `src/shared/components/layout/__tests__/layout-style.test.ts` | Create | 빌더 유닛테스트 13건 |
| `src/shared/components/layout/box.tsx` | Create | Box |
| `src/shared/components/layout/row.tsx` | Create | Row |
| `src/shared/components/layout/column.tsx` | Create | Column |
| `src/shared/components/layout/index.ts` | Create | barrel |
| `src/shared/components/index.ts` | Modify | Box/Row/Column export 추가 |
| `src/features/home/screens/home-screen.tsx` | Modify | body→Column, borderRadius 토큰화 |
| `src/features/auth/screens/login-screen.tsx` | Modify | body→Column, borderRadius 토큰화 |
| `src/shared/components/placeholder-screen.tsx` | Modify | body→Column, marginTop→gap |

---

### Task 0: 선행 조건 확인 + 브랜치 + docs 커밋

- [ ] **Step 0-1: PR #4 머지 확인**

Run: `gh pr view 4 --json state,mergedAt`
Expected: `"state": "MERGED"`. 아니면 **여기서 중단**하고 보고.

- [ ] **Step 0-2: main 최신화 + 기준선 확인**

```bash
git checkout main && git pull
npm test
```
Expected: Tests: **76 passed**. (숫자가 다르면 실제 수를 기준선으로 기록하고 계속 — 이후 커밋에서 감소만 금지.)

- [ ] **Step 0-3: 브랜치 생성 + 문서 커밋**

```bash
git checkout -b feature/layout-primitives
git add docs/superpowers/specs/2026-07-03-layout-primitives-design.md docs/superpowers/plans/2026-07-03-layout-primitives.md
git commit -m "docs: add layout primitives (Box/Row/Column) spec and plan"
```

---

### Task 1 (Unit A · 커밋 ①): theme 타입 export + 스타일 빌더 (TDD)

**Files:**
- Modify: `src/shared/theme/index.ts`
- Test: `src/shared/components/layout/__tests__/layout-style.test.ts`
- Create: `src/shared/components/layout/layout-style.ts`

- [ ] **Step 1-1: theme public API에 키 타입 추가**

`src/shared/theme/index.ts` 전체를 다음으로 교체:

```ts
import { spacing } from './generated/spacing';
import { radius } from './generated/radius';

export { ThemeProvider } from './theme-provider';
export { useTheme, useAppColors } from './use-theme';
export type { ModeColors } from './generated/mode-colors';
export type { ThemeMode, ResolvedTheme } from './resolve-theme';
export { navigationDayTheme, navigationNightTheme } from './navigation-theme';
export { spacing, radius };

/** spacing 토큰 키의 문자열 리터럴 유니언('50' | '100' | … | '1000'). 숫자 키를 템플릿 리터럴로 문자열화. */
export type SpacingKey = `${keyof typeof spacing}`;
export type RadiusKey = keyof typeof radius;
```

- [ ] **Step 1-2: 실패하는 테스트 작성**

`src/shared/components/layout/__tests__/layout-style.test.ts` 생성:

```ts
import type { ModeColors } from '@/shared/theme';
import { buildLayoutStyle } from '../layout-style';

// 빌더는 background 그룹만 조회하므로 최소 fixture로 충분하다.
const colors = {
  background: {
    default: '#101010',
    surface: '#ffffff',
    inset: '#eeeeee',
    highlight: '#ddffdd',
    alert: '#ffdddd',
  },
} as ModeColors;

describe('buildLayoutStyle — padding', () => {
  it('스칼라 토큰을 4변으로 정규화한다', () => {
    expect(buildLayoutStyle({ padding: '300' }, colors)).toStrictEqual({
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
    });
  });

  it('스칼라 원시 px를 그대로 쓴다', () => {
    expect(buildLayoutStyle({ padding: 10 }, colors)).toStrictEqual({
      paddingTop: 10,
      paddingRight: 10,
      paddingBottom: 10,
      paddingLeft: 10,
    });
  });

  it('2-value는 [Y, X]다', () => {
    expect(buildLayoutStyle({ padding: ['100', '300'] }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 24,
      paddingBottom: 8,
      paddingLeft: 24,
    });
  });

  it('3-value는 [top, X, bottom]이다', () => {
    expect(buildLayoutStyle({ padding: ['100', '200', '100'] }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 16,
      paddingBottom: 8,
      paddingLeft: 16,
    });
  });

  it('4-value는 시계방향 [top, right, bottom, left]다', () => {
    expect(buildLayoutStyle({ padding: ['50', '100', '150', '200'] }, colors)).toStrictEqual({
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 12,
      paddingLeft: 16,
    });
  });

  it('토큰/원시 px 혼용을 허용하고 0도 명시 방출한다', () => {
    expect(buildLayoutStyle({ padding: [8, '200', 0] }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 16,
      paddingBottom: 0,
      paddingLeft: 16,
    });
  });

  it('p는 padding의 alias다', () => {
    expect(buildLayoutStyle({ p: '300' }, colors)).toStrictEqual(
      buildLayoutStyle({ padding: '300' }, colors),
    );
  });

  it('동시 지정 시 padding(풀네임)이 p보다 우선한다', () => {
    expect(buildLayoutStyle({ padding: '100', p: '300' }, colors)).toStrictEqual({
      paddingTop: 8,
      paddingRight: 8,
      paddingBottom: 8,
      paddingLeft: 8,
    });
  });
});

describe('buildLayoutStyle — 기타 토큰', () => {
  it('미지정이면 빈 객체를 반환한다 (undefined 키 없음)', () => {
    expect(buildLayoutStyle({}, colors)).toStrictEqual({});
  });

  it('background는 모드컬러를 조회한다', () => {
    expect(buildLayoutStyle({ background: 'surface' }, colors)).toStrictEqual({
      backgroundColor: '#ffffff',
    });
  });

  it('radius는 토큰을 조회한다', () => {
    expect(buildLayoutStyle({ radius: 'md' }, colors)).toStrictEqual({
      borderRadius: 8,
    });
  });

  it('gap은 토큰을 조회한다', () => {
    expect(buildLayoutStyle({ gap: '300' }, colors)).toStrictEqual({ gap: 24 });
  });

  it('gap은 원시 px도 허용한다', () => {
    expect(buildLayoutStyle({ gap: 10 }, colors)).toStrictEqual({ gap: 10 });
  });
});
```

참고: `toStrictEqual`이 필수 — `toEqual`은 `{ paddingTop: undefined }`를 `{}`와 동일 취급해서 "undefined 키 미방출" 검증이 무력화된다.

- [ ] **Step 1-3: RED 확인**

Run: `npm test -- layout-style`
Expected: FAIL — `Cannot find module '../layout-style'`

- [ ] **Step 1-4: 빌더 구현**

`src/shared/components/layout/layout-style.ts` 생성:

```ts
import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import {
  radius,
  spacing,
  type ModeColors,
  type RadiusKey,
  type SpacingKey,
} from '@/shared/theme';

/** 문자열 = spacing 토큰 키(예: '300' → 24px), 숫자 = 원시 px(의도적 이탈 — 호출부에서 가시적). */
export type SpaceValue = SpacingKey | number;

/**
 * CSS padding shorthand의 배열 번역.
 * 스칼라=전 방향, [Y, X], [top, X, bottom], [top, right, bottom, left](시계방향).
 */
export type PaddingValue =
  | SpaceValue
  | readonly [SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue, SpaceValue];

export type BackgroundKey = keyof ModeColors['background'];

/** Box·Row·Column 공통 props. */
export type SharedLayoutProps = Omit<ViewProps, 'style' | 'children'> & {
  padding?: PaddingValue;
  /** padding의 alias. 동시 지정 시 padding(풀네임)이 우선. */
  p?: PaddingValue;
  background?: BackgroundKey;
  radius?: RadiusKey;
  /**
   * 토큰 비관할 레이아웃 전용 탈출구(flex/width/position 등). 토큰 관할 속성
   * (padding/gap/radius/background)은 props로만 쓴다. 병합 순서상 항상 마지막.
   */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export type FlowProps = SharedLayoutProps & {
  gap?: SpaceValue;
  /** 주축 정렬(분배) → justifyContent */
  justify?: ViewStyle['justifyContent'];
  /** 교차축 정렬 → alignItems */
  align?: ViewStyle['alignItems'];
};

/** buildLayoutStyle이 소비하는 토큰 props 부분집합. */
export type LayoutTokenProps = {
  padding?: PaddingValue;
  p?: PaddingValue;
  background?: BackgroundKey;
  radius?: RadiusKey;
  gap?: SpaceValue;
};

function resolveSpace(value: SpaceValue): number {
  return typeof value === 'string' ? spacing[value] : value;
}

/** [top, right, bottom, left]로 정규화 — RN 내부 shorthand 해석에 의존하지 않는다. */
function resolvePadding(value: PaddingValue): [number, number, number, number] {
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

/** 토큰 props → ViewStyle. 미지정 prop은 키 자체를 방출하지 않는다. */
export function buildLayoutStyle(props: LayoutTokenProps, colors: ModeColors): ViewStyle {
  const out: ViewStyle = {};
  const paddingInput = props.padding ?? props.p;
  if (paddingInput !== undefined) {
    const [top, right, bottom, left] = resolvePadding(paddingInput);
    out.paddingTop = top;
    out.paddingRight = right;
    out.paddingBottom = bottom;
    out.paddingLeft = left;
  }
  if (props.gap !== undefined) {
    out.gap = resolveSpace(props.gap);
  }
  if (props.background !== undefined) {
    out.backgroundColor = colors.background[props.background];
  }
  if (props.radius !== undefined) {
    out.borderRadius = radius[props.radius];
  }
  return out;
}
```

- [ ] **Step 1-5: GREEN 확인 + typecheck**

```bash
npm test -- layout-style   # Expected: 13 passed
npm test                   # Expected: 89 passed (기준선 76 + 13)
npx tsc --noEmit           # Expected: exit 0
```

- [ ] **Step 1-6: 커밋 ①**

```bash
git add src/shared/theme/index.ts src/shared/components/layout/layout-style.ts src/shared/components/layout/__tests__/layout-style.test.ts
git commit -m "feat(components): add token-typed layout style builder"
```

---

### Task 2 (Unit B · 커밋 ②): Box / Row / Column 컴포넌트

**Files:**
- Create: `src/shared/components/layout/box.tsx`, `row.tsx`, `column.tsx`, `index.ts`
- Modify: `src/shared/components/index.ts`

컴포넌트에 신규 로직 없음(로직은 전부 Task 1의 빌더) — 유닛테스트 추가 없이 typecheck/lint로 검증하고, 렌더 검증은 Task 4의 시각 확인.

- [ ] **Step 2-1: Box**

`src/shared/components/layout/box.tsx` 생성:

```tsx
import { View } from 'react-native';
import { useAppColors } from '@/shared/theme';
import { buildLayoutStyle, type SharedLayoutProps } from './layout-style';

export type BoxProps = SharedLayoutProps;

/** 배경·패딩·radius를 갖는 시각적 컨테이너(Flutter Container 대응). 나열·간격은 Row/Column 관할. */
export function Box({ padding, p, background, radius, style, children, ...rest }: BoxProps) {
  const colors = useAppColors();
  return (
    <View style={[buildLayoutStyle({ padding, p, background, radius }, colors), style]} {...rest}>
      {children}
    </View>
  );
}
```

- [ ] **Step 2-2: Row**

`src/shared/components/layout/row.tsx` 생성:

```tsx
import { View, type ViewStyle } from 'react-native';
import { useAppColors } from '@/shared/theme';
import { buildLayoutStyle, type FlowProps } from './layout-style';

export type RowProps = FlowProps;

/** 가로 나열(Flutter Row 대응). justify=주축 정렬(분배), align=교차축 정렬. */
export function Row({
  padding,
  p,
  background,
  radius,
  gap,
  justify,
  align,
  style,
  children,
  ...rest
}: RowProps) {
  const colors = useAppColors();
  // undefined 키를 style 객체에 남기지 않기 위해 조건부로만 채운다.
  const flow: ViewStyle = { flexDirection: 'row' };
  if (justify !== undefined) {
    flow.justifyContent = justify;
  }
  if (align !== undefined) {
    flow.alignItems = align;
  }
  return (
    <View
      style={[flow, buildLayoutStyle({ padding, p, background, radius, gap }, colors), style]}
      {...rest}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 2-3: Column**

`src/shared/components/layout/column.tsx` 생성 (Row와 방향만 다름):

```tsx
import { View, type ViewStyle } from 'react-native';
import { useAppColors } from '@/shared/theme';
import { buildLayoutStyle, type FlowProps } from './layout-style';

export type ColumnProps = FlowProps;

/** 세로 나열(Flutter Column 대응). justify=주축 정렬(분배), align=교차축 정렬. */
export function Column({
  padding,
  p,
  background,
  radius,
  gap,
  justify,
  align,
  style,
  children,
  ...rest
}: ColumnProps) {
  const colors = useAppColors();
  // RN 기본값이 column이지만 명시성 우선. undefined 키는 남기지 않는다.
  const flow: ViewStyle = { flexDirection: 'column' };
  if (justify !== undefined) {
    flow.justifyContent = justify;
  }
  if (align !== undefined) {
    flow.alignItems = align;
  }
  return (
    <View
      style={[flow, buildLayoutStyle({ padding, p, background, radius, gap }, colors), style]}
      {...rest}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 2-4: barrel**

`src/shared/components/layout/index.ts` 생성:

```ts
export { Box, type BoxProps } from './box';
export { Row, type RowProps } from './row';
export { Column, type ColumnProps } from './column';
export type { FlowProps, PaddingValue, SharedLayoutProps, SpaceValue } from './layout-style';
```

`src/shared/components/index.ts` 전체를 다음으로 교체:

```ts
export { ScreenContainer } from './screen-container';
export { PlaceholderScreen } from './placeholder-screen';
export { Typography, type TypographyProps } from './Typography';
export { Box, Row, Column, type BoxProps, type RowProps, type ColumnProps } from './layout';
```

- [ ] **Step 2-5: 검증 + 커밋 ②**

```bash
npx tsc --noEmit   # Expected: exit 0
npm run lint       # Expected: 에러 0
npm test           # Expected: 89 passed
git add src/shared/components/layout/ src/shared/components/index.ts
git commit -m "feat(components): add Box/Row/Column layout primitives"
```

---

### Task 3 (Unit C · 커밋 ③): 3화면 마이그레이션

**Files:**
- Modify: `src/features/home/screens/home-screen.tsx`
- Modify: `src/features/auth/screens/login-screen.tsx`
- Modify: `src/shared/components/placeholder-screen.tsx`

전부 값 등가 치환 — 시각 diff 0이 목표. Text 시각 속성(title/linkText/btnText)과 Pressable 구조는 **건드리지 않는다**.

- [ ] **Step 3-1: home-screen**

`src/features/home/screens/home-screen.tsx`에서:

임포트 (View 제거, Column·radius 추가):
```tsx
// Before
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppNavigation, useAuthStore } from '@/features/auth';
import { ScreenContainer, Typography } from '@/shared/components';
import { spacing, useAppColors } from '@/shared/theme';
// After
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppNavigation, useAuthStore } from '@/features/auth';
import { Column, ScreenContainer, Typography } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';
```

JSX (여는/닫는 태그):
```tsx
// Before
<View style={styles.body}>
  …
</View>
// After
<Column padding="300" gap="300" style={styles.body}>
  …
</Column>
```

styles:
```ts
// Before
body: { flex: 1, padding: spacing[300], gap: spacing[300] },
…
link: {
  borderWidth: 1,
  borderRadius: 8,
  paddingVertical: spacing[100],
  paddingHorizontal: spacing[300],
  alignItems: 'center',
},
// After
body: { flex: 1 },
…
link: {
  borderWidth: 1,
  borderRadius: radius.md,
  paddingVertical: spacing[100],
  paddingHorizontal: spacing[300],
  alignItems: 'center',
},
```

- [ ] **Step 3-2: login-screen**

`src/features/auth/screens/login-screen.tsx`에서:

임포트 (View 제거, Column·radius 추가):
```tsx
// Before
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
…
import { ScreenContainer } from '@/shared/components';
import { spacing, useAppColors } from '@/shared/theme';
// After
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
…
import { Column, ScreenContainer } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';
```

JSX:
```tsx
// Before
<View style={styles.body}>
  …
</View>
// After
<Column padding="300" gap="300" justify="center" style={styles.body}>
  …
</Column>
```

styles:
```ts
// Before
body: { flex: 1, padding: spacing[300], gap: spacing[300], justifyContent: 'center' },
title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
btn: { borderWidth: 1, borderRadius: 8, paddingVertical: spacing[200], alignItems: 'center' },
// After
body: { flex: 1 },
title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
btn: { borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing[200], alignItems: 'center' },
```

- [ ] **Step 3-3: placeholder-screen**

`src/shared/components/placeholder-screen.tsx`에서:

임포트 (View·spacing 제거, Column 추가 — **barrel 자기참조를 피해 `./layout`에서 직접 임포트**, `./screen-container` 직접 임포트와 같은 관례):
```tsx
// Before
import { StyleSheet, Text, View } from 'react-native';
import { spacing, useAppColors, type ModeColors } from '../theme';
import { ScreenContainer } from './screen-container';
// After
import { StyleSheet, Text } from 'react-native';
import { useAppColors, type ModeColors } from '../theme';
import { Column } from './layout';
import { ScreenContainer } from './screen-container';
```

JSX:
```tsx
// Before
<View style={styles.body}>
  <Text style={styles.title}>{title}</Text>
  {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
</View>
// After
<Column padding="300" gap="100" style={styles.body}>
  <Text style={styles.title}>{title}</Text>
  {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
</Column>
```

makeStyles (body에서 padding 제거, caption에서 marginTop 제거 — gap="100"이 동일 간격 8px 재현):
```ts
// Before
body: {
  flex: 1,
  padding: spacing[300],
},
…
caption: {
  color: colors.text.subtle,
  fontSize: 14,
  marginTop: spacing[100],
},
// After
body: {
  flex: 1,
},
…
caption: {
  color: colors.text.subtle,
  fontSize: 14,
},
```

- [ ] **Step 3-4: 검증 + 커밋 ③**

```bash
npx tsc --noEmit   # Expected: exit 0
npm run lint       # Expected: 에러 0
npm test           # Expected: 89 passed
git add src/features/home/screens/home-screen.tsx src/features/auth/screens/login-screen.tsx src/shared/components/placeholder-screen.tsx
git commit -m "refactor(screens): migrate screen layouts to Column primitive"
```

---

### Task 4 (Unit D): 시뮬레이터 시각 검증 (커밋 없음)

- [ ] **Step 4-1: 앱 기동**

Run: `npm run ios` (scheme 'Forceteller Dev', Debug-dev)

- [ ] **Step 4-2: day/night × 3화면 확인**

```bash
xcrun simctl ui booted appearance light   # day 확인 후
xcrun simctl ui booted appearance dark    # night 확인
```

확인 항목 (마이그레이션 전과 동일해야 함):
- 홈: body 패딩 24/간격 24, 버튼 3개 radius 8 유지
- 로그인 (홈에서 미로그인 상태로 진입): 세로 중앙 정렬 유지
- 플레이스홀더 탭: title/caption 간격 8 유지
- 테마 전환 시 배경/텍스트 색 정상 반응

- [ ] **Step 4-3: 결과 보고**

스크린샷 확보(`xcrun simctl io booted screenshot <path>`) 후 Martin에게 보고. 이상 발견 시 수정 후 별도 커밋.

---

## 완료 기준

- `npm test` 89 passed (기준선 76 + 빌더 13)
- `npx tsc --noEmit`, `npm run lint` 클린
- 3화면 시각 diff 0 (day/night)
- 커밋 4개 (docs / 빌더 / 컴포넌트 / 마이그레이션), push는 하지 않은 상태

## 범위 밖 (스펙 기록)

Gap/Spacer 위젯, flexWrap·reverse, paddingStart/End(RTL), flex named prop 승격, 숫자 이탈 경고 lint 규칙, Button/Card 컴포넌트.
