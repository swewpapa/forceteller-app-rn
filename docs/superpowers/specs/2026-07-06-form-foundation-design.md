# 폼 Foundation (react-hook-form + zod + Field/FormTextField) 설계

2026-07-06 · 브레인스토밍 확정본. [2026-07-06-text-field-design.md](2026-07-06-text-field-design.md)의 후속 — form 컴포넌트 패밀리 2호(Field) + 폼 상태/검증 기반 도입. [component-prop-conventions.md](../../design-system/component-prop-conventions.md) 준수.

## 목적

폼 상태 관리와 스키마 검증의 표준 스택(**react-hook-form + zod**)을 도입하고(Martin 결정 — 안정성/표준성 근거), 에러 메시지 표시 UI(**Field**)와 RHF 연결 어댑터(**FormTextField**)를 만든다. 이후 모든 폼은 이 기반 위에 조립된다.

## 아키텍처 결정 (Martin 확정 — C안)

**순수 `Field`(DS) + `FormTextField`(RHF 어댑터)의 2계층.**

- **`Field`**: label + 컨트롤 + 에러메시지의 **표시만** 담당. RHF/zod를 모른다(의존 0). DS 순수성 유지.
- **`FormTextField`**: RHF **공식 권장 패턴 `useController`**로 TextField를 폼에 배선하는 얇은 어댑터. RHF 결합은 이 계층(=`form/` 폴더)에만 격리 — 라이브러리 교체 시 여기만 재작업.
- 검토 경과: A(순수 Field만 — 폼마다 Controller 배선 반복) / B(RHF-aware만 — DS가 RHF에 결합) 대비, C가 순수성과 편의를 모두 확보. RHF 공식 문서가 "재사용 커스텀 컨트롤드 입력 = `useController`"를 명시해 어댑터가 공식 확장 지점임을 확인(Context7, RHF v7.66 docs).
- **네이밍 규칙(Martin 확정)**: **`Form` 접두사 = RHF 결합 계층**(`components/form/` 폴더), 무접두사 = 순수 DS. 이름만으로 결합 여부를 식별한다 — `Field`(순수) vs `FormTextField`(어댑터), 향후 `Checkbox` vs `FormCheckbox`. 검토 경과: 어댑터를 `TextField`로 명명하는 안은 기존 입력 박스와 배럴 충돌로 불가, 순수 래퍼를 `FormField`로 명명하는 안은 이 규칙과 업계 연상(shadcn `FormField`=RHF 래퍼)에 반해 기각. 규칙은 [component-prop-conventions.md](../../design-system/component-prop-conventions.md) §2에 명문화.

## 설치물 (버전 실측 2026-07-06)

| 패키지 | 버전 | 비고 |
|---|---|---|
| `react-hook-form` | 7.81.0 | peer 조건 없음(react만) |
| `zod` | 4.4.3 | v4 관용구 사용(`z.email()` 등) |
| `@hookform/resolvers` | 5.4.0 | peer `react-hook-form ^7.55.0` — 충족 |

- 셋 다 **순수 JS** — 네이티브 모듈 없음, pod install 불필요, New Arch 무관.
- 설치는 **pnpm**(`pnpm add react-hook-form zod @hookform/resolvers`, 락파일 pnpm-lock.yaml — repo가 pnpm+node-linker=hoisted).
- resolvers 5.x ↔ zod 4 호환은 설치 후 tsc + 데모로 실증(플랜 게이트). 문제 시 폴백: `standardSchemaResolver`(zod 4가 Standard Schema 지원).

## `Field` — 순수 DS 컴포넌트

Figma `xX6xsjXGIcywNl9ARyyzv4` node `106:3419`(라벨+필드+에러메시지) 기반. 로직 0 — 기존 컴포넌트 조립만.

```tsx
type FieldProps = {
  label?: string;      // 있으면 Typography variant="label-md" color="default"
  error?: string;      // 있으면 Typography variant="label-sm" color="alert"
  children: ReactNode; // 컨트롤(TextField 등 — Field는 뭐가 오는지 모름)
};

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

### 토큰 매핑 (Figma 실측)

| 요소 | Figma (106:3419) | 채택 | 비고 |
|---|---|---|---|
| 라벨 | 14/500/-0.28, #191919 | `label-md` + `text.default` | **정확 일치** |
| 간격 | 12 (라벨↔필드↔에러 동일) | `gap="150"` (spacing 150=12) | 일치 |
| 에러 텍스트 | 12/**400**/-0.24, **#e85e5e**(red500) | `label-sm`(12/**500**) + `text.alert`(day=red600) | **디자인 확인 항목 2건**: ① 새 타입스케일에 12/400 없음 → 가장 가까운 label-sm 채택(weight 차이) ② 구 화면 파일 색 red500 vs 새 토큰 text.alert(red600) — 시맨틱 정답(text.alert) 우선 |

- Figma 화면 파일은 구버전 체계(필드 h44/radius6, 구 팔레트 변수명)라 **구조·간격·역할만 취하고**, 값은 새 토큰 시맨틱으로 해석. 필드 자체는 우리 TextField(Component Library 정본 h48/radius8).
- `helperText`(비에러 힌트)는 Figma에 없음 — 후속.
- error가 없으면 에러 줄 자체가 렌더되지 않음(공간 미예약). 에러 등장 시 아래 요소가 밀리는 것은 Figma와 동일 동작.

## `FormTextField` — RHF 어댑터

RHF 공식 `useController` 기반(공식 문서: "designed for creating reusable controlled inputs").

```tsx
import { useController, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';

type FormTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  /** string 값 필드 경로만 허용 — TextField(value: string)와 타입 정합 */
  name: FieldPathByValue<TFieldValues, string>;
  label?: string;
} & Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

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

- `Omit`으로 폼이 소유하는 prop(value/onChangeText/onBlur/error)을 차단 — 규약 §5 "컴포넌트가 파생·제어하는 prop도 Omit" 적용. placeholder/clearable/leading/trailing/keyboardType 등은 그대로 통과.
- `field.onBlur`는 `() => void`라 TextField `onBlur?: (e: BlurEvent) => void`에 직접 대입 가능(파라미터 적은 함수 할당 — TS 표준 동작).
- `field.value ?? ''`: defaultValues 미지정 방어(controlled 계약 유지).
- `FieldPathByValue<T, string>` 성립은 플랜 tsc 게이트에서 실증(RHF 타입 export — 확인 필요 항목, 실패 시 `FieldPath<T>` + 내부 캐스트로 폴백).

## 파일 구조 — 결합의 폴더 격리

```
src/shared/components/field/
  field.tsx  index.ts                  # 순수 DS (RHF 의존 0)
src/shared/components/form/
  form-text-field.tsx  index.ts        # RHF 어댑터 계층 (향후 form-checkbox 등 추가)
```

- kebab-case 파일 + PascalCase export. 둘 다 `src/shared/components/index.ts` 배럴 노출(`Field`, `FieldProps`, `FormTextField`, `FormTextFieldProps`).
- import 방향: `form/` → `field/`·`text-field/`·RHF. `field/` → typography·layout만. 상위 배럴 역참조 금지(기존 규칙).

## 검증 전략 (정직 고지)

- **신규 유닛테스트 없음** — Field(조립 0로직)/FormTextField(배선 0로직)는 repo 관례(순수 로직만 테스트)상 테스트 대상 로직이 없다. 게이트: tsc/lint 클린 + 기존 113 테스트 유지.
- **데모로 end-to-end 실증**(TextField Unit C와 동일한 임시 삽입→검증→되돌림):

```tsx
const schema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  email: z.email('이메일 형식이 올바르지 않습니다'),  // zod v4 관용구
});
type FormValues = z.infer<typeof schema>;

const { control, handleSubmit } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
  mode: 'onChange',  // 데모에서 즉시 에러 확인용 — 앱 표준 mode는 폼별 결정(강제 안 함)
});

<FormTextField control={control} name="name" label="이름" placeholder="입력해주세요" />
<FormTextField control={control} name="email" label="이메일" placeholder="you@example.com" keyboardType="email-address" />
<Button label="제출" onPress={handleSubmit((d) => console.log(d))} />
```

확인 항목: 빈 값/짧은 이름/잘못된 이메일 → 필드 빨간 테두리 + 아래 에러 메시지(한국어) 노출 → 수정 시 해소 → 제출 시 값 로그. light/dark.

## 사이드이펙트 검토

1. 신규 의존성 3개 — 전부 순수 JS, 번들 크기 외 네이티브 영향 없음. 기존 화면 무변경.
2. TextField/Button/Typography/Column은 **무수정 소비**만 — PR #7(TextField)이 머지 선행되어야 함(이 브랜치의 베이스).
3. 배럴 확장 2건 — 기존 패턴 동일, 순환 없음.

## 범위 밖 / 후속

- 실제 폼 화면(데모는 되돌림 — 실폼은 해당 기능 착수 시), Checkbox·Chip/ChipGroup(form 패밀리 3·4호) + FormCheckbox 등 어댑터 확장
- helperText, 폼 표준 mode 정책, 서버 에러 주입 패턴(setError), 다국어 에러 메시지 체계
- 폰트 번들링(기존 로드맵)

## 실행 노트

- **선행: PR #7(feature/text-field) 머지** → main 최신에서 `feature/form-foundation` 분기.
- push/commit은 명시 요청 시에만.
