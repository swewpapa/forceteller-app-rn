# 컴포넌트 Prop 규약

`src/shared/components/`의 디자인 시스템 컴포넌트가 prop을 정의하는 표준. Typography · layout(Box/Row/Column) · Button을 만들며 확립. **새 컴포넌트(Card 등)는 이 규약을 따른다.**

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

## 현재 컴포넌트 대조표

| 컴포넌트 | 시각 정체성 | 콘텐츠 | 탈출구 | 패스스루 |
|---|---|---|---|---|
| Typography | `variant`(타입 스케일), `color`(text 키·글자색 직접) | `children` | `style`(레이아웃) | `Omit<TextProps,'style'\|'children'>` |
| Box/Row/Column | `padding`/`p`/`gap`(토큰\|px), `background`, `radius`, `justify`/`align` | `children` | `style`(레이아웃) | `Omit<ViewProps,'style'\|'children'>` |
| Button | `color`(on-color), `appearance`, `size`, `shape` | `label`, `leading`/`trailing` | `style`(레이아웃) | `Omit<PressableProps,'style'\|'children'>` |

## 비고

- 이 문서는 **표준 참조 문서**(dated spec 아님) — 새 컴포넌트/규약 변경 시 갱신.
- 색 축이 accent(오행: wood/fire/earth/metal/water)로 확장되면 `color`가 그대로 수용(범주색도 표면색 역할). accent는 현재 범위 밖.
