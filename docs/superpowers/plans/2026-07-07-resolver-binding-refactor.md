# 리졸버 바인딩 재설계 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스타일 엔진 리졸버를 prop 이름에서 분리한다 — `Resolver<V> = (value, theme) => style` 순수 변환 + prop 이름→변환 바인딩은 컴포넌트의 `resolvers` 맵이 소유.

**Architecture:** 계약 변경(breaking)이라 코어(resolver/compose-styles/with-style-props) + 변환 9종 + 소비 컴포넌트 4종을 **한 커밋에 원자적으로** 전환한다(중간 tsc red 회피). 무방출 가드는 `composeStyles`로 중앙화되어 변환은 항상 정의된 값만 받는다. TokenProps는 바인딩 맵에서 타입 추론된다(명시 제네릭 폐지).

**Tech Stack:** TypeScript, React Native, Jest. 스펙: `docs/superpowers/specs/2026-07-07-resolver-binding-design.md`.

**브랜치:** `feature/layout-engine-migration`(PR #11)에 **이어서** 커밋(Martin 지시 — #11 검수 중 파생). 별도 브랜치 안 만든다. push/PR 본문 갱신은 Martin 명시 승인 후.

---

## File Structure

**엔진 코어** (`src/shared/lib/style-engine/`):
- `resolver.ts` — `Resolver<V>` 함수형 타입 + `ResolversMap` + `TokenPropsOf<R>`. (`{props, resolve}` 객체 폐지)
- `compose-styles.ts` — 맵 순회 + 무방출 중앙 가드. `collectResolverProps` 삭제.
- `with-style-props.tsx` — `resolvers` 맵 수용 + 제네릭 추론.
- `index.ts` — 배럴: 변환 9종 + 타입. 리졸버별 `*Props` 타입 export 제거.

**변환** (`src/shared/lib/style-engine/resolvers/`): 각 파일 하나의 책임.
- `background.ts` (← `background-color.ts` 리네임) — `background: Resolver<BackgroundKey>`.
- `text-color.ts` — `textColor: Resolver<ColorPath>`.
- `font.ts` — `font: Resolver<TypographyVariant>`.
- `spacing.ts` — `padding` + `margin` 두 변환(shorthand 정규화 유지) + `SpaceValue`/`PaddingValue`.
- `gap.ts` — `gap: Resolver<SpaceValue>`.
- `radius.ts` — `radius: Resolver<RadiusKey>`.
- `alignment.ts` — `justify` + `align` 두 변환. (구현 후 `flow.ts`에서 리네임)
- `color.ts` — **삭제**(ColorPath 배경/보더 변환은 chip.tsx로 콜로케이션).

**컴포넌트**:
- `src/shared/components/layout/{box,row,column}.tsx` — `resolvers` 맵 바인딩.
- `src/shared/components/chip/chip.tsx` — 로컬 `chipBackground`/`chipBorderColor` 변환 + 바인딩 맵.

**테스트** (`src/shared/lib/style-engine/__tests__/`):
- `resolvers.test.ts` — 색 변환(background/textColor/font) 함수형 호출.
- `layout-resolvers.test.ts` — 기하 변환(padding/margin/gap/radius/justify/align) 함수형 호출.
- `compose-styles.test.ts` — 맵 API + 무방출 가드 + alias 우선순위 + 불변식.
- `color-path.test.ts` — 변경 없음.

---

## Task 0: 스펙 커밋 (컨트롤러 직접 수행)

**Files:**
- Commit: `docs/superpowers/specs/2026-07-07-resolver-binding-design.md`, `docs/superpowers/plans/2026-07-07-resolver-binding-refactor.md`

- [ ] **Step 1: 스펙 + 플랜 커밋** (현 브랜치, docs만 scoped add)

```bash
git add docs/superpowers/specs/2026-07-07-resolver-binding-design.md docs/superpowers/plans/2026-07-07-resolver-binding-refactor.md
git commit -m "docs(style-engine): 리졸버 바인딩 재설계 스펙/플랜

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Expected: 2 files changed. (OTA 문서 등 untracked는 건드리지 않음 — scoped add)

---

## Task 1: 리졸버 바인딩 계약 원자적 전환 (서브에이전트)

**단일 커밋.** 코어+변환+컴포넌트+테스트를 함께 바꿔야 tsc가 최종 그린. 중간 스텝은 red일 수 있으나 커밋 전 게이트 통과.

**Files:**
- Modify: `src/shared/lib/style-engine/resolver.ts`, `compose-styles.ts`, `with-style-props.tsx`, `index.ts`
- Modify: `src/shared/lib/style-engine/resolvers/{text-color,font,spacing,gap,radius,alignment}.ts`
- Rename: `src/shared/lib/style-engine/resolvers/background-color.ts` → `background.ts`
- Delete: `src/shared/lib/style-engine/resolvers/color.ts`
- Modify: `src/shared/components/layout/{box,row,column}.tsx`, `src/shared/components/chip/chip.tsx`
- Test: `src/shared/lib/style-engine/__tests__/{resolvers,layout-resolvers,compose-styles}.test.ts`

- [ ] **Step 1: 테스트를 함수형/맵 API로 재작성 (RED)**

`resolvers.test.ts` — color 리졸버 삭제됨, background 신규. `.resolve`/`.props` 호출 제거, 미지정 무방출 케이스 제거(composeStyles 책임으로 이동):

```ts
import { background } from '../resolvers/background';
import { textColor } from '../resolvers/text-color';
import { font } from '../resolvers/font';
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
```

`layout-resolvers.test.ts` — spacing→padding/margin, flow→justify/align, 함수형 호출. alias/미지정 케이스는 compose-styles.test.ts로 이동하므로 여기서 제거:

```ts
import { padding, margin } from '../resolvers/spacing';
import { gap } from '../resolvers/gap';
import { radius } from '../resolvers/radius';
import { justify, align } from '../resolvers/alignment';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {} as unknown as ThemeContextValue; // padding/gap은 spacing 스케일 직접 참조

describe('padding resolver', () => {
  it('스칼라 토큰 → 4변', () => {
    expect(padding('300', theme)).toEqual({ paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24 });
  });
  it('스칼라 원시 px', () => {
    expect(padding(14, theme)).toEqual({ paddingTop: 14, paddingRight: 14, paddingBottom: 14, paddingLeft: 14 });
  });
  it('2-value [Y,X]', () => {
    expect(padding(['100', 14], theme)).toEqual({ paddingTop: 8, paddingRight: 14, paddingBottom: 8, paddingLeft: 14 });
  });
  it('3-value [top,X,bottom]', () => {
    expect(padding(['100', 14, '300'], theme)).toEqual({ paddingTop: 8, paddingRight: 14, paddingBottom: 24, paddingLeft: 14 });
  });
  it('4-value [t,r,b,l]', () => {
    expect(padding(['100', 14, '300', 2], theme)).toEqual({ paddingTop: 8, paddingRight: 14, paddingBottom: 24, paddingLeft: 2 });
  });
  it('스칼라 0 명시 방출', () => {
    expect(padding(0, theme)).toEqual({ paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 });
  });
});

describe('margin resolver', () => {
  it('동일 shorthand로 4변', () => {
    expect(margin(['100', 14], theme)).toEqual({ marginTop: 8, marginRight: 14, marginBottom: 8, marginLeft: 14 });
  });
});

describe('gap resolver', () => {
  it('토큰/원시px', () => {
    expect(gap('100', theme)).toEqual({ gap: 8 });
    expect(gap(5, theme)).toEqual({ gap: 5 });
  });
});

const themeWithColors = {
  colors: { background: { surface: '#ffffff', inset: '#f4f4f4' } },
  radius: { md: 8, xl: 99 },
} as unknown as ThemeContextValue;

describe('radius resolver', () => {
  it('토큰 → borderRadius', () => {
    expect(radius('md', themeWithColors)).toEqual({ borderRadius: 8 });
  });
});

describe('alignment resolvers', () => {
  it('justify/align 통과', () => {
    expect(justify('center', themeWithColors)).toEqual({ justifyContent: 'center' });
    expect(align('flex-end', themeWithColors)).toEqual({ alignItems: 'flex-end' });
  });
});
```

`compose-styles.test.ts` — `collectResolverProps` 테스트 삭제, 맵 API + 무방출 + alias + 불변식:

```ts
import { composeStyles } from '../compose-styles';
import { background } from '../resolvers/background';
import { padding } from '../resolvers/spacing';
import type { ThemeContextValue } from '@/shared/theme';

const theme = { colors: { background: { surface: '#fff' } } } as unknown as ThemeContextValue;

describe('composeStyles', () => {
  it('base → 바인딩 순 병합', () => {
    expect(composeStyles({ color: 'surface' }, { height: 32 }, { color: background }, theme))
      .toEqual({ height: 32, backgroundColor: '#fff' });
  });
  it('미지정 prop은 변환 미호출(무방출 중앙 가드)', () => {
    expect(composeStyles({}, undefined, { color: background }, theme)).toEqual({});
  });
  it('alias — 풀네임(뒤 선언)이 축약을 덮음', () => {
    const out = composeStyles({ p: '100', padding: '300' }, undefined, { p: padding, padding }, theme);
    expect(out.paddingTop).toBe(24);
  });
  it('축약만 지정 시 축약 적용', () => {
    const out = composeStyles({ p: '100' }, undefined, { p: padding, padding }, theme);
    expect(out.paddingTop).toBe(8);
  });
  it('base 객체를 변형하지 않음(신선 accumulator)', () => {
    const base = { height: 10 };
    composeStyles({ color: 'surface' }, base, { color: background }, theme);
    expect(base).toEqual({ height: 10 });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- style-engine`
Expected: FAIL (import 경로/시그니처 불일치 — background.ts 없음, padding/margin/justify/align export 없음, composeStyles 맵 미지원)

- [ ] **Step 3: `resolver.ts` 계약 재정의**

```ts
import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';

/**
 * 순수 스타일 변환. prop 이름을 모른다 — 값과 theme만 받아 스타일 조각을 반환.
 * value는 항상 정의됨(composeStyles가 undefined인 prop은 호출하지 않음).
 */
export type Resolver<V> = (value: V, theme: ThemeContextValue) => ViewStyle | TextStyle;

/** prop 이름 → 변환 바인딩. 컴포넌트가 소유. */
export type ResolversMap = Record<string, Resolver<any>>;

/** 바인딩 맵에서 컴포넌트 토큰 prop 타입 유도. alias 키(p/padding)는 같은 V로 나온다. */
export type TokenPropsOf<R extends ResolversMap> = {
  [K in keyof R]?: R[K] extends Resolver<infer V> ? V : never;
};
```

- [ ] **Step 4: `compose-styles.ts` 맵 순회 + 무방출 중앙 가드**

`collectResolverProps` 삭제(withStyleProps가 `Object.keys`로 대체):

```ts
import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';
import type { ResolversMap } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

/**
 * base → 바인딩 선언 순 병합(뒤가 앞을 덮음). 순수함수.
 * props[key]가 undefined면 그 변환은 호출하지 않는다 — "미지정 무방출" 계약을 중앙 강제.
 * 신선한 accumulator에 각 변환 출력을 복사한다 — 변환 반환 객체를 절대 변형하지 않음
 * (font가 공유 typography 토큰 참조를 반환하므로).
 */
export function composeStyles(
  props: Record<string, unknown>,
  base: AnyStyle | undefined,
  resolvers: ResolversMap,
  theme: ThemeContextValue,
): AnyStyle {
  const style: AnyStyle = { ...(base ?? {}) };
  for (const key of Object.keys(resolvers)) {
    const value = props[key];
    if (value !== undefined) Object.assign(style, resolvers[key](value, theme));
  }
  return style;
}
```

- [ ] **Step 5: `with-style-props.tsx` 맵 수용 + 추론**

```tsx
import type { ComponentType } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';
import { composeStyles } from './compose-styles';
import type { ResolversMap, TokenPropsOf } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

type WithStyleOptions<R extends ResolversMap> = {
  base?: AnyStyle;
  /**
   * Pressable 계열 base 전용. 설정 시 style이 함수형(`({pressed}) => ...`)으로 전달되므로,
   * 함수형 style을 호출하지 않는 base(Text/View 등)에 쓰면 스타일이 조용히 사라진다.
   * 타입 레벨 가드(별도 팩토리)는 로드맵.
   */
  pressedStyle?: ViewStyle;
  resolvers: R;
};

/** 베이스 컴포넌트에 토큰 인지 스타일 prop 부여. TokenProps는 resolvers 맵에서 추론. */
export function withStyleProps<
  R extends ResolversMap,
  BaseProps extends { style?: StyleProp<any> },
>(Component: ComponentType<BaseProps>, { base, pressedStyle, resolvers }: WithStyleOptions<R>) {
  const consumed = new Set(Object.keys(resolvers));

  function StyledComponent(
    props: TokenPropsOf<R> & Omit<BaseProps, 'style'> & { style?: StyleProp<AnyStyle> },
  ) {
    const theme = useTheme();
    const composed = composeStyles(props as Record<string, unknown>, base, resolvers, theme);

    const forward: Record<string, unknown> = {};
    for (const key in props) {
      if (!consumed.has(key)) forward[key] = (props as Record<string, unknown>)[key];
    }
    const { style, ...rest } = forward as { style?: StyleProp<AnyStyle> } & Record<string, unknown>;

    const styleValue = pressedStyle
      ? ({ pressed }: { pressed: boolean }) => [composed, pressed && pressedStyle, style]
      : [composed, style];

    return <Component {...(rest as BaseProps)} style={styleValue as StyleProp<AnyStyle>} />;
  }

  StyledComponent.displayName = `withStyleProps(${Component.displayName ?? Component.name ?? 'Component'})`;
  return StyledComponent;
}
```

- [ ] **Step 6: 변환 9종 재작성**

`resolvers/background.ts` (background-color.ts에서 `git mv` 후 내용 교체 — 전환기 주석 삭제):

```ts
import type { ViewStyle } from 'react-native';
import type { ModeColors } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** background 시맨틱 그룹 키(예: 'surface'). */
export type BackgroundKey = keyof ModeColors['background'];

/** 그룹키 → backgroundColor. prop 이름은 컴포넌트가 바인딩(레이아웃 `color`, Chip `background` 등). */
export const background: Resolver<BackgroundKey> = (value, theme): ViewStyle => ({
  backgroundColor: theme.colors.background[value],
});
```

`resolvers/text-color.ts`:

```ts
import type { TextStyle } from 'react-native';
import { resolveColorPath, type ColorPath } from '../color-path';
import type { Resolver } from '../resolver';

/** ColorPath → 텍스트 color. */
export const textColor: Resolver<ColorPath> = (value, theme): TextStyle => ({
  color: resolveColorPath(value, theme),
});
```

`resolvers/font.ts`:

```ts
import type { TextStyle } from 'react-native';
import type { TypographyVariant } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** 타입스케일 variant → 스타일 묶음. 공유 토큰 참조 반환(composeStyles가 복사하므로 안전). */
export const font: Resolver<TypographyVariant> = (value, theme): TextStyle => theme.typography[value];
```

`resolvers/spacing.ts` (padding/margin 두 변환으로 분해, 정규화 로직 유지):

```ts
import type { ViewStyle } from 'react-native';
import { spacing as spacingScale, type SpacingKey } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** 문자열 = spacing 토큰 키('300'→24px), 숫자 = 원시 px(의도적 이탈 — 호출부 가시). */
export type SpaceValue = SpacingKey | number;

/** CSS shorthand: 스칼라=전방향, [Y,X], [top,X,bottom], [t,r,b,l](시계). */
export type PaddingValue =
  | SpaceValue
  | readonly [SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue, SpaceValue];

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

/** shorthand → paddingTop/Right/Bottom/Left(4변 명시). */
export const padding: Resolver<PaddingValue> = (value): ViewStyle => {
  const [t, r, b, l] = resolveEdges(value);
  return { paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l };
};

/** shorthand → marginTop/Right/Bottom/Left(4변 명시). */
export const margin: Resolver<PaddingValue> = (value): ViewStyle => {
  const [t, r, b, l] = resolveEdges(value);
  return { marginTop: t, marginRight: r, marginBottom: b, marginLeft: l };
};
```

`resolvers/gap.ts`:

```ts
import type { ViewStyle } from 'react-native';
import { spacing as spacingScale } from '@/shared/theme';
import type { Resolver } from '../resolver';
import type { SpaceValue } from './spacing';

/** 토큰 키 또는 원시 px → gap. */
export const gap: Resolver<SpaceValue> = (value): ViewStyle => ({
  gap: typeof value === 'string' ? spacingScale[value] : value,
});
```

`resolvers/radius.ts`:

```ts
import type { ViewStyle } from 'react-native';
import type { RadiusKey } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** radius 토큰 키 → borderRadius. */
export const radius: Resolver<RadiusKey> = (value, theme): ViewStyle => ({
  borderRadius: theme.radius[value],
});
```

`resolvers/alignment.ts` (justify/align 두 변환으로 분해. `NonNullable`로 값 타입 정밀화 — TokenPropsOf가 `?`를 붙여 optional 유지):

```ts
import type { ViewStyle } from 'react-native';
import type { Resolver } from '../resolver';

/** 주축 분배 통과(토큰 아님). */
export const justify: Resolver<NonNullable<ViewStyle['justifyContent']>> = (value): ViewStyle => ({
  justifyContent: value,
});

/** 교차축 정렬 통과(토큰 아님). */
export const align: Resolver<NonNullable<ViewStyle['alignItems']>> = (value): ViewStyle => ({
  alignItems: value,
});
```

`resolvers/color.ts` **삭제**: `git rm src/shared/lib/style-engine/resolvers/color.ts`

- [ ] **Step 7: `index.ts` 배럴 갱신**

기존 `*Props` 타입 export 전부 제거(TokenProps 추론이 대체 — Step 9에서 외부 사용처 없음 확인):

```ts
export type { Resolver, ResolversMap, TokenPropsOf } from './resolver';
export { resolveColorPath, type ColorPath } from './color-path';
export { withStyleProps } from './with-style-props';
export { background, type BackgroundKey } from './resolvers/background';
export { textColor } from './resolvers/text-color';
export { font } from './resolvers/font';
export { padding, margin, type SpaceValue, type PaddingValue } from './resolvers/spacing';
export { gap } from './resolvers/gap';
export { radius } from './resolvers/radius';
export { justify, align } from './resolvers/alignment';
```

- [ ] **Step 8: 컴포넌트 바인딩 맵 전환**

`layout/box.tsx` (**alias 규칙: 축약키 먼저, 풀네임 나중 — 뒤 선언이 이김**):

```tsx
import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import { background, margin, padding, radius, withStyleProps } from '@/shared/lib/style-engine';

/** 배경·패딩·radius를 갖는 시각적 컨테이너(Flutter Container 대응). 나열·간격은 Row/Column. */
export const Box = withStyleProps(View, {
  resolvers: { p: padding, padding, m: margin, margin, color: background, radius },
});

export type BoxProps = ComponentProps<typeof Box>;
Box.displayName = 'Box';
```

`layout/row.tsx`:

```tsx
import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import { align, background, gap, justify, margin, padding, radius, withStyleProps } from '@/shared/lib/style-engine';

/** 가로 나열(Flutter Row 대응). justify=주축 분배, align=교차축 정렬. */
export const Row = withStyleProps(View, {
  base: { flexDirection: 'row' },
  resolvers: { p: padding, padding, m: margin, margin, gap, color: background, radius, justify, align },
});

export type RowProps = ComponentProps<typeof Row>;
Row.displayName = 'Row';
```

`layout/column.tsx` (row와 동일, `flexDirection: 'column'`):

```tsx
import { type ComponentProps } from 'react';
import { View, type ViewProps } from 'react-native';
import { align, background, gap, justify, margin, padding, radius, withStyleProps } from '@/shared/lib/style-engine';

/** 세로 나열(Flutter Column 대응). justify=주축 분배, align=교차축 정렬. */
export const Column = withStyleProps(View, {
  base: { flexDirection: 'column' },
  resolvers: { p: padding, padding, m: margin, margin, gap, color: background, radius, justify, align },
});

export type ColumnProps = ComponentProps<typeof Column>;
Column.displayName = 'Column';
```

`chip/chip.tsx` (ColorPath 색 변환을 로컬 상수로 콜로케이션 — 아톰/variant/조합 나머지는 무변경):

```tsx
import { type ComponentProps } from 'react';
import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { radius, type TypographyVariant } from '@/shared/theme';
import {
  font,
  resolveColorPath,
  textColor,
  withStyleProps,
  type ColorPath,
  type Resolver,
} from '@/shared/lib/style-engine';

// ── Chip 로컬 색 변환 ─────────────────────────
// ColorPath 기반. 무채색 chip 시맨틱 토큰 신설 전까지의 우회라 chip에 콜로케이션(공유 background는 그룹키 기반).
const chipBackground: Resolver<ColorPath> = (value, theme) => ({
  backgroundColor: resolveColorPath(value, theme),
});
const chipBorderColor: Resolver<ColorPath> = (value, theme) => ({
  borderColor: resolveColorPath(value, theme),
});

// ── 아톰(비공개) ─────────────────────────────
const ChipContainer = withStyleProps(Pressable, {
  base: {
    height: 32,
    paddingHorizontal: 14, // Figma 실측(스케일 밖 — 원시 px)
    borderRadius: radius.xl, // pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent', // solid도 1px 투명 보더 → outline과 박스 크기 동일
  },
  pressedStyle: { opacity: 0.85 },
  resolvers: { background: chipBackground, borderColor: chipBorderColor },
});

const ChipTextLabel = withStyleProps(Text, {
  resolvers: { color: textColor, font },
});

// ── variant = 토큰 경로 데이터 ────────────────
type ChipAppearance = 'outline' | 'solid';
type ChipVariant = {
  containerColor?: ColorPath;
  containerBorderColor?: ColorPath;
  textLabelColor: ColorPath;
  textLabelFont: TypographyVariant;
};

const chipVariants: Record<ChipAppearance, ChipVariant> = {
  outline: { containerBorderColor: 'text.default', textLabelColor: 'text.default', textLabelFont: 'label-lg' },
  solid: { containerColor: 'text.muted', textLabelColor: 'background.surface', textLabelFont: 'body-lg' },
};

// ── 조합(공개) ───────────────────────────────
export type ChipProps = Omit<PressableProps, 'style' | 'children' | 'accessibilityRole'> & {
  label: string;
  onPress: () => void;
  appearance?: ChipAppearance;
  style?: StyleProp<ViewStyle>;
};

/** 키워드 pill. outline(기본)/solid("더보기"). 엔진 아톰 조합 첫 사례. */
export function Chip({ label, onPress, appearance = 'outline', style, ...rest }: ChipProps) {
  const v = chipVariants[appearance];
  return (
    <ChipContainer
      accessibilityRole="button"
      onPress={onPress}
      background={v.containerColor}
      borderColor={v.containerBorderColor}
      style={style}
      {...rest}
    >
      <ChipTextLabel font={v.textLabelFont} color={v.textLabelColor}>
        {label}
      </ChipTextLabel>
    </ChipContainer>
  );
}
```

- [ ] **Step 9: 삭제된 `*Props` 타입의 외부 사용처 없음 확인**

Run: `git grep -nE "SpacingProps|GapProps|BackgroundColorProps|RadiusProps|FlowProps|ColorProps|TextColorProps|FontProps" -- 'src/**/*.ts' 'src/**/*.tsx'`
Expected: 결과 없음(전부 이 커밋에서 제거됨). 남은 참조가 있으면 해당 파일도 바인딩 맵으로 정리.

- [ ] **Step 10: `background=` prop 사용처(레이아웃 소비자 회귀) 확인**

Run: `git grep -nE "\bbackground=" -- 'src/**/*.tsx'`
Expected: chip.tsx의 `<ChipContainer background=`만. 레이아웃(Box/Row/Column) 소비처는 `color=` 사용이라 무영향(있으면 전환기 이전 잔재 — 조사).

- [ ] **Step 11: BaseProps 추론 검증 (핵심 리스크)**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors. 특히 `withStyleProps(View, {...})`에서 `R`과 `BaseProps`가 **둘 다 추론**되어야 함(TS는 부분 제네릭 명시 불가).
만약 BaseProps 추론 실패(예: `ViewProps`가 안 잡혀 forward 타입 에러)면 폴백: 팩토리를 2-스텝 커리로 분리 —
`export function withStyleProps<BaseProps>(Component) { return function <R>(opts) {...} }`, 호출부 `withStyleProps(View)({ resolvers: {...} })`. 이 폴백 채택 시 컴포넌트 4종 호출부도 그에 맞춰 수정. **추론 성공을 우선 시도, 실패 시에만 폴백.**

- [ ] **Step 12: 전체 게이트**

Run: `pnpm test`
Expected: PASS (기존 대비 총계 -N — color 리졸버 테스트 삭제·미지정 무방출이 compose로 통합됨. 실패 0)

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors

Run: `pnpm exec eslint . --max-warnings=0`
Expected: clean

- [ ] **Step 13: 커밋** (scoped add — style-engine + layout + chip + 테스트만)

```bash
git add src/shared/lib/style-engine src/shared/components/layout src/shared/components/chip/chip.tsx
git commit -m "refactor(style-engine): 리졸버를 prop 이름에서 분리 (함수형 변환 + 바인딩 맵)

- Resolver<V> = (value, theme) => style, prop 이름은 컴포넌트 resolvers 맵이 소유
- 무방출 가드를 composeStyles로 중앙화, TokenProps는 맵에서 추론
- background-color→background 리네임, color.ts 삭제(ColorPath 변환 chip 콜로케이션)
- spacing→padding/margin, flow→justify/align 분해; X자 교차 해소

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1.5: 성능 — composed memoization + ColorPath 플랫 테이블 (서브에이전트, 별도 커밋)

Task 1 랜딩 후 진행. 스펙 §4.1(A+B, Martin 승인). 동작 불변 — identity/할당 최적화만.

**Files:**
- Modify: `src/shared/lib/style-engine/with-style-props.tsx` (A)
- Modify: `src/shared/lib/style-engine/color-path.ts` (B)
- Test: `src/shared/lib/style-engine/__tests__/color-path.test.ts` 확장

- [ ] **Step 1: `color-path.ts` — WeakMap 플랫 테이블 (B)**

```ts
import type { ModeColors, ThemeContextValue } from '@/shared/theme';

/** 'text.default' | 'background.surface' | … — ModeColors에서 유도(수기 유니온 아님). */
export type ColorPath = {
  [G in keyof ModeColors]: `${G & string}.${keyof ModeColors[G] & string}`;
}[keyof ModeColors];

/** 모드별 colors 객체 → 플랫 테이블 캐시. day/night colors는 모듈 상수라 모드당 1회 구축. */
const flatCache = new WeakMap<ModeColors, Record<string, string>>();

function buildFlatTable(colors: ModeColors): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const group of Object.keys(colors)) {
    const entries = (colors as Record<string, Record<string, string>>)[group];
    for (const key of Object.keys(entries)) flat[`${group}.${key}`] = entries[key];
  }
  return flat;
}

/** 시맨틱 색 경로 → 색 문자열. cdk palette.get(path) 선례. 구축 후엔 split/할당 0, 단일 lookup. */
export function resolveColorPath(path: ColorPath, theme: ThemeContextValue): string {
  let flat = flatCache.get(theme.colors);
  if (flat === undefined) {
    flat = buildFlatTable(theme.colors);
    flatCache.set(theme.colors, flat);
  }
  return flat[path];
}
```

- [ ] **Step 2: `color-path.test.ts` 확장** — 기존 케이스 그린 유지 + 반복 호출 일관성/교차 그룹 케이스 추가

- [ ] **Step 3: `with-style-props.tsx` — composed/styleValue identity 안정화 (A)**

`useMemo`+spread deps 대신 ref 기반 shallow-compare 프라이빗 훅(deps 길이 가변 허용 + exhaustive-deps 억제 불필요 + 캐시 안 잊음):

```tsx
import { useMemo, useRef, type ComponentType } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';
import { composeStyles } from './compose-styles';
import type { ResolversMap, TokenPropsOf } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

type WithStyleOptions<R extends ResolversMap> = {
  base?: AnyStyle;
  /**
   * Pressable 계열 base 전용. 설정 시 style이 함수형(`({pressed}) => ...`)으로 전달되므로,
   * 함수형 style을 호출하지 않는 base(Text/View 등)에 쓰면 스타일이 조용히 사라진다.
   * 타입 레벨 가드(별도 팩토리)는 로드맵.
   */
  pressedStyle?: ViewStyle;
  resolvers: R;
};

function depsEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/** deps shallow-compare memo. 소비 키는 팩토리 시점 고정이라 deps 길이 불변 — 렌더 간 비교 안전. */
function useStableValue<T>(compute: () => T, deps: readonly unknown[]): T {
  const ref = useRef<{ deps: readonly unknown[]; value: T } | null>(null);
  if (ref.current === null || !depsEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: compute() };
  }
  return ref.current.value;
}

/** 베이스 컴포넌트에 토큰 인지 스타일 prop 부여. TokenProps는 resolvers 맵에서 추론. */
export function withStyleProps<
  R extends ResolversMap,
  BaseProps extends { style?: StyleProp<any> },
>(Component: ComponentType<BaseProps>, { base, pressedStyle, resolvers }: WithStyleOptions<R>) {
  const orderedKeys = Object.keys(resolvers);
  const consumed = new Set(orderedKeys);

  function StyledComponent(
    props: TokenPropsOf<R> & Omit<BaseProps, 'style'> & { style?: StyleProp<AnyStyle> },
  ) {
    const theme = useTheme();
    const record = props as Record<string, unknown>;

    // 토큰 값 불변 + 같은 theme(모드)이면 composed identity 유지 → 스타일 재계산/재-diff 스킵.
    // 한계: 인라인 배열 shorthand(padding={['100', 14]})는 렌더마다 새 identity라 memo 미스(현행과 동일 비용).
    const composed = useStableValue(
      () => composeStyles(record, base, resolvers, theme),
      [theme, ...orderedKeys.map((key) => record[key])],
    );

    const forward: Record<string, unknown> = {};
    for (const key in props) {
      if (!consumed.has(key)) forward[key] = record[key];
    }
    const { style, ...rest } = forward as { style?: StyleProp<AnyStyle> } & Record<string, unknown>;

    const styleValue = useMemo(
      () =>
        pressedStyle
          ? ({ pressed }: { pressed: boolean }) => [composed, pressed && pressedStyle, style]
          : [composed, style],
      [composed, style],
    );

    return <Component {...(rest as BaseProps)} style={styleValue as StyleProp<AnyStyle>} />;
  }

  StyledComponent.displayName = `withStyleProps(${Component.displayName ?? Component.name ?? 'Component'})`;
  return StyledComponent;
}
```

- [ ] **Step 4: 게이트** — `pnpm test` PASS / `pnpm exec tsc --noEmit` 0 / `pnpm exec eslint . --max-warnings=0` clean

- [ ] **Step 5: 커밋** (scoped add)

```bash
git add src/shared/lib/style-engine
git commit -m "perf(style-engine): composed 스타일 memoization + ColorPath 플랫 테이블

- 토큰 prop 불변 시 composed/styleValue identity 유지(ref 기반 shallow memo)
- resolveColorPath를 WeakMap 모드별 플랫 테이블로 — split/할당 0, 단일 lookup
- 동작 불변(스펙 §4.1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: 규약 문서 §8 갱신 (컨트롤러 직접 수행)

**Files:**
- Modify: `docs/design-system/component-prop-conventions.md` (§8)

- [ ] **Step 1: §8 "아토믹 컴포넌트 조합 + 스타일 엔진" 갱신**

바인딩 맵 모델로 서술 갱신: ①리졸버 = 순수 변환 `(value, theme) => style`, prop 이름 미소유 ②바인딩은 컴포넌트 `resolvers: { propName: 변환 }` 맵, 같은 `color`가 컴포넌트별 다른 변환에 붙음이 정상 ③alias = 이중 키(축약 먼저·풀네임 나중, 뒤 선언 우선). 기존 "전환기 X자 교차/무채색 토큰 후속 통일" 노트는 **해소됨으로 정리**(Chip ColorPath 우회만 chip 로컬 부채로 잔존 명시).

- [ ] **Step 2: 커밋**

```bash
git add docs/design-system/component-prop-conventions.md
git commit -m "docs(conventions): §8 리졸버 바인딩 맵 모델 반영

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 최종 통합 리뷰 + finishing (컨트롤러)

- [ ] **Step 1: 최종 통합 리뷰 서브에이전트** (main..HEAD 전체)

범위: PR #11 기존 layout 이관 커밋 + 이번 재설계 커밋의 상호작용. 확인: ①게이트 3종 재확인 ②`color.ts`/`collectResolverProps`/구 `*Props` 완전 제거, dangling import 없음 ③소비처(화면/위젯) diff 0 — 공개 prop 표면 불변 ④무방출 가드 중앙화가 기존 리졸버별 가드와 동치 ⑤alias 우선순위(padding>p, margin>m) 회귀 없음 ⑥Chip 시각 동작 불변(background/borderColor/color/font 바인딩 매핑) ⑦TokenProps 추론이 잘못된 키를 거부하는지.

- [ ] **Step 2: 시각 검증 (Martin QA 이연 가능성)**

순수 구조 리팩토링·소비처 diff 0이라 게이트가 회귀 커버. 시뮬레이터 실렌더는 RNGoogleSignin 네이티브 이슈로 막힐 가능성 — 전례대로 Martin 수동 QA 이연.

- [ ] **Step 3: finishing — PR #11 확장 (push/본문 갱신은 Martin 명시 승인 후)**

`superpowers:finishing-a-development-branch`. PR #11이 이미 열려 있으므로 신규 PR 생성 아님 — **커밋은 완료된 상태로 두고**, Martin 승인 시에만:
- `git push`(브랜치에 이어붙은 커밋 반영)
- `gh pr edit 11`로 제목/본문에 리졸버 바인딩 재설계 커밋 추가 반영.

**push는 절대 임의로 하지 않는다.** 승인 전까지 로컬 커밋 상태로 정지.
