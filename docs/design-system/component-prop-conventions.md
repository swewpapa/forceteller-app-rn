# 컴포넌트 Prop 규약

`src/shared/components/`의 디자인 시스템 컴포넌트가 prop을 정의하는 표준. Typography · layout(Box/Row/Column) · Button · Chip을 만들며 확립. **새 컴포넌트(Card 등)는 이 규약을 따른다.**

## 1. Prop 카테고리

모든 prop은 아래 다섯 중 하나다.

| 카테고리 | 예 | 규칙 |
|---|---|---|
| **시각 정체성** | `color`, `appearance`, `size`, `shape`, `variant`, `padding` | 제약된 union 또는 토큰 키만. 임의 문자열/값 금지 |
| **콘텐츠** | `children`, `label`, `leading`/`trailing` | 컨테이너는 `children`, 통제형 leaf는 타입드 prop |
| **상태/동작** | `disabled`, `loading`, `fullWidth`, `onPress` | boolean은 긍정 네이밍 + default false |
| **탈출구** | `style` | 토큰 비관할, 레이아웃 전용, 병합 마지막 |
| **base 패스스루** | `accessibilityLabel`, `onLayout`, `testID`, `ref` | `Omit<Base,'style'\|'children'> & {...}` + `{...rest}` |

## 2. 네이밍 규약

### 시각 축 이름 (예약어)

- **`color`** — 컴포넌트의 지배 색 역할. **on-color 시스템**으로 해석한다(§4).
  - 채움이 있는 컴포넌트(Button): `color`=배경/채움 역할, 글자는 짝 `on-*`을 **자동 파생**. `color="primary"` → bg `primary.primary`, text `primary.onPrimary`.
  - 채움이 없는 텍스트 전용(Typography): 채울 표면이 없으므로 `color`=글자색 직접(`keyof ModeColors['text']`).
- **`appearance`** — 채움 스타일(`solid` | `outline` 등). "무엇으로 칠하나".
- **`variant`** — **타입-역할 스케일 전용 예약어.** Typography의 `headline`/`body`/`label` 같은 스케일에만 쓴다. 색·채움에 `variant`를 쓰지 않는다(과거 혼동 방지).
- **`size`**, **`shape`** — 이름 그대로.

### 토큰 타입 prop

- 값은 **토큰 키 이름**을 문자열로: `SpacingKey`(`'300'`), `RadiusKey`(`'md'`), 색 그룹 키.
- 원시값이 허용되는 축은 `number`(원시 px)를 함께 받되 **문자열=토큰, 숫자=원시**로 구분(예 layout `SpaceValue`). 원시 허용 여부는 축마다 명시.

### 슬롯

- ReactNode 슬롯은 **`leading` / `trailing`** (camelCase). (RTL 논리 방향 네이밍. 한국어 단일 로케일이라 물리 방향과 일치하지만 의미 기준 명칭 채택.)
- **대소문자 규칙**: prop 이름의 대문자 여부는 "컴포넌트를 받느냐"가 아니라 **"JSX 태그로 렌더하느냐"**로 결정된다. 슬롯은 완성된 **엘리먼트(ReactNode)** 를 받아 `{leading}`으로 배치만 하므로 소문자. 부모가 `<Prop/>`로 직접 렌더하는 **컴포넌트 타입** prop만 대문자가 강제된다(우리는 이 패턴을 쓰지 않는다 — 아이콘 크기 등 주입이 필요하면 그때 재검토). MUI `startIcon`/Chakra `leftIcon`/Ant `icon`도 전부 camelCase ReactNode.

### boolean / 핸들러

- boolean은 긍정 네이밍(`disabled`·`loading`·`fullWidth`), default `false`.
- 핸들러는 `onXxx`.

### 폼 결합 접두사

- **`Form` 접두사 = 폼 라이브러리(react-hook-form) 결합 계층**(`components/form/` 폴더). 무접두사 = 순수 DS.
- 이름만으로 결합 여부를 식별한다: `Field`(순수 라벨+에러 래퍼) vs `FormTextField`(RHF 어댑터), 향후 `Checkbox` vs `FormCheckbox`. 업계 연상(shadcn `FormField`=RHF 래퍼, Chakra v3 `Field`=순수)과 일치. RHF 교체 시 `form/` 폴더만 재작업.

## 3. `style` 탈출구 3계층 정책

Typography에서 확립, 전 컴포넌트 공통:

1. **레이아웃 조정**(margin/flex/position/width 등) → `style`로 개방. 병합 **항상 마지막**이라 여기 값이 우선.
2. **시각 정체성**(색/타이포/채움/radius 등) → **named prop으로만**. `style`로 덮지 말 것(가능은 하지만 규약 위반).
3. 둘 다 아닌 새 요구 → 디자인 검토 후 **새 variant/prop 추가** 또는 별도 조립.

## 4. on-color 시스템 (색 시맨틱)

토큰은 `표면색` + `on-표면색` 짝으로 구성된다(`primary`/`onPrimary`, `secondary`/`onSecondary`, `*Disabled` 짝, accent의 `wood`/`onWood` …). 규칙:

- `color` prop은 **표면색**을 지정하고, 그 위 콘텐츠 색은 짝 `on-*`을 **컴포넌트가 자동 파생**한다.
- **호출측이 채움 위 글자색을 넘기게 하지 않는다.** 표면과 대비는 토큰 짝이 보장.
- disabled도 동일 원리로 `*Disabled` + `on*Disabled` 짝을 쓴다.

## 5. base 패스스루

- 시그니처: `Omit<BaseProps, 'style' | 'children'> & { …overrides }`.
- 나머지는 `{...rest}`로 루트에 전개 → `onLayout`·`testID`·`accessibility*`·`ref`(React 19) 자동 통과.
- `style`·`children`은 **Omit 후 재정의**해 통제(§3, §1).
- **컴포넌트가 파생·제어하는 prop도 Omit**: 컴포넌트가 계산해 보장하는 값(예: `disabled`/`loading`에서 파생한 `accessibilityState`, 항상 고정인 `accessibilityRole`)은 Omit해 호출측이 `{...rest}`로 덮어써 계약을 무력화하지 못하게 한다. (style/children과 같은 원리.)
- Pick 화이트리스트는 쓰지 않는다(매번 열거 부담 + 기존 컴포넌트와 불일치).

## 6. 기본값 · 필수

- 선택 시각 prop은 **문서화된 default**를 갖는다.
- 필수 prop은 **콘텐츠 + 주요 핸들러**로 최소화(예 Button: `label`, `onPress`).

## 7. React 19

- `ref`는 일반 prop이라 `{...rest}`로 전달. `forwardRef` 불필요.

## 8. 아토믹 컴포넌트 조합 + 스타일 엔진

Chip에서 확립. 닫힌 DS 컴포넌트(시각 정체성이 고정된 것 — Chip/Button 등)를 **열린 아톰 조합 + variant 데이터**로 조립하는 패턴이다. 사용자에겐 named prop(`label`/`appearance` 등)만 노출하고, 내부는 토큰 prop을 받는 재사용 아톰을 variant 데이터로 값 고정해 만든다.

### 스타일 엔진 (`src/shared/lib/style-engine/`)

- 토큰 인지 스타일 prop 팩토리 **`withStyleProps(Component, { base?, pressedStyle?, resolvers })`** + 순수 리졸버(`color` / `textColor` / `font`) + `composeStyles`(base→리졸버 순 병합, 순수함수).
- 리졸버는 `useTheme()`(전체 토큰 묶음)을 소비해 토큰 참조 → 스타일값으로 변환. 소비한 prop은 네이티브로 forward하지 않는다.
- `pressedStyle`은 Pressable 계열 base 전용(style이 함수형으로 전달되므로).

### 아토믹 조합 모델

- 아톰은 **엔진산(토큰 prop을 받는 열린 컴포넌트)**. 조합 컴포넌트가 variant 데이터로 값을 고정해 시각 정체성을 닫는다.
- 아톰은 기본 **비공개**(컴포넌트 파일 내부). `leading`/`trailing` 공개 prop(ReactNode)은 기존 §2 규약을 유지 — 아톰 이름만 `*Visual`.

### 아톰 suffix 4종

| suffix | 역할 |
|---|---|
| **`{Component}Container`** | 셸(배경/보더/레이아웃) |
| **`{Component}TextLabel`** | 텍스트 |
| **`{Component}LeadingVisual`** / **`{Component}TrailingVisual`** | 비주얼 슬롯 |

### variant = 데이터

- variant는 스타일 함수가 아니라 **토큰 참조 값의 묶음** 객체다.
- 타입은 **`Record<AppearanceKey, VariantShape>` 어노테이션**으로 단다. `as const satisfies`는 리터럴 유니온이 되어 `v.foo` read 시 TS2339(속성 없음)를 유발하므로 쓰지 않는다.
- 값은 **토큰 참조만** — 색 경로(`'text.default'`), 타입스케일(`'label-lg'`). 생 hex 등 토큰 밖 값 금지.

### variant 키 = 슬롯 접두사 + 속성

- 키 = `{슬롯 접두사}{속성}`: `containerColor`, `containerBorderColor`, `textLabelColor`, `textLabelFont`, `leadingVisualSize` 등.
- **속성 어휘(슬롯 상대적)**:
  - **`Color`** — 색. `containerColor`는 배경/fill 역할(M3 계열).
  - **`Font`** — 타입스케일 한 묶음. 텍스트 슬롯 기본(스케일 규율 유지).
  - **`Size`/`Weight`/`LineHeight`/`Tracking`** — 스케일 밖 오버라이드 + Visual 슬롯용.

### 키 → 아톰 prop 유도

- variant 키에서 슬롯 접두사를 떼면 아톰 prop명이 된다: `textLabelFont`→`font`, `textLabelColor`→`color`.
- 특례 하나: **`containerColor`→`background`**(엔진 `color` 리졸버의 기존 Box 어휘 유지).

### 색은 시맨틱 경로

- 엔진 색 prop은 **`ColorPath`**(`'group.key'`, `ModeColors`에서 유도). 그룹 한정(`keyof ModeColors['text']`)이 아닌 경로 방식인 이유: on-color가 그룹을 넘나드는 조합(예: solid 라벨 = `'background.surface'`)을 표현해야 하기 때문.

### 열린 레이아웃(Box/Row/Column)의 색 prop

- Box/Row/Column은 **`color`** prop(값 = `keyof ModeColors['background']` 자기 그룹키, 예 `color="surface"`)으로 배경색을 받는다. View엔 텍스트색 개념이 없어 `color`=배경 혼동이 없고, 컨테이너 슬롯이 하나뿐이라 접두사가 불필요.
- **전환기 불일치(문서화)**: 레이아웃은 `color`(그룹키), Chip 아톰은 `background`(ColorPath). 같은 개념(컨테이너 배경)인데 prop명·값 타입이 갈리고, 엔진 리졸버도 `color` 리졸버(prop `background`)와 `backgroundColor` 리졸버(prop `color`)가 엇갈린다. 근본 원인은 Chip의 ColorPath가 무채색 chip 토큰 부재의 임시 우회라는 것 — **무채색 chip 시맨틱 토큰 신설 후속에서 양쪽 통일**(리졸버 네임 정리 포함). 각 아톰은 하나만 쓰므로 런타임 충돌은 없다.

### 예시 (Chip)

```tsx
// ── 아톰(비공개) ─────────────────────────────
const ChipContainer = withStyleProps<ColorProps, PressableProps>(Pressable, {
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

// Record<…> 어노테이션 (as const satisfies 아님 — read 시 TS2339 방지)
const chipVariants: Record<ChipAppearance, ChipVariant> = {
  outline: { containerBorderColor: 'text.default', textLabelColor: 'text.default', textLabelFont: 'label-lg' },
  solid: { containerColor: 'text.muted', textLabelColor: 'background.surface', textLabelFont: 'body-lg' },
};

// ── 조합(공개) ───────────────────────────────
export function Chip({ label, onPress, appearance = 'outline', style, ...rest }: ChipProps) {
  const v = chipVariants[appearance];
  return (
    <ChipContainer
      accessibilityRole="button"
      onPress={onPress}
      background={v.containerColor} // containerColor → background 특례
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

## 현재 컴포넌트 대조표

| 컴포넌트 | 시각 정체성 | 콘텐츠 | 탈출구 | 패스스루 |
|---|---|---|---|---|
| Typography | `variant`(타입 스케일), `color`(text 키·글자색 직접) | `children` | `style`(레이아웃) | `Omit<TextProps,'style'\|'children'>` |
| Box/Row/Column | `padding`/`p`·`margin`/`m`(토큰\|px shorthand), `color`(배경 그룹키), `radius`; Row/Column만 `gap`·`justify`/`align` | `children` | `style`(레이아웃) | `ViewProps` 패스스루(withStyleProps 엔진 기반 §8, buildLayoutStyle 폐지) |
| Button | `color`(on-color), `appearance`, `size`, `shape` | `label`, `leading`/`trailing` | `style`(레이아웃) | `Omit<PressableProps,'style'\|'children'>` |
| Chip | `appearance`(variant 데이터로 값 고정 — §8) | `label` | `style`(레이아웃) | `Omit<PressableProps,'style'\|'children'\|'accessibilityRole'>` |

## 비고

- 이 문서는 **표준 참조 문서**(dated spec 아님) — 새 컴포넌트/규약 변경 시 갱신.
- 색 축이 accent(오행: wood/fire/earth/metal/water)로 확장되면 `color`가 그대로 수용(범주색도 표면색 역할). accent는 현재 범위 밖.
