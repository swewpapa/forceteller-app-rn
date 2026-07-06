# Button 컴포넌트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma 디자인 기반 코어 Button(`color`×`appearance`×`size`×`shape`×상태 + leading/trailing 슬롯)을 순수 리졸버 + 얇은 Pressable 컴포넌트로 구현하고 login 화면에 첫 실사용한다.

**Architecture:** 순수 함수 `buildButtonStyle(state, colors)`가 색(on-color)·사이즈·shape를 ViewStyle+textColor+typographyVariant로 해석(TDD). 컴포넌트는 `Pressable` + `useAppColors` + 라벨은 `typographyStyles[variant]`+`<Text>`(on-color가 text 그룹 밖이라 Typography 컴포넌트 대신). pressed/loading/fullWidth는 컴포넌트 런타임 처리.

**Tech Stack:** RN 0.85 / TypeScript / jest(순수 로직 유닛테스트)

**스펙:** `docs/superpowers/specs/2026-07-03-button-component-design.md`
**규약:** `docs/design-system/component-prop-conventions.md`

**제약:**
- 브랜치: main 최신에서 `feature/button-component` 분기. `git push`는 Martin 명시 요청 시에만. PR도 명시 요청 시.
- `git add`는 pathspec 명시(untracked OTA 문서 2건이 있음 — 쓸어담기 금지).
- 테스트 기준선: main `npm test` **91 passed / 15 suites**. 각 커밋에서 감소 금지.

**플랜 작성 시 검증된 사실(재확인 불필요):** main 클린 · 기준선 91 · `typographyStyles`/`TypographyVariant`는 `src/shared/components/typography/generated/typography.ts`에 존재하나 `typography/index.ts` 배럴엔 미노출(Task 1에서 노출).

---

## File Structure

| 경로 | 작업 | 책임 |
|---|---|---|
| `src/shared/components/typography/index.ts` | Modify | `typographyStyles`+`TypographyVariant` 배럴 노출(Button이 소비) |
| `src/shared/components/button/button-style.ts` | Create | 타입 + `buildButtonStyle` 순수 리졸버(색/사이즈/shape 매핑 전담) |
| `src/shared/components/button/__tests__/button-style.test.ts` | Create | 리졸버 유닛테스트 14건 |
| `src/shared/components/button/button.tsx` | Create | Button 컴포넌트(Pressable + pressed/loading/fullWidth) |
| `src/shared/components/button/index.ts` | Create | barrel |
| `src/shared/components/index.ts` | Modify | `Button` + prop 타입 export 추가 |
| `src/features/auth/screens/login-screen.tsx` | Modify | Google 버튼을 Button으로 교체(첫 실사용) |

---

### Task 0: 브랜치 + 문서 커밋

- [ ] **Step 0-1: main 최신화 + 기준선 확인**

```bash
git checkout main && git pull --ff-only
npm test
```
Expected: `Tests: 91 passed`. (다르면 실제 수를 기준선으로 기록하고 계속 — 이후 감소만 금지.)

- [ ] **Step 0-2: 브랜치 생성 + 문서 커밋**

`git status`로 아래 3개 문서가 untracked임을 확인 후, **정확히 그 3개만** 스테이징(OTA 문서 2건 제외):

```bash
git checkout -b feature/button-component
git add docs/superpowers/specs/2026-07-03-button-component-design.md docs/design-system/component-prop-conventions.md docs/superpowers/plans/2026-07-03-button-component.md
git commit -m "docs: add Button component spec, prop conventions, and plan"
```

---

### Task 1 (Unit A · 커밋 ①): typography 배럴 노출 + `buildButtonStyle` 리졸버 (TDD)

**Files:**
- Modify: `src/shared/components/typography/index.ts`
- Create: `src/shared/components/button/button-style.ts`
- Test: `src/shared/components/button/__tests__/button-style.test.ts`

- [ ] **Step 1-1: typography 배럴에 typographyStyles/TypographyVariant 노출**

`src/shared/components/typography/index.ts` 전체를 다음으로 교체:

```ts
// src/shared/components/typography/index.ts
export { Typography, type TypographyProps } from './typography';
export { typographyStyles, type TypographyVariant } from './generated/typography';
```

- [ ] **Step 1-2: 실패하는 리졸버 테스트 작성**

`src/shared/components/button/__tests__/button-style.test.ts` 생성:

```ts
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
```

- [ ] **Step 1-3: RED 확인**

Run: `npm test -- button-style`
Expected: FAIL — `Cannot find module '../button-style'`

- [ ] **Step 1-4: 리졸버 구현**

`src/shared/components/button/button-style.ts` 생성:

```ts
import type { ViewStyle } from 'react-native';
import { radius, spacing, type ModeColors } from '@/shared/theme';
import type { TypographyVariant } from '../typography';

export type ButtonColor = 'primary' | 'secondary';
export type ButtonAppearance = 'solid' | 'outline';
export type ButtonSize = 'lg' | 'md' | 'sm';
export type ButtonShape = 'rounded' | 'pill';

export type ButtonStyleState = {
  color: ButtonColor;
  appearance: ButtonAppearance;
  size: ButtonSize;
  shape: ButtonShape;
  disabled: boolean;
};

export type ButtonStyle = {
  container: ViewStyle;
  textColor: string;
  typography: TypographyVariant;
};

const GAP = spacing[100]; // 8

// 사이즈 메트릭(Figma). md는 체계적 Figma 소스 없이 보간(h40/label-md/px16) — 스펙 참고.
const SIZE: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; typography: TypographyVariant }
> = {
  lg: { height: spacing[700], paddingHorizontal: spacing[200], typography: 'label-lg' }, // 56 / 16
  md: { height: spacing[500], paddingHorizontal: spacing[200], typography: 'label-md' }, // 40 / 16
  sm: { height: spacing[400], paddingHorizontal: spacing[150], typography: 'label-md' }, // 32 / 12
};

// color 그룹의 on-color 짝을 명시적으로 추출(키에 색 이름이 박혀 있어 동적 접근 대신 분기).
function colorSet(color: ButtonColor, colors: ModeColors) {
  if (color === 'primary') {
    const g = colors.primary;
    return { main: g.primary, on: g.onPrimary, mainDisabled: g.primaryDisabled, onDisabled: g.onPrimaryDisabled };
  }
  const g = colors.secondary;
  return { main: g.secondary, on: g.onSecondary, mainDisabled: g.secondaryDisabled, onDisabled: g.onSecondaryDisabled };
}

/** 정적 상태(색/사이즈/shape) → 컨테이너 스타일 + 라벨 색 + 타이포. pressed/loading/fullWidth는 컴포넌트에서. */
export function buildButtonStyle(state: ButtonStyleState, colors: ModeColors): ButtonStyle {
  const { color, appearance, size, shape, disabled } = state;
  const sz = SIZE[size];
  const cs = colorSet(color, colors);

  const container: ViewStyle = {
    height: sz.height,
    paddingHorizontal: sz.paddingHorizontal,
    borderRadius: shape === 'pill' ? radius.xl : radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
  };

  let textColor: string;
  if (appearance === 'solid') {
    container.backgroundColor = disabled ? cs.mainDisabled : cs.main;
    textColor = disabled ? cs.onDisabled : cs.on;
  } else {
    // outline: color-aware, 배경 항상 투명
    container.backgroundColor = 'transparent';
    container.borderWidth = 1;
    container.borderColor = disabled ? cs.mainDisabled : cs.main;
    textColor = disabled ? cs.mainDisabled : cs.main;
  }

  return { container, textColor, typography: sz.typography };
}
```

- [ ] **Step 1-5: GREEN + typecheck/lint**

```bash
npm test -- button-style   # Expected: 14 passed
npm test                   # Expected: 105 passed (91 + 14)
npx tsc --noEmit           # exit 0
npm run lint               # 에러 0
```

- [ ] **Step 1-6: 커밋 ①**

```bash
git add src/shared/components/typography/index.ts src/shared/components/button/button-style.ts src/shared/components/button/__tests__/button-style.test.ts
git commit -m "feat(components): add Button style resolver + expose typographyStyles"
```

---

### Task 2 (Unit B · 커밋 ②): Button 컴포넌트 + barrel

**Files:**
- Create: `src/shared/components/button/button.tsx`, `src/shared/components/button/index.ts`
- Modify: `src/shared/components/index.ts`

컴포넌트 로직은 얇음(리졸버가 스타일 담당) — 유닛테스트 미추가, tsc/lint + Task 4 시각 검증.

- [ ] **Step 2-1: Button 컴포넌트**

`src/shared/components/button/button.tsx` 생성:

```tsx
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppColors } from '@/shared/theme';
import { typographyStyles } from '../typography';
import {
  buildButtonStyle,
  type ButtonAppearance,
  type ButtonColor,
  type ButtonShape,
  type ButtonSize,
} from './button-style';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  onPress: () => void;
  color?: ButtonColor;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  shape?: ButtonShape;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 레이아웃 전용 탈출구(margin/position 등). 병합 마지막이라 여기 값이 우선. 색·사이즈 등 시각 정체성은 named prop으로. */
  style?: StyleProp<ViewStyle>;
};

/** 디자인 시스템 Button. color=on-color(solid는 bg+파생 글자, outline은 테두리+글자), leading/trailing 슬롯. */
export function Button({
  label,
  onPress,
  color = 'primary',
  appearance = 'solid',
  size = 'lg',
  shape = 'rounded',
  disabled = false,
  loading = false,
  fullWidth = false,
  leading,
  trailing,
  style,
  ...rest
}: ButtonProps) {
  const colors = useAppColors();
  const { container, textColor, typography } = buildButtonStyle(
    { color, appearance, size, shape, disabled },
    colors,
  );
  const blocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        container,
        { alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        pressed && !blocked && { opacity: 0.85 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {leading}
          <Text style={[typographyStyles[typography], { color: textColor }]}>{label}</Text>
          {trailing}
        </>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 2-2: button barrel**

`src/shared/components/button/index.ts` 생성:

```ts
export { Button, type ButtonProps } from './button';
export type {
  ButtonAppearance,
  ButtonColor,
  ButtonShape,
  ButtonSize,
} from './button-style';
```

- [ ] **Step 2-3: components 최상위 barrel에 추가**

`src/shared/components/index.ts` 전체를 다음으로 교체:

```ts
export { ScreenContainer } from './screen-container';
export { PlaceholderScreen } from './placeholder-screen';
export { Typography, type TypographyProps } from './typography';
export { Box, Row, Column, type BoxProps, type RowProps, type ColumnProps } from './layout';
export {
  Button,
  type ButtonProps,
  type ButtonAppearance,
  type ButtonColor,
  type ButtonShape,
  type ButtonSize,
} from './button';
```

- [ ] **Step 2-4: 검증**

```bash
npx tsc --noEmit   # exit 0
npm run lint       # 에러 0
npm test           # 105 passed (변동 없음)
```

- [ ] **Step 2-5: 커밋 ②**

```bash
git add src/shared/components/button/button.tsx src/shared/components/button/index.ts src/shared/components/index.ts
git commit -m "feat(components): add Button component"
```

---

### Task 3 (Unit C · 커밋 ③): login Google 버튼 첫 실사용

**Files:**
- Modify: `src/features/auth/screens/login-screen.tsx`

**주의(예상 시각 변화)**: 기존 outline 버튼(테두리 `stroke.subtle` 연회색, 라벨 15px/500) → Button `appearance="outline" color="primary"`(테두리 `primary.primary` 검정, 라벨 label-lg 16px/500, 높이 56 고정). 색-aware outline 결정의 결과. Martin 검수 항목.

- [ ] **Step 3-1: 현재 파일 확인**

`src/features/auth/screens/login-screen.tsx`를 Read. body는 `<Column padding="300" gap="300" justify="center">`, 그 안에 `<Text style={[styles.title...]}>로그인</Text>`와 Google `<Pressable ...>`. styles에 `body`/`title`/`btn`/`btnText`. import에 `ActivityIndicator, Pressable, StyleSheet, Text` (RN), `Column, ScreenContainer`, `radius, spacing, useAppColors`.

- [ ] **Step 3-2: import 교체**

```tsx
// Before
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Column, ScreenContainer } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';
// After
import { StyleSheet, Text } from 'react-native';
import { Button, Column, ScreenContainer } from '@/shared/components';
import { useAppColors } from '@/shared/theme';
```
(Pressable·ActivityIndicator 제거 — Button 내부로 이동. radius·spacing은 btn 스타일 삭제로 미사용 → 제거. useAppColors·Text·StyleSheet는 title에서 계속 사용.)

- [ ] **Step 3-3: Google 버튼 JSX 교체**

```tsx
// Before
<Pressable accessibilityRole="button" onPress={onGoogle} disabled={loading} style={[styles.btn, { borderColor: colors.stroke.subtle }]}>
  {loading ? <ActivityIndicator color={colors.text.default} /> : <Text style={[styles.btnText, { color: colors.text.default }]}>Google로 계속하기</Text>}
</Pressable>
// After
<Button
  appearance="outline"
  size="lg"
  fullWidth
  loading={loading}
  label="Google로 계속하기"
  onPress={onGoogle}
/>
```

- [ ] **Step 3-4: 미사용 스타일 제거**

`styles`에서 `btn`, `btnText` 삭제. `body`(`{ flex: 1 }`)와 `title`은 유지.

```ts
const styles = StyleSheet.create({
  body: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
});
```

- [ ] **Step 3-5: 검증**

```bash
npx tsc --noEmit   # exit 0 (onGoogle: () => Promise<void>는 onPress: () => void에 대입 가능)
npm run lint       # 에러 0 (미사용 import/스타일 없어야 함)
npm test           # 105 passed
```

- [ ] **Step 3-6: 커밋 ③**

```bash
git add src/features/auth/screens/login-screen.tsx
git commit -m "refactor(auth): use Button for login Google action"
```

---

### Task 4 (Unit D): 시뮬레이터 시각 검증 (커밋 없음)

- [ ] **Step 4-1: 앱 기동/리로드**

Metro가 이 프로젝트로 떠 있으면 dev 앱 재기동으로 최신 JS 로드(순수 JS 변경이라 네이티브 재빌드 불필요):
```bash
xcrun simctl terminate booted com.un7qi3.forceteller
xcrun simctl launch booted com.un7qi3.forceteller
```
(Metro 미기동이면 `npm run ios`.)

- [ ] **Step 4-2: login 화면 확인 (light/dark)**

홈 → 로그인 진입. 확인:
- Google 버튼이 outline(검정 테두리)·전폭·label-lg로 렌더
- 탭 시 pressed opacity 피드백
- 버튼 탭하면 loading 시 스피너로 대체(실제 로그인 실패해도 스피너 표시 확인)
- `xcrun simctl ui booted appearance dark` 후 재기동 → 다크에서 테두리/글자색 정상(테마 반응)

```bash
xcrun simctl io booted screenshot <scratch>/button-login-light.png
```

- [ ] **Step 4-3: (선택) variant 매트릭스 스팟체크**

필요 시 home-screen에 임시로 `<Button color="secondary">`·solid/outline·sm/md/lg 몇 개를 넣어 스크린샷 후 **되돌린다(커밋 금지)**. 리졸버가 매트릭스를 유닛테스트로 커버하므로 필수는 아님.

- [ ] **Step 4-4: 보고**

스크린샷 + 결과를 Martin에게 보고. 이상 시 수정 후 별도 커밋. appearance는 light로 원복.

---

## 완료 기준

- `npm test` **105 passed**(91 + 리졸버 14), `tsc --noEmit`·`lint` 클린
- login Google 버튼이 Button으로 동작(outline/loading/fullWidth), day/night 정상
- 커밋 4개(docs / 리졸버+배럴 / 컴포넌트 / login) — push 안 한 상태

## 범위 밖 (스펙 로드맵)

가격/할인 구매 버튼, accent(오행) 색군, 색 있는 outline 확장, 아이콘 시스템/Icon 컴포넌트, home 버튼 마이그레이션, Card, Figma Code Connect 매핑, layout-style 분리.

## Self-Review 결과

- **스펙 커버리지**: color(on-color)/appearance/size/shape/상태/슬롯/label/fullWidth/pressed/loading 전부 Task 1·2에 매핑. outline color-aware(Task 1 test 5~8). typography 배럴 노출(Task 1-1). 첫 실사용(Task 3). 시각 검증(Task 4). ✅
- **플레이스홀더 스캔**: 모든 코드 스텝에 실제 코드 포함, TBD 없음. ✅
- **타입 일관성**: `ButtonColor/Appearance/Size/Shape`·`ButtonStyleState`·`ButtonStyle`·`buildButtonStyle`·`typographyStyles`·`TypographyVariant` 이름이 Task 1↔2에서 일치. 리졸버 반환 `{container,textColor,typography}`를 컴포넌트가 그대로 소비. ✅
