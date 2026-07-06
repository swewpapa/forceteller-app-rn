# TextField 컴포넌트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma 기반 코어 TextField(controlled 입력 + default/focused/error/disabled 상태 + placeholder + clearable + leading/trailing 슬롯)를 순수 리졸버 + 얇은 컴포넌트로 구현한다.

**Architecture:** 순수 함수 `buildTextFieldStyle(state, colors)`가 상태(error/focused/disabled)→컨테이너 스타일·입력색·placeholder색으로 해석(TDD). 컴포넌트는 `View`(컨테이너) > `TextInput` + 슬롯 + 클리어(FontAwesomeIcon `faCircleXmark`), 포커스는 내부 useState로 추적, controlled(value/onChangeText).

**Tech Stack:** RN 0.85 / TypeScript / jest / @fortawesome/react-native-fontawesome(기설치, tab-bar 사용 중)

**스펙:** `docs/superpowers/specs/2026-07-06-text-field-design.md`
**규약:** `docs/design-system/component-prop-conventions.md`

**제약:**
- 브랜치: main 최신·**클린 상태**에서 `feature/text-field` 분기. (main에 home-screen WIP 등 커밋 안 된 변경이 있으면 **먼저 별도로 처리** — 이 플랜 범위 밖. Task 0에서 클린 확인.)
- `git push`/PR은 Martin 명시 요청 시에만. `git add`는 pathspec 명시(untracked OTA 문서 2건 쓸어담기 금지).
- 테스트 기준선: main `npm test` **105 passed**(Button 머지 반영). 각 커밋 감소 금지.

**플랜 작성 시 검증된 사실(재확인 불필요):** `faCircleXmark`는 `@fortawesome/pro-solid-svg-icons/faCircleXmark.js`에 존재 · `body-lg`는 `typographyStyles`에 존재 · `typographyStyles`는 `typography` 배럴에 노출됨(Button 때) · mode-colors에 `background.surface/inset`, `text.default/subtle/muted`, `stroke.default/alert`, `primary.primary` 존재 · spacing 숫자 인덱싱(`spacing[600]`=48 등)은 button-style.ts에서 이미 통과.

---

## File Structure

| 경로 | 작업 | 책임 |
|---|---|---|
| `src/shared/components/text-field/text-field-style.ts` | Create | 타입 + `buildTextFieldStyle` 순수 리졸버 |
| `src/shared/components/text-field/__tests__/text-field-style.test.ts` | Create | 리졸버 유닛테스트 7건 |
| `src/shared/components/text-field/text-field.tsx` | Create | 컴포넌트(포커스 추적/클리어/슬롯) |
| `src/shared/components/text-field/index.ts` | Create | barrel |
| `src/shared/components/index.ts` | Modify | `TextField` + prop 타입 export 추가 |

---

### Task 0: 브랜치 + 문서 커밋

- [ ] **Step 0-1: main 최신·클린 확인**

```bash
git checkout main && git pull --ff-only
git status --short
npm test
```
Expected: `git status`에 tracked 변경 없음(untracked OTA 문서 2건만 허용). tracked 변경(예: home-screen.tsx)이 있으면 **중단하고 보고** — 이 플랜 범위 밖 WIP. `npm test` → `105 passed`(다르면 실제 수를 기준선으로 기록).

- [ ] **Step 0-2: 브랜치 생성 + 문서 커밋**

`git status`로 스펙/플랜 문서가 untracked임을 확인 후 정확히 2개만 스테이징:

```bash
git checkout -b feature/text-field
git add docs/superpowers/specs/2026-07-06-text-field-design.md docs/superpowers/plans/2026-07-06-text-field.md
git commit -m "docs: add TextField component spec and plan"
```

---

### Task 1 (Unit A · 커밋 ②): `buildTextFieldStyle` 리졸버 (TDD)

**Files:**
- Create: `src/shared/components/text-field/text-field-style.ts`
- Test: `src/shared/components/text-field/__tests__/text-field-style.test.ts`

- [ ] **Step 1-1: 실패 테스트 작성**

`src/shared/components/text-field/__tests__/text-field-style.test.ts` 생성:

```ts
import type { ModeColors } from '@/shared/theme';
import { buildTextFieldStyle } from '../text-field-style';

// 리졸버는 background/text/stroke/primary 그룹만 조회하므로 최소 fixture로 충분하다.
const colors = {
  background: { surface: '#ffffff', inset: '#f4f4f4' },
  text: { default: '#191919', subtle: '#686868', muted: '#adadad' },
  stroke: { default: '#cccccc', alert: '#ed7e7e' },
  primary: { primary: '#191919' },
} as ModeColors;

const base = { error: false, focused: false, disabled: false };

describe('buildTextFieldStyle — 상태별 색', () => {
  it('default: border stroke.default, input text.default, placeholder text.muted, bg surface', () => {
    const r = buildTextFieldStyle({ ...base }, colors);
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.inputColor).toBe('#191919');
    expect(r.placeholderColor).toBe('#adadad');
    expect(r.container.backgroundColor).toBe('#ffffff');
  });

  it('focused: border primary.primary', () => {
    expect(buildTextFieldStyle({ ...base, focused: true }, colors).container.borderColor).toBe('#191919');
  });

  it('error: border stroke.alert', () => {
    expect(buildTextFieldStyle({ ...base, error: true }, colors).container.borderColor).toBe('#ed7e7e');
  });

  it('error가 focused보다 우선: 에러+포커스 → alert', () => {
    expect(
      buildTextFieldStyle({ ...base, error: true, focused: true }, colors).container.borderColor,
    ).toBe('#ed7e7e');
  });

  it('disabled: bg inset, border stroke.default, input text.muted', () => {
    const r = buildTextFieldStyle({ ...base, disabled: true }, colors);
    expect(r.container.backgroundColor).toBe('#f4f4f4');
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.inputColor).toBe('#adadad');
  });

  it('disabled가 error보다 우선: disabled+error → border default, bg inset', () => {
    const r = buildTextFieldStyle({ ...base, disabled: true, error: true }, colors);
    expect(r.container.borderColor).toBe('#cccccc');
    expect(r.container.backgroundColor).toBe('#f4f4f4');
  });
});

describe('buildTextFieldStyle — 공통 컨테이너', () => {
  it('height 48, px 16, radius 8, borderWidth 1, row + center + gap 8', () => {
    const c = buildTextFieldStyle({ ...base }, colors).container;
    expect(c.height).toBe(48);
    expect(c.paddingHorizontal).toBe(16);
    expect(c.borderRadius).toBe(8);
    expect(c.borderWidth).toBe(1);
    expect(c.flexDirection).toBe('row');
    expect(c.alignItems).toBe('center');
    expect(c.gap).toBe(8);
  });
});
```

- [ ] **Step 1-2: RED 확인**

Run: `npm test -- text-field-style`
Expected: FAIL — `Cannot find module '../text-field-style'`

- [ ] **Step 1-3: 리졸버 구현**

`src/shared/components/text-field/text-field-style.ts` 생성:

```ts
import type { ViewStyle } from 'react-native';
import { radius, spacing, type ModeColors } from '@/shared/theme';

export type TextFieldStyleState = {
  error: boolean;
  focused: boolean;
  disabled: boolean;
};

export type TextFieldStyle = {
  container: ViewStyle;
  inputColor: string;
  placeholderColor: string;
};

/** 상태(error/focused/disabled) → 컨테이너 스타일 + 입력색 + placeholder색. 우선순위 disabled > error > focused > default. */
export function buildTextFieldStyle(state: TextFieldStyleState, colors: ModeColors): TextFieldStyle {
  const { error, focused, disabled } = state;

  const borderColor = error
    ? colors.stroke.alert
    : focused
      ? colors.primary.primary
      : colors.stroke.default;

  const container: ViewStyle = {
    height: spacing[600], // 48
    paddingHorizontal: spacing[200], // 16
    borderRadius: radius.md, // 8
    borderWidth: 1,
    // disabled는 error/focused 테두리보다 우선(회색으로 고정)
    borderColor: disabled ? colors.stroke.default : borderColor,
    backgroundColor: disabled ? colors.background.inset : colors.background.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[100], // 8
  };

  return {
    container,
    inputColor: disabled ? colors.text.muted : colors.text.default,
    placeholderColor: colors.text.muted,
  };
}
```

- [ ] **Step 1-4: GREEN + typecheck/lint**

```bash
npm test -- text-field-style   # Expected: 7 passed
npm test                       # Expected: 112 passed (105 + 7)
npx tsc --noEmit               # exit 0
npm run lint                   # 에러 0
```

- [ ] **Step 1-5: 커밋 ②**

```bash
git add src/shared/components/text-field/text-field-style.ts src/shared/components/text-field/__tests__/text-field-style.test.ts
git commit -m "feat(components): add TextField style resolver"
```

---

### Task 2 (Unit B · 커밋 ③): TextField 컴포넌트 + barrel

**Files:**
- Create: `src/shared/components/text-field/text-field.tsx`, `src/shared/components/text-field/index.ts`
- Modify: `src/shared/components/index.ts`

컴포넌트 로직은 얇음(스타일은 리졸버) — 유닛테스트 미추가, tsc/lint + Task 3 시각 검증.

- [ ] **Step 2-1: 먼저 확인**

`src/shared/components/text-field/text-field-style.ts` export 이름(`buildTextFieldStyle`, `TextFieldStyleState`, `TextFieldStyle`) 확인. `../typography` 배럴에 `typographyStyles` 있음 확인. `src/app/navigation/tab-bar.tsx`의 FontAwesome import 패턴(`import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';`, per-icon deep import) 참고.

- [ ] **Step 2-2: TextField 컴포넌트**

`src/shared/components/text-field/text-field.tsx` 생성:

```tsx
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputFocusEventData,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons/faCircleXmark';
import { useAppColors } from '@/shared/theme';
import { typographyStyles } from '../typography';
import { buildTextFieldStyle } from './text-field-style';

export type TextFieldProps = Omit<
  TextInputProps,
  | 'style'
  | 'value'
  | 'onChangeText'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'editable'
  | 'onFocus'
  | 'onBlur'
> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  /** 컨테이너 레이아웃 전용 탈출구(margin/width 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 디자인 시스템 TextField(controlled). 상태(default/focused/error/disabled) + clearable + leading/trailing 슬롯. */
export function TextField({
  value,
  onChangeText,
  placeholder,
  error = false,
  disabled = false,
  clearable = true,
  leading,
  trailing,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const colors = useAppColors();
  const [focused, setFocused] = useState(false);
  const { container, inputColor, placeholderColor } = buildTextFieldStyle(
    { error, focused, disabled },
    colors,
  );
  const showClear = clearable && focused && value.length > 0 && !disabled;

  return (
    <View style={[container, style]}>
      {leading}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        editable={!disabled}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[typographyStyles['body-lg'], { color: inputColor, flex: 1, padding: 0 }]}
        {...rest}
      />
      {trailing}
      {showClear && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="지우기"
          hitSlop={8}
          // onPress가 아닌 onPressIn: 클리어 탭 시 TextInput blur가 먼저 발생해
          // focused=false로 버튼이 언마운트되면 onPress가 안 불리는 RN 레이스를 회피.
          onPressIn={() => onChangeText('')}
        >
          <FontAwesomeIcon icon={faCircleXmark} size={16} color={colors.text.subtle} />
        </Pressable>
      )}
    </View>
  );
}
```

- [ ] **Step 2-3: button barrel**

`src/shared/components/text-field/index.ts` 생성:

```ts
export { TextField, type TextFieldProps } from './text-field';
```

- [ ] **Step 2-4: components 최상위 barrel에 추가**

`src/shared/components/index.ts`의 마지막 export 뒤에 추가(기존 줄은 유지):

```ts
export { TextField, type TextFieldProps } from './text-field';
```

- [ ] **Step 2-5: 검증**

```bash
npx tsc --noEmit   # exit 0
npm run lint       # 에러 0
npm test           # 112 passed (변동 없음)
```

- [ ] **Step 2-6: 커밋 ③**

```bash
git add src/shared/components/text-field/text-field.tsx src/shared/components/text-field/index.ts src/shared/components/index.ts
git commit -m "feat(components): add TextField component"
```

---

### Task 3 (Unit C): 시뮬레이터 시각 검증 (커밋 없음)

소비처가 없으므로 임시 렌더로 확인 후 되돌린다.

- [ ] **Step 3-1: 임시 데모 삽입**

`src/features/home/screens/home-screen.tsx` body 안에 임시로 추가(검증 후 되돌림). 컴포넌트 상단에 `import { useState } from 'react';`와 `import { TextField } from '@/shared/components';`가 필요하면 추가:

```tsx
{/* TEMP: TextField 검증용 — 되돌릴 것 */}
<TextField value={demo} onChangeText={setDemo} placeholder="입력해주세요" />
<TextField value={demo} onChangeText={setDemo} placeholder="입력해주세요" error />
<TextField value="비활성" onChangeText={() => {}} disabled />
```
(컴포넌트 함수 상단에 `const [demo, setDemo] = useState('');` 임시 추가.)

- [ ] **Step 3-2: 앱 기동/리로드 + 확인**

Metro가 이 프로젝트로 떠 있으면 재기동, 아니면 `npm run ios`. 확인 항목:
- 기본: 회색 테두리 + placeholder(회색)
- 포커스 시 테두리 검정 전환
- 입력 시 검정 텍스트 + **클리어(circle-xmark) 표시, 탭하면 값 삭제**(onPressIn 레이스 회피 동작 확인 — 핵심)
- error: 빨간 테두리
- disabled: 회색 배경 + 편집 불가 + 클리어 없음
- `xcrun simctl ui booted appearance dark`로 다크 확인(재기동 필요할 수 있음)

```bash
xcrun simctl io booted screenshot <scratch>/text-field.png
```

- [ ] **Step 3-3: 임시 데모 제거 + 확인**

home-screen.tsx의 임시 코드 되돌리기(`git checkout src/features/home/screens/home-screen.tsx` 또는 수동 제거). `git status`로 home-screen이 변경 없음 확인.

- [ ] **Step 3-4: 보고**

스크린샷 + 결과 보고. 특히 **클리어 탭 동작**을 명시(레이스 회피가 실제로 되는지). 안 되면 `showClear` 조건을 focus 무관(`clearable && value.length>0 && !disabled`)으로 조정 검토.

---

## 완료 기준

- `npm test` **112 passed**(105 + 리졸버 7), `tsc`·`lint` 클린
- TextField가 상태(default/focused/error/disabled)·클리어·슬롯 정상 렌더(시뮬 확인, 특히 클리어 탭)
- 커밋 3개(docs / 리졸버 / 컴포넌트), push 안 한 상태
- home-screen 임시 데모 완전 제거(작업공간 클린)

## 범위 밖 (form 패밀리 로드맵)

Field 래퍼(Label+Helper/Error), SearchField 조립 예시, Checkbox, Chip/ChipGroup, 얇은 Icon 래퍼, 다중 사이즈, multiline, secure 토글.

## Self-Review 결과

- **스펙 커버리지**: controlled(value/onChangeText)·placeholder·error·disabled·clearable·leading/trailing·onFocus/onBlur 래핑·style 탈출구 → Task 2. 상태 색/치수/우선순위(disabled>error>focused) → Task 1 리졸버+테스트. 클리어(faCircleXmark, focus+value+!disabled, onPressIn) → Task 2. 아이콘 기설치 활용. ✅
- **플레이스홀더 스캔**: 전 스텝 실제 코드, TBD 없음. ✅
- **타입 일관성**: `TextFieldStyleState`{error,focused,disabled}·`TextFieldStyle`{container,inputColor,placeholderColor}·`buildTextFieldStyle`가 Task1↔2 일치. 컴포넌트가 리졸버 반환 3필드 그대로 소비. `typographyStyles['body-lg']`·`faCircleXmark` 실재 확인됨. ✅
- **주의(리뷰 포인트)**: 클리어 blur 레이스를 `onPressIn`으로 회피 — Task 3에서 실제 동작 검증 필수. disabled 시각(bg inset)은 Figma 미정의 추론값.
