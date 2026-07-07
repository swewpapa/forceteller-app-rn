# Style Engine + Chip + keyword_cloud Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** 기존 `useTheme`을 전체 토큰 묶음으로 확장하고, 그 위에 토큰 인지 스타일 prop 엔진(`withStyleProps`)을 만들어 아토믹 조합으로 Chip을 구현, keyword_cloud 위젯까지 완성한다.

**Architecture:** ① typography 토큰을 `theme/generated/`로 이전 → ② `useTheme()`이 `{colors,spacing,radius,typography,mode,…}` 반환하도록 확장 → ③ `src/shared/lib/style-engine/`에 순수 리졸버(color/text-color/font)+`composeStyles`+`withStyleProps` 팩토리 → ④ Chip을 엔진 아톰(ChipContainer/ChipTextLabel) 조합+variant 데이터로 구현 → ⑤ keyword_cloud 위젯. 기존 build*Style 컴포넌트와 공존.

**Tech Stack:** RN 0.85 / React 19 / TypeScript / Jest. 신규 의존성 0.

**참조:** 스펙 `docs/superpowers/specs/2026-07-07-style-props-engine-design.md`, 규약 `docs/design-system/component-prop-conventions.md`.

**선행조건 확인됨:** PR #9(theme) main 머지 완료(Martin). Task 0 브랜치는 그 main에서.

**공통 규칙:** 커밋은 각 태스크 끝 1개(플랜 승인으로 위임). **push 금지.** 테스트 `pnpm test`, 타입 `pnpm exec tsc --noEmit`, 린트 `pnpm exec eslint <path> --max-warnings=0`. codegen `node scripts/generate-tokens.js`.

---

## File Structure

```
[수정] scripts/generate-tokens.js              # typography 출력 경로 → theme/generated
[이동] src/shared/components/typography/generated/typography.ts → src/shared/theme/generated/typography.ts
[수정] src/shared/theme/index.ts                # typographyStyles/TypographyVariant 노출
[수정] src/shared/theme/theme-provider.tsx      # ThemeContextValue + value 확장(spacing/radius/typography)
[수정] src/shared/components/typography/typography.tsx  # import 경로 @/shared/theme
[수정] src/shared/components/typography/index.ts        # 재노출 경로 @/shared/theme
[신규] src/shared/lib/style-engine/{resolver.ts, color-path.ts, resolvers/{color,text-color,font}.ts, compose-styles.ts, with-style-props.tsx, index.ts}
[신규]   + __tests__/{color-path,resolvers,compose-styles}.test.ts
[신규] src/shared/components/chip/{chip.tsx, index.ts}
[수정] src/shared/components/index.ts            # Chip export
[신규] src/features/theme/components/keyword-cloud-widget.tsx
[수정] src/features/theme/components/theme-widget.tsx  # keyword_cloud case
[수정] docs/design-system/component-prop-conventions.md  # 아토믹 규칙 §신설
```

---

### Task 0: 브랜치 + 문서 커밋 ①

- [ ] **Step 1: main 최신화 + 브랜치**

```bash
git -C /Users/martin/Workspace/un7qi3inc/forceteller-app-rn checkout main && git pull
git checkout -b feature/style-engine-chip
```

- [ ] **Step 2: 스펙/플랜 커밋** (다른 untracked 문서 제외)

```bash
git add docs/superpowers/specs/2026-07-07-style-props-engine-design.md docs/superpowers/plans/2026-07-07-style-engine-chip.md
git status --short   # 위 2개만 확인
git commit -m "docs(style-engine): 스타일 엔진 + Chip 스펙/플랜

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1: typography 토큰 → theme/ 이전 — 커밋 ②

동작 불변 리팩터. typography codegen 출력을 theme/generated로 옮기고 소비처를 배럴 재노출로 흡수.

**Files:** `scripts/generate-tokens.js`, `src/shared/theme/generated/typography.ts`(이동), `src/shared/theme/index.ts`, `src/shared/components/typography/typography.tsx`, `src/shared/components/typography/index.ts`

- [ ] **Step 1: codegen 출력 경로 변경** — `scripts/generate-tokens.js`에서 typography를 theme으로:
  - 주석(라인 11-13)의 "한 컴포넌트만 쓰는 생성물(typography)은 그 컴포넌트 폴더" 설명을 "typography도 통합 theme 번들의 일부라 theme/generated에"로 갱신.
  - `TYPOGRAPHY_OUT_DIR` 상수와 그 `fs.mkdirSync(TYPOGRAPHY_OUT_DIR, …)`(라인 41) 제거.
  - `typographyTs: path.join(TYPOGRAPHY_OUT_DIR, 'typography.ts')` → `typographyTs: path.join(THEME_OUT_DIR, 'typography.ts')`.

- [ ] **Step 2: 생성 파일 이동 + 재생성 확인**

```bash
git mv src/shared/components/typography/generated/typography.ts src/shared/theme/generated/typography.ts
node scripts/generate-tokens.js
git status --short   # theme/generated/typography.ts 변경 없음(내용 동일), 새 파일 생성 없음이어야 함
rmdir src/shared/components/typography/generated 2>/dev/null || true  # 빈 디렉터리 정리
```
Expected: 재생성이 `theme/generated/typography.ts`에 동일 내용을 씀(git diff 최소), `components/typography/generated/`는 빈 디렉터리로 남았다가 삭제.

- [ ] **Step 3: theme 배럴에 노출** — `src/shared/theme/index.ts` 끝에 추가:

```ts
export { typographyStyles, type TypographyVariant } from './generated/typography';
```

- [ ] **Step 4: Typography 컴포넌트 import 갱신** — `src/shared/components/typography/typography.tsx:5`:

```ts
import { typographyStyles, type TypographyVariant } from '@/shared/theme';
```
(기존 `import { useAppColors } from '../theme'` 등은 그대로. `../theme`는 `@/shared/theme`와 동일 경로 — 혼용 피하려면 이 파일 내 theme import를 `@/shared/theme` 한 줄로 합쳐도 됨.)

- [ ] **Step 5: typography 배럴 재노출 경로 갱신** — `src/shared/components/typography/index.ts`:

```ts
export { Typography, type TypographyProps } from './typography';
export { typographyStyles, type TypographyVariant } from '@/shared/theme';
```
이로써 `../typography` 배럴로 import하는 기존 소비처(Button/ListItem/TextField)는 무변경으로 동작.

- [ ] **Step 6: 검증** — Run `pnpm exec tsc --noEmit && pnpm exec eslint . --max-warnings=0 && pnpm test`
Expected: 0 errors, clean, 전체 PASS(기존 테스트 그대로 — 동작 불변).

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "refactor(theme): typography 토큰을 theme/generated로 이전 (통합 토큰 소유)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: useTheme 전체 토큰 묶음으로 확장 — 커밋 ③

**Files:** `src/shared/theme/theme-provider.tsx`

- [ ] **Step 1: ThemeContextValue + value 확장** — `theme-provider.tsx`:
  - 상단에 정적 토큰 import 추가:
    ```ts
    import { spacing } from './generated/spacing';
    import { radius } from './generated/radius';
    import { typographyStyles } from './generated/typography';
    ```
  - `ThemeContextValue` 타입에 필드 추가:
    ```ts
    export type ThemeContextValue = {
      colors: ModeColors;
      spacing: typeof spacing;
      radius: typeof radius;
      typography: typeof typographyStyles;
      mode: ThemeMode;
      resolvedTheme: ResolvedTheme;
      setMode: (mode: ThemeMode) => void;
    };
    ```
  - `useMemo`의 value 객체에 추가(정적이라 deps 불변):
    ```ts
    const value = useMemo<ThemeContextValue>(
      () => ({
        colors: resolvedTheme === 'night' ? nightColors : dayColors,
        spacing,
        radius,
        typography: typographyStyles,
        mode,
        resolvedTheme,
        setMode,
      }),
      [mode, resolvedTheme, setMode],
    );
    ```

- [ ] **Step 2: 검증** — Run `pnpm exec tsc --noEmit && pnpm test`
Expected: 0 errors, PASS. `useAppColors`(= `useTheme().colors`)는 그대로 동작(추가 필드는 기존 소비처에 무영향).

- [ ] **Step 3: 커밋**

```bash
git add src/shared/theme
git commit -m "feat(theme): useTheme을 전체 토큰 묶음으로 확장 (colors+spacing+radius+typography)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 엔진 타입 + ColorPath — 커밋 ④

**Files:** `src/shared/lib/style-engine/resolver.ts`, `color-path.ts`, `__tests__/color-path.test.ts`

- [ ] **Step 1: resolver.ts**

```ts
import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';

/** 순수 스타일 리졸버. props=소비 prop 키(forward 금지 대상), resolve=순수함수(theme 받음). */
export type Resolver<P extends object> = {
  props: readonly (keyof P & string)[];
  resolve(values: Partial<P>, theme: ThemeContextValue): ViewStyle | TextStyle;
};
```

**주의:** `ThemeContextValue`가 `@/shared/theme` 배럴에서 export되는지 확인. 없으면 배럴에 `export type { ThemeContextValue } from './theme-provider';` 추가(Task 3에 포함).

- [ ] **Step 2: color-path 실패 테스트** — `__tests__/color-path.test.ts`

```ts
import { resolveColorPath } from '../color-path';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {
  colors: {
    text: { default: '#191919', muted: '#adadad' },
    background: { surface: '#ffffff' },
    stroke: { subtle: '#e8e8e8' },
  },
} as unknown as ThemeContextValue;

describe('resolveColorPath', () => {
  it('그룹.키 경로를 색 문자열로 해석한다', () => {
    expect(resolveColorPath('text.default', theme)).toBe('#191919');
    expect(resolveColorPath('background.surface', theme)).toBe('#ffffff');
    expect(resolveColorPath('stroke.subtle', theme)).toBe('#e8e8e8');
  });
});
```

- [ ] **Step 3: 실패 확인** — Run `pnpm test -- color-path` → FAIL(모듈 없음).

- [ ] **Step 4: color-path.ts 구현**

```ts
import type { ModeColors, ThemeContextValue } from '@/shared/theme';

/** 'text.default' | 'background.surface' | … — ModeColors에서 유도. */
export type ColorPath = {
  [G in keyof ModeColors]: `${G & string}.${keyof ModeColors[G] & string}`;
}[keyof ModeColors];

/** 시맨틱 색 경로 → 색 문자열. cdk palette.get(path) 선례. */
export function resolveColorPath(path: ColorPath, theme: ThemeContextValue): string {
  const [group, key] = path.split('.') as [keyof ModeColors, string];
  return (theme.colors[group] as Record<string, string>)[key];
}
```

**주의:** `ModeColors`가 `@/shared/theme`에서 type export됨(기존). 확인.

- [ ] **Step 5: 통과 + 타입** — Run `pnpm test -- color-path && pnpm exec tsc --noEmit` → PASS, 0 errors.

- [ ] **Step 6: 커밋**

```bash
git add src/shared/lib/style-engine src/shared/theme/index.ts
git commit -m "feat(style-engine): Resolver 타입 + ColorPath 해석 (TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 리졸버 3종 — 커밋 ⑤

**Files:** `resolvers/color.ts`, `resolvers/text-color.ts`, `resolvers/font.ts`, `__tests__/resolvers.test.ts`

- [ ] **Step 1: 실패 테스트** — `__tests__/resolvers.test.ts`

```ts
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
```

- [ ] **Step 2: 실패 확인** — Run `pnpm test -- resolvers` → FAIL.

- [ ] **Step 3: color.ts**

```ts
import type { ViewStyle } from 'react-native';
import { resolveColorPath, type ColorPath } from '../color-path';
import type { Resolver } from '../resolver';

export type ColorProps = { background?: ColorPath; borderColor?: ColorPath };

export const color: Resolver<ColorProps> = {
  props: ['background', 'borderColor'],
  resolve(values, theme): ViewStyle {
    const style: ViewStyle = {};
    if (values.background) style.backgroundColor = resolveColorPath(values.background, theme);
    if (values.borderColor) style.borderColor = resolveColorPath(values.borderColor, theme);
    return style;
  },
};
```

- [ ] **Step 4: text-color.ts**

```ts
import type { TextStyle } from 'react-native';
import { resolveColorPath, type ColorPath } from '../color-path';
import type { Resolver } from '../resolver';

export type TextColorProps = { color?: ColorPath };

export const textColor: Resolver<TextColorProps> = {
  props: ['color'],
  resolve(values, theme): TextStyle {
    return values.color ? { color: resolveColorPath(values.color, theme) } : {};
  },
};
```

- [ ] **Step 5: font.ts**

```ts
import type { TextStyle } from 'react-native';
import type { TypographyVariant } from '@/shared/theme';
import type { Resolver } from '../resolver';

export type FontProps = { font?: TypographyVariant };

/** font=타입스케일 한 묶음(스케일 규율 유지). Text 슬롯 기본. */
export const font: Resolver<FontProps> = {
  props: ['font'],
  resolve(values, theme): TextStyle {
    return values.font ? theme.typography[values.font] : {};
  },
};
```

- [ ] **Step 6: 통과 + 타입** — Run `pnpm test -- resolvers && pnpm exec tsc --noEmit` → PASS, 0 errors.

- [ ] **Step 7: 커밋**

```bash
git add src/shared/lib/style-engine
git commit -m "feat(style-engine): color/text-color/font 리졸버 (TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: composeStyles + withStyleProps — 커밋 ⑥

**Files:** `compose-styles.ts`, `with-style-props.tsx`, `index.ts`, `__tests__/compose-styles.test.ts`

- [ ] **Step 1: 실패 테스트** — `__tests__/compose-styles.test.ts`

```ts
import { composeStyles, collectResolverProps } from '../compose-styles';
import { color } from '../resolvers/color';
import type { ThemeContextValue } from '@/shared/theme';

const theme = {
  colors: { background: { surface: '#fff' }, text: { default: '#191919' } },
} as unknown as ThemeContextValue;

describe('collectResolverProps', () => {
  it('리졸버 소비 prop 합집합', () => {
    expect(collectResolverProps([color])).toEqual(new Set(['background', 'borderColor']));
  });
});

describe('composeStyles', () => {
  it('base → 리졸버 순 병합', () => {
    expect(composeStyles({ background: 'background.surface' }, { height: 32, borderColor: 'transparent' }, [color], theme))
      .toEqual({ height: 32, borderColor: 'transparent', backgroundColor: '#fff' });
  });
  it('리졸버가 base를 덮는다', () => {
    expect(composeStyles({ borderColor: 'text.default' }, { borderColor: 'transparent' }, [color], theme).borderColor)
      .toBe('#191919');
  });
  it('base 없으면 리졸버 결과만', () => {
    expect(composeStyles({ background: 'background.surface' }, undefined, [color], theme)).toEqual({ backgroundColor: '#fff' });
  });
});
```

- [ ] **Step 2: 실패 확인** — Run `pnpm test -- compose-styles` → FAIL.

- [ ] **Step 3: compose-styles.ts**

```ts
import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';
import type { Resolver } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

export function collectResolverProps(resolvers: Resolver<any>[]): Set<string> {
  const set = new Set<string>();
  for (const r of resolvers) for (const p of r.props) set.add(p);
  return set;
}

/** base → 각 리졸버 순 병합(뒤가 앞을 덮음). 순수. style 탈출구/pressed는 팩토리가 별도. */
export function composeStyles(
  props: Record<string, unknown>,
  base: AnyStyle | undefined,
  resolvers: Resolver<any>[],
  theme: ThemeContextValue,
): AnyStyle {
  const style: AnyStyle = { ...(base ?? {}) };
  for (const r of resolvers) {
    const values: Record<string, unknown> = {};
    for (const p of r.props) values[p] = props[p];
    Object.assign(style, r.resolve(values, theme));
  }
  return style;
}
```

- [ ] **Step 4: 통과 확인** — Run `pnpm test -- compose-styles` → PASS.

- [ ] **Step 5: with-style-props.tsx** (TokenProps 명시적 제네릭 — restyle 선례)

```tsx
import type { ComponentType } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';
import { collectResolverProps, composeStyles } from './compose-styles';
import type { Resolver } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

type WithStyleOptions = {
  base?: AnyStyle;
  pressedStyle?: ViewStyle;   // Pressable 계열 전용
  resolvers: Resolver<any>[];
};

/** 베이스 컴포넌트에 토큰 인지 스타일 prop 부여. TokenProps는 명시적 제네릭(리졸버와 일치시킴). */
export function withStyleProps<TokenProps extends object, BaseProps extends { style?: StyleProp<any> }>(
  Component: ComponentType<BaseProps>,
  { base, pressedStyle, resolvers }: WithStyleOptions,
) {
  const consumed = collectResolverProps(resolvers);

  return function StyledComponent(
    props: TokenProps & Omit<BaseProps, 'style'> & { style?: StyleProp<AnyStyle> },
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
  };
}
```

- [ ] **Step 6: index.ts 배럴**

```ts
export type { Resolver } from './resolver';
export { resolveColorPath, type ColorPath } from './color-path';
export { color, type ColorProps } from './resolvers/color';
export { textColor, type TextColorProps } from './resolvers/text-color';
export { font, type FontProps } from './resolvers/font';
export { withStyleProps } from './with-style-props';
```

- [ ] **Step 7: 검증** — Run `pnpm exec tsc --noEmit && pnpm exec eslint src/shared/lib/style-engine --max-warnings=0 && pnpm test -- style-engine` → 0 errors, clean, PASS.

- [ ] **Step 8: 커밋**

```bash
git add src/shared/lib/style-engine
git commit -m "feat(style-engine): composeStyles + withStyleProps 팩토리 + 배럴

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Chip (아톰 조합) — 커밋 ⑦

**Files:** `src/shared/components/chip/chip.tsx`, `chip/index.ts`, `src/shared/components/index.ts`

- [ ] **Step 1: chip.tsx**

```tsx
import { type ComponentProps } from 'react';
import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '@/shared/theme';
import type { TypographyVariant } from '@/shared/theme';
import {
  color,
  font,
  textColor,
  withStyleProps,
  type ColorPath,
  type ColorProps,
  type FontProps,
  type TextColorProps,
} from '@/shared/lib/style-engine';

// ── 아톰(비공개) ─────────────────────────────
const ChipContainer = withStyleProps<ColorProps, PressableProps>(Pressable, {
  base: {
    height: 32,
    paddingHorizontal: 14, // Figma 실측(스케일 밖 — 원시 px). 시각검증 조정 후보
    borderRadius: radius.xl, // pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent', // solid도 1px 투명 보더 → outline과 박스 크기 동일
  },
  pressedStyle: { opacity: 0.85 },
  resolvers: [color],
});

const ChipTextLabel = withStyleProps<FontProps & TextColorProps, ComponentProps<typeof Text>>(Text, {
  resolvers: [font, textColor],
});

// ── variant = 토큰 경로 데이터 ────────────────
type ChipAppearance = 'outline' | 'solid';
type ChipVariant = {
  containerColor?: ColorPath;
  containerBorderColor?: ColorPath;
  textLabelColor: ColorPath;
  textLabelFont: TypographyVariant;
};

const chipVariants = {
  outline: { containerBorderColor: 'text.default', textLabelColor: 'text.default', textLabelFont: 'label-lg' },
  solid: { containerColor: 'text.muted', textLabelColor: 'background.surface', textLabelFont: 'body-lg' },
} as const satisfies Record<ChipAppearance, ChipVariant>;

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

**⚠️ 색 근사(스펙 §4)**: solid bg = `text.muted`(gray300 근사, 무채색 chip 토큰 신설 전 임시). outline = `text.default`.

- [ ] **Step 2: chip/index.ts** — `export { Chip, type ChipProps } from './chip';`

- [ ] **Step 3: shared 배럴** — `src/shared/components/index.ts` 끝에 `export { Chip, type ChipProps } from './chip';`

- [ ] **Step 4: 검증** — Run `pnpm exec tsc --noEmit && pnpm exec eslint src/shared/components/chip --max-warnings=0 && pnpm test`
Expected: 0 errors, clean, PASS. `background={v.containerColor}`에서 `containerColor?`가 undefined일 수 있어(outline) `background?: ColorPath` optional과 정합 — tsc 통과 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/shared/components
git commit -m "feat(components): Chip — 엔진 아톰 조합 첫 컴포넌트 (outline/solid)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: keyword_cloud 위젯 — 커밋 ⑧

**컨텍스트:** `theme-widget.tsx`의 switch가 `case 'keyword_cloud': return null` + `never` 가드. `ThemeWidget` 유니온의 keyword_cloud 멤버 = `{ type:'keyword_cloud'; keywords: ThemeKeyword[] }`, `ThemeKeyword = { text; isMore; link }`. 렌더러 컴포넌트 export명은 `ThemeWidget`(파일 `theme-widget.tsx`), props `{ widget, onPressView, onPressViewAll? }`. keyword 탭은 목적지 화면 부재로 범위 밖 — Chip은 렌더하되 onPress는 옵셔널 핸들러(기본 no-op).

**Files:** `src/features/theme/components/keyword-cloud-widget.tsx`, `src/features/theme/components/theme-widget.tsx`

- [ ] **Step 1: keyword-cloud-widget.tsx**

```tsx
import { Chip, Column, ListHeader, Row } from '@/shared/components';
import type { Theme, ThemeKeyword } from '../types/theme-types';

type KeywordCloudData = Extract<Theme, { type: 'keyword_cloud' }>;

export type KeywordCloudWidgetProps = {
  widget: KeywordCloudData;
  onPressKeyword: (keyword: ThemeKeyword) => void;
};

/** keyword_cloud 위젯: ListHeader + flex-wrap Chip 목록. isMore → solid. */
export function KeywordCloudWidget({ widget, onPressKeyword }: KeywordCloudWidgetProps) {
  return (
    <Column gap="150">
      <ListHeader title={widget.title} subtitle={widget.subtitle ?? undefined} />
      <Row gap="100" style={{ flexWrap: 'wrap' }}>
        {widget.keywords.map((keyword, i) => (
          <Chip
            key={`${keyword.text}-${i}`}
            label={keyword.text}
            appearance={keyword.isMore ? 'solid' : 'outline'}
            onPress={() => onPressKeyword(keyword)}
          />
        ))}
      </Row>
    </Column>
  );
}
```
**주의:** `Row`가 `wrap` named prop을 지원하면 그걸 우선 사용(구현 시 `layout-style.ts` 확인). 미지원이면 위 `style={{ flexWrap:'wrap' }}` 탈출구(항상 동작). `gap="100"`(8px)은 Figma 실측.

- [ ] **Step 2: theme-widget.tsx case 교체** — `import { KeywordCloudWidget } from './keyword-cloud-widget';` + `import type { ThemeKeyword } from '../types/theme-types';` 추가. props 타입에 `onPressKeyword?: (keyword: ThemeKeyword) => void` 추가. `case 'keyword_cloud':`를:

```tsx
    case 'keyword_cloud':
      return (
        <KeywordCloudWidget widget={widget} onPressKeyword={onPressKeyword ?? (() => undefined)} />
      );
```
`ThemeWidgetList`/홈까지 `onPressKeyword` 배선은 불필요(옵셔널+기본 no-op) — tag_filter 목적지 부재로 렌더 확인이 목표.

- [ ] **Step 3: 검증** — Run `pnpm exec tsc --noEmit && pnpm exec eslint src/features/theme --max-warnings=0 && pnpm test` → 0 errors, clean, PASS.

- [ ] **Step 4: 커밋**

```bash
git add src/features/theme
git commit -m "feat(theme): keyword_cloud 위젯 (Chip flex-wrap) — 스위치 case 구현

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: 아토믹 규칙 규약 문서 — 커밋 ⑨

**Files:** `docs/design-system/component-prop-conventions.md`

- [ ] **Step 1: 아토믹 규칙 §신설** — 스펙 §2의 "아토믹 네이밍 규칙" 표 + "variant 속성 어휘" 표를 규약 문서로 옮긴다(스펙=사이클 기록, 규약=상시 SSOT). 내용: 아톰 suffix 4종(Container/TextLabel/LeadingVisual/TrailingVisual), variant 키=슬롯접두사+속성, 속성 어휘(Color/Font/Size/Weight/LineHeight/Tracking), 키→prop 유도(`containerColor`→`background` 특례), 아톰 기본 비공개, 엔진은 `useTheme` 토큰 소비. Chip 예시 1개. 스타일 엔진 위치(`shared/lib/style-engine`)도 한 줄.

- [ ] **Step 2: 커밋**

```bash
git add docs/design-system/component-prop-conventions.md
git commit -m "docs(conventions): 아토믹 컴포넌트 조합 + 스타일 엔진 규칙 명문화

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: 시뮬레이터 시각 검증

dev API에 keyword_cloud 섹션 실존(id 8 "예지 꿈 해몽", id 20 "연예인 궁합"). **RNGoogleSignin 네이티브 바이너리 이슈가 있으면 표시 검증 막힘 → 정직 보고 + Martin 수동 QA 이연(theme 사이클 전례).**

- [ ] **Step 1: 앱 재실행 + 번들 대기**

```bash
xcrun simctl list devices booted
BOOTED=$(xcrun simctl list devices booted | grep -oE "\([0-9A-F-]{36}\)" | head -1 | tr -d "()")
xcrun simctl terminate "$BOOTED" com.un7qi3i.forceteller 2>/dev/null
curl -s -o /dev/null -w "%{http_code}\n" --max-time 180 "http://localhost:8081/index.bundle?platform=ios&dev=true"
xcrun simctl launch "$BOOTED" com.un7qi3i.forceteller
```

- [ ] **Step 2: 홈 스크린샷 + 확인** — `xcrun simctl io "$BOOTED" screenshot /tmp/chip-keyword-cloud.png`
확인: ① keyword_cloud Chip들이 pill flex-wrap ② "더 보기" solid(회색 bg+흰 텍스트), 나머지 outline ③ 다크모드 전환 시 outline 색 추종 ④ redbox면 이연 보고.

- [ ] **Step 3: 조정 커밋(있을 때만)** — px14/색 근사가 Figma와 어긋나면 조정 커밋 1개.

---

## 완료 기준

- [ ] `pnpm test` 전체 PASS (기존 124 + 엔진 신규)
- [ ] `pnpm exec tsc --noEmit` / `pnpm exec eslint . --max-warnings=0` 클린
- [ ] `useTheme()`이 전체 토큰 묶음 반환, typography 토큰이 theme/generated에 위치
- [ ] Chip이 엔진 아톰(ChipContainer/ChipTextLabel) 조합으로 구현(build*Style 없음)
- [ ] keyword_cloud 위젯이 스위치 case로 렌더(never 가드 유지)
- [ ] 커밋 ~9개, 브랜치 `feature/style-engine-chip`, **push 안 함**
- [ ] 시각 검증(또는 네이티브 이슈 시 Martin QA 이연 명시)
