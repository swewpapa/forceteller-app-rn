# 폼 Foundation (RHF+zod+Field/FormTextField) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** react-hook-form+zod를 도입하고 순수 `Field`(라벨+에러 표시)와 `FormTextField`(useController 어댑터)를 구현, 데모 폼으로 end-to-end 검증한다.

**Architecture:** 2계층 — `Field`는 RHF를 모르는 순수 DS(Typography+Column 조립), `FormTextField`는 RHF 공식 `useController`로 TextField를 폼에 배선하는 어댑터(`form/` 폴더에 결합 격리). zod 스키마는 `zodResolver`로 useForm에 연결, 에러는 `fieldState.error.message`→Field로 흐른다.

**Tech Stack:** RN 0.85 / TypeScript / **pnpm**(node-linker=hoisted) / react-hook-form 7.81 / zod 4.4 / @hookform/resolvers 5.4

**스펙:** `docs/superpowers/specs/2026-07-06-form-foundation-design.md`
**규약:** `docs/design-system/component-prop-conventions.md` (§2 폼 결합 접두사 — 이번에 추가됨)

**제약:**
- **선행 조건: PR #7(feature/text-field)가 main에 머지**되어 있어야 한다(TextField 소비). Task 0에서 게이트.
- 브랜치: main 최신·클린에서 `feature/form-foundation` 분기. `git push`/PR·커밋 외 조작은 명시 요청 시에만. `git add`는 pathspec 명시(untracked OTA 문서 2건 쓸어담기 금지).
- 패키지 설치는 **pnpm** (`pnpm add ...`) — npm/yarn 금지(락파일 pnpm-lock.yaml).
- 테스트 기준선: main(PR #7 머지 후) `npm test` **113 passed**. 각 커밋 감소 금지. **이번 사이클 신규 유닛테스트 없음**(Field/FormTextField 로직 0 — 스펙에 정직 고지됨). 게이트 = tsc/lint/113 유지 + Task 4 데모.

**플랜 작성 시 검증된 사실(재확인 불필요):** 버전 실측 rhf 7.81.0/zod 4.4.3/resolvers 5.4.0(peer rhf ^7.55 충족) · Typography `color="alert"` 유효(text.alert 존재) · `label-md`(14/500)·`label-sm`(12/500) variant 존재 · Column `gap="150"`=12 · repo는 pnpm+hoisted.

---

## File Structure

| 경로 | 작업 | 책임 |
|---|---|---|
| `package.json` + `pnpm-lock.yaml` | Modify | 의존성 3개 추가 |
| `src/shared/components/field/field.tsx` | Create | 순수 Field(라벨+컨트롤+에러 표시, RHF 의존 0) |
| `src/shared/components/field/index.ts` | Create | barrel |
| `src/shared/components/form/form-text-field.tsx` | Create | RHF useController 어댑터 |
| `src/shared/components/form/index.ts` | Create | barrel (향후 form-checkbox 등 추가처) |
| `src/shared/components/index.ts` | Modify | `Field`/`FormTextField` export 추가 (2회, 태스크별 1줄) |

---

### Task 0: 게이트 + 브랜치 + 문서 커밋

- [ ] **Step 0-1: PR #7 머지 확인**

Run: `gh pr view 7 --json state`
Expected: `"state": "MERGED"`. 아니면 **중단하고 보고**.

- [ ] **Step 0-2: main 최신·클린 + 기준선**

```bash
git checkout main && git pull --ff-only
git status --short   # tracked 변경 없어야(단, docs 3건은 이번 커밋 대상: 스펙/플랜 untracked + 규약 modified). OTA 문서 2건 untracked는 무시
npm test             # Expected: 113 passed
```

- [ ] **Step 0-3: 브랜치 + 문서 커밋 (정확히 3개 파일)**

```bash
git checkout -b feature/form-foundation
git add docs/superpowers/specs/2026-07-06-form-foundation-design.md docs/superpowers/plans/2026-07-06-form-foundation.md docs/design-system/component-prop-conventions.md
git commit -m "docs: add form foundation spec/plan, codify Form-prefix naming rule"
```

---

### Task 1 (Unit A · 커밋 ②): 의존성 설치

**Files:** Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1-1: 설치 (pnpm)**

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

- [ ] **Step 1-2: 버전 확인**

Run: `grep -E "react-hook-form|\"zod\"|@hookform/resolvers" package.json`
Expected: `react-hook-form ^7.81.x`, `zod ^4.4.x`, `@hookform/resolvers ^5.4.x` (이상 버전).

- [ ] **Step 1-3: 회귀 게이트**

```bash
npx tsc --noEmit   # exit 0
npm run lint       # 에러 0
npm test           # 113 passed (설치만으로 변동 없어야)
```

- [ ] **Step 1-4: 커밋 ②**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-hook-form, zod, @hookform/resolvers"
```

---

### Task 2 (Unit B · 커밋 ③): 순수 `Field`

**Files:**
- Create: `src/shared/components/field/field.tsx`, `src/shared/components/field/index.ts`
- Modify: `src/shared/components/index.ts`

- [ ] **Step 2-1: Field 컴포넌트**

`src/shared/components/field/field.tsx` 생성:

```tsx
import type { ReactNode } from 'react';
import { Column } from '../layout';
import { Typography } from '../typography';

export type FieldProps = {
  /** 있으면 label-md로 표시 (Figma 106:3419 라벨 14/500 정확 일치) */
  label?: string;
  /**
   * 있으면 label-sm/alert로 표시. 검증 계층(FormTextField 등)이 내려준다 —
   * Field는 검증을 모른다(순수 표시). 없으면 에러 줄 자체를 렌더하지 않는다(공간 미예약).
   */
  error?: string;
  children: ReactNode;
};

/** 폼 필드 해부(라벨+컨트롤+에러메시지)의 순수 표시 래퍼. RHF 의존 0 — 규약 §2 "무접두사 = 순수 DS". */
export function Field({ label, error, children }: FieldProps) {
  return (
    <Column gap="150">
      {label ? <Typography variant="label-md">{label}</Typography> : null}
      {children}
      {error ? (
        <Typography variant="label-sm" color="alert">
          {error}
        </Typography>
      ) : null}
    </Column>
  );
}
```

- [ ] **Step 2-2: barrel 2개**

`src/shared/components/field/index.ts` 생성:
```ts
export { Field, type FieldProps } from './field';
```

`src/shared/components/index.ts` 마지막 export 뒤에 추가(기존 줄 유지):
```ts
export { Field, type FieldProps } from './field';
```

- [ ] **Step 2-3: 검증 + 커밋 ③**

```bash
npx tsc --noEmit   # exit 0
npm run lint       # 에러 0
npm test           # 113 passed
git add src/shared/components/field/field.tsx src/shared/components/field/index.ts src/shared/components/index.ts
git commit -m "feat(components): add Field wrapper (label + error message)"
```

---

### Task 3 (Unit C · 커밋 ④): `FormTextField` 어댑터

**Files:**
- Create: `src/shared/components/form/form-text-field.tsx`, `src/shared/components/form/index.ts`
- Modify: `src/shared/components/index.ts`

- [ ] **Step 3-1: FormTextField**

`src/shared/components/form/form-text-field.tsx` 생성:

```tsx
import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';
import { Field } from '../field';
import { TextField, type TextFieldProps } from '../text-field';

export type FormTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  /** string 값 필드 경로만 허용 — TextField(value: string)와 타입 정합 */
  name: FieldPathByValue<TFieldValues, string>;
  label?: string;
} & Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

/**
 * RHF 공식 useController로 TextField를 폼에 배선하는 어댑터.
 * RHF 결합은 form/ 계층에만 격리(규약 §2 "Form 접두사 = RHF 결합") —
 * value/onChangeText/onBlur/error는 폼이 소유하므로 Omit(규약 §5).
 */
export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  ...rest
}: FormTextFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Field label={label} error={fieldState.error?.message}>
      <TextField
        value={field.value ?? ''}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        error={!!fieldState.error}
        {...rest}
      />
    </Field>
  );
}
```

**타입 폴백(tsc 실패 시에만)**: `FieldPathByValue<TFieldValues, string>`가 useController의 name과 안 맞으면 `name: FieldPath<TFieldValues>`로 완화하고 `value={String(field.value ?? '')}`로 조정, 무엇을 왜 바꿨는지 보고.

- [ ] **Step 3-2: barrel 2개**

`src/shared/components/form/index.ts` 생성:
```ts
export { FormTextField, type FormTextFieldProps } from './form-text-field';
```

`src/shared/components/index.ts` 마지막 export 뒤에 추가:
```ts
export { FormTextField, type FormTextFieldProps } from './form';
```

- [ ] **Step 3-3: 검증 + 커밋 ④**

```bash
npx tsc --noEmit   # exit 0 — FieldPathByValue/제네릭 성립 실증
npm run lint       # 에러 0
npm test           # 113 passed
git add src/shared/components/form/form-text-field.tsx src/shared/components/form/index.ts src/shared/components/index.ts
git commit -m "feat(components): add FormTextField adapter (react-hook-form useController)"
```

---

### Task 4 (Unit D): 데모 end-to-end 검증 (커밋 없음)

zod 검증→에러메시지→해소→제출의 전체 흐름을 시뮬레이터로 실증. TextField Unit C와 동일한 TEMP 삽입→검증→되돌림.

- [ ] **Step 4-1: TEMP 데모 삽입**

`src/features/home/screens/home-screen.tsx`에 임시 추가:

임포트(파일 상단):
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
```
기존 `@/shared/components` import에 `Button, FormTextField` 추가.

모듈 레벨(컴포넌트 밖):
```tsx
// TEMP: 폼 foundation 검증용 스키마 — 되돌릴 것
const demoSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  email: z.email('이메일 형식이 올바르지 않습니다'), // zod v4 관용구
});
type DemoValues = z.infer<typeof demoSchema>;
```

컴포넌트 함수 상단:
```tsx
const { control, handleSubmit } = useForm<DemoValues>({
  resolver: zodResolver(demoSchema),
  defaultValues: { name: '', email: '' },
  mode: 'onChange', // 데모에서 즉시 에러 확인용
});
```

body Column 안(타이틀 아래):
```tsx
{/* TEMP: 폼 foundation 검증 — 되돌릴 것 */}
<FormTextField control={control} name="name" label="이름" placeholder="입력해주세요" />
<FormTextField
  control={control}
  name="email"
  label="이메일"
  placeholder="you@example.com"
  keyboardType="email-address"
  autoCapitalize="none"
/>
<Button label="제출" onPress={handleSubmit((d) => console.log('[demo] submit:', d))} />
```

**zodResolver 폴백(tsc/런타임 실패 시에만)**: `import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';`로 교체(zod 4는 Standard Schema 지원). 사용 시 보고.

- [ ] **Step 4-2: 시뮬 검증 (light/dark)**

Metro가 이 프로젝트로 떠 있으면 앱 재기동(`xcrun simctl terminate/launch booted com.un7qi3.forceteller`), 아니면 `npm run ios`. 확인:
1. 초기: 라벨 2개 + 필드 2개 + 제출 버튼, 에러 없음
2. 이름에 1자 입력 → 필드 아래 "이름은 2자 이상 입력해주세요"(빨강) + 필드 빨간 테두리
3. 이메일에 `abc` 입력 → "이메일 형식이 올바르지 않습니다"
4. 정상 값 입력 → 에러 해소(에러 줄 사라짐, 테두리 원복)
5. 제출 탭 → Metro 콘솔에 `[demo] submit: {name, email}` 로그
6. `xcrun simctl ui booted appearance dark` 후 재기동 → 다크에서 라벨/에러색 정상

```bash
xcrun simctl io booted screenshot <scratch>/form-demo-error.png   # 에러 상태
xcrun simctl io booted screenshot <scratch>/form-demo-dark.png    # 다크
```

- [ ] **Step 4-3: 되돌림 + 클린 확인**

```bash
git checkout -- src/features/home/screens/home-screen.tsx
git status --short   # tracked 변경 없어야
xcrun simctl ui booted appearance light
```

- [ ] **Step 4-4: 보고**

스크린샷 + 6개 확인 항목 결과. 특히 에러 노출→해소 흐름과 다크 모드.

---

## 완료 기준

- `npm test` **113 passed**(변동 없음 — 신규 테스트 없음은 스펙 고지 사항), `tsc`·`lint` 클린
- 데모 6항목 검증(zod 에러 노출/해소/제출, light/dark), TEMP 완전 되돌림
- 커밋 4개(docs / 의존성 / Field / FormTextField), push 안 한 상태

## 범위 밖 (스펙 로드맵)

실제 폼 화면, Checkbox·Chip/ChipGroup + FormCheckbox, helperText, 폼 mode 표준, setError(서버 에러), 다국어 에러 체계, 폰트 번들링.

## Self-Review 결과

- **스펙 커버리지**: 설치(버전/pnpm) → Task 1, Field(토큰 매핑·공간 미예약) → Task 2, FormTextField(useController·FieldPathByValue·Omit·?? '') → Task 3, 데모(스키마·mode·확인 항목) → Task 4, 네이밍 규칙 → Task 0 docs 커밋(규약 §2). ✅
- **플레이스홀더 스캔**: 전 스텝 실제 코드/커맨드. 폴백 2건은 조건부 지침(placeholder 아님). ✅
- **타입 일관성**: `FieldProps`/`FormTextFieldProps`/`DemoValues` 이름·시그니처가 태스크 간 일치. Field의 `error?: string` ↔ FormTextField의 `fieldState.error?.message`(string|undefined) 정합. TextField Omit 목록이 실제 TextFieldProps 관리 항목과 일치. ✅
