# Button 컴포넌트 설계

2026-07-03 · 브레인스토밍 확정본. Figma Component Library(`AfXabaxOG38EyU5olW5iaP`)의 실제 버튼 디자인을 ground truth로 구현. [2026-07-03-typography-component-design.md](2026-07-03-typography-component-design.md)·[2026-07-03-layout-primitives-design.md](2026-07-03-layout-primitives-design.md)에서 확립한 **토큰 소비 컴포넌트 패턴의 3호**.

## 목적

디자인 시스템 Button을 구현한다. Figma 변수가 우리 `mode-colors`/`spacing`/`radius`/Typography 토큰과 이름 기준 1:1로 대응하므로, **Figma 토큰 → 우리 토큰 시맨틱 매핑**으로 시각을 재현한다.

## Figma 출처 (참조 노드)

| 노드 | Figma 컴포넌트 | 시사점 |
|---|---|---|
| `661:534` | 체계적 primary CTA | solid primary, h56, radius md, label-lg, 후행 아이콘, (가격 변형은 범위 밖) |
| `790:1902` | `ButtonGhost` | outline 스타일 Large(h56/label-lg/px16)·Small(h32/label-md/px12), 아이콘 16, 좌/우 배치, disabled |
| `690:5790` | `ButtonTodayPost` | 바스포크 인스턴스: secondary solid, h40, **radius 20(pill)**, px20, label-md, 아이콘 12 |
| `690:6965` | 바스포크 소형 outline | 소형 outline + 아이콘("수정") |

**핵심 관찰**: Figma 라이브러리는 완전히 체계적이지 않다 — 체계적 컴포넌트(`ButtonGhost`: Large/Small, radius 8)와 기능 전용 바스포크 인스턴스(`ButtonTodayPost`: 알약형)가 공존한다. 우리는 **체계적 부분을 표준화**하고 바스포크는 후속으로 둔다.

## 범위 (Martin 확정)

**이번 사이클 — 코어 Button만**: `color`(primary·secondary) × `appearance`(solid·outline) × `size`(lg·md·sm) × `shape`(rounded·pill) × 상태(default·disabled·pressed·loading) + 아이콘 슬롯.

**후속(범위 밖)**: 가격/할인 조합형 구매 버튼, accent(오행) 색군, 소형 수정 버튼 특화, 아이콘 시스템/Icon 컴포넌트, layout-style 분리(Button이 실소비자가 아님이 확인되어 보류).

## 컴포넌트 API

```ts
type ButtonColor = 'primary' | 'secondary';     // on-color 역할: color=배경, on-color=글자(자동 파생)
type ButtonAppearance = 'solid' | 'outline';    // 채움 스타일
type ButtonSize = 'lg' | 'md' | 'sm';
type ButtonShape = 'rounded' | 'pill';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;                 // Button이 size별 typographyStyles(label-lg/md)를 자동 적용
  onPress: () => void;
  color?: ButtonColor;           // default 'primary'
  appearance?: ButtonAppearance; // default 'solid'
  size?: ButtonSize;             // default 'lg'
  shape?: ButtonShape;           // default 'rounded'
  disabled?: boolean;            // default false
  loading?: boolean;             // default false — ActivityIndicator로 라벨 대체 + press 비활성
  fullWidth?: boolean;           // default false — true면 컨테이너 폭에 맞춤(alignSelf: stretch)
  leading?: ReactNode;           // 선행 슬롯(아이콘 등) — 아이콘 구현은 호출측 위임
  trailing?: ReactNode;          // 후행 슬롯
};
```

**Prop 규약**([component-prop-conventions.md](../../design-system/component-prop-conventions.md)) 준수: `color`(on-color), `appearance`(채움), `size`/`shape`(시각 축), `leading`/`trailing`(슬롯), `Omit<PressableProps,'style'|'children'>` 패스스루, boolean 긍정 네이밍.

- **`color`는 on-color 시스템**(Martin 결정): solid는 `color`가 표면(배경) 역할을 지정하고 글자색은 짝 `on-*`을 자동 파생한다. `color="primary"` → bg `primary.primary`, text `primary.onPrimary`. 호출측이 글자색을 넘기지 않는다. **outline은 배경이 투명이라 `color`로 테두리+글자를 칠한다**(색-aware, 아래).
- **`label: string`** (Martin 결정): Button이 라벨 타이포를 소유해 size별 `label-lg`/`label-md`가 항상 정확히 적용된다. 복잡한 라벨(가격 등)은 후속 조합형 컴포넌트 몫.
- **아이콘은 ReactNode 슬롯**(Martin 결정): Button은 `leading`/`trailing`을 받아 배치만 한다. 아이콘 시스템(현 앱엔 부재, Figma는 Font Awesome Pro)은 별도 결정으로 분리. 슬롯 크기는 호출측이 정함(Figma 기준 권장: lg/sm=16, md=12~16).

## 사이즈 메트릭 (Figma 기준)

radius는 shape가 결정, gap(아이콘↔라벨)은 전 사이즈 `spacing[100]`=8.

| size | height | paddingHorizontal | typography | 출처 |
|---|---|---|---|---|
| `lg` | 56 (`spacing[700]`) | 16 (`spacing[200]`) | `label-lg` (16/24) | 661 CTA, 790 Ghost Large |
| `md` | 40 (`spacing[500]`) | 16 (`spacing[200]`) | `label-md` (14/20) | **일부 보간** — Figma에 체계적 md(rounded) 없음. h40은 TodayPost 인스턴스에서, px16은 lg와 동일하게 보간 |
| `sm` | 32 | 12 (`spacing[150]`) | `label-md` (14/20) | 790 Ghost Small |

- **md는 Figma에 체계적 소스가 없다**(유일한 h40은 알약형 바스포크). 3-size 스케일 완성을 위해 h40/label-md/px16으로 정의 — 구현 후 디자인 확인 필요 항목으로 표기.
- 높이는 고정(라벨 single-line, `whitespace-nowrap` 상당). label lineHeight < height라 클리핑 없음.

## shape

| shape | borderRadius | 비고 |
|---|---|---|
| `rounded` (기본) | `radius.md` = 8 | 661/790의 표준 |
| `pill` | `radius.xl` = 99 | 큰 radius가 height 절반에서 클램프되어 알약형. TodayPost(h40/radius20) 재현 |

## 색상 해석 (mode-colors 시맨틱 매핑)

Figma 변수명 → 우리 토큰명이 1:1이라 이름 기준 매핑.

**solid + primary**
- 기본: bg `primary.primary`, text `primary.onPrimary`
- disabled: bg `primary.primaryDisabled`, text `primary.onPrimaryDisabled`

**solid + secondary**
- 기본: bg `secondary.secondary`, text `secondary.onSecondary`
- disabled: bg `secondary.secondaryDisabled`, text `secondary.onSecondaryDisabled`

**outline** (borderWidth 1, **color-aware**, bg 항상 투명) — Martin 결정
- 기본: bg `transparent`, border = color 메인색(primary→`primary.primary`, secondary→`secondary.secondary`), text = **border와 동일 색**
- disabled: bg `transparent`, border = color disabled색(primary→`primary.primaryDisabled`, secondary→`secondary.secondaryDisabled`), text = 동일 색
- **solid와 대칭**: 채울 표면이 없어 글자가 배경 위에 놓이므로 `on-color`가 아니라 **color 자체**를 쓴다(Typography가 color=글자색 직접인 것과 같은 이치).
- 테두리에 `stroke.*`를 쓰지 않는 이유: `stroke` 그룹엔 `secondary`가 없어(default/subtle/muted/primary/alert) 색-aware가 불가. 색 그룹 메인색을 써야 primary/secondary 모두 대응된다.
- 참고: Figma ghost는 중립 회색 테두리/회색 채움 disabled였으나, 색-aware가 표준적이고 solid와 일관되어 이 방향으로 확정.

## 상호작용 상태 (Figma에 없음 — RN 런타임 추가)

- **pressed**: `Pressable`의 pressed에서 `opacity: 0.85`(disabled/loading이 아닐 때만). Figma에 pressed 디자인이 없어 opacity 피드백을 기본으로 채택(pressed 토큰 부재).
- **loading**: `ActivityIndicator`(color = 해석된 text 색)로 라벨+슬롯을 대체, 컨테이너 크기 유지, press 비활성. login 화면의 현행 ActivityIndicator 사용을 계승.
- **disabled**: 위 disabled 색 + press 비활성.

## 구현 방식 (기존 패턴 계승 — 순수 리졸버 + 얇은 컴포넌트)

`buildLayoutStyle`/codegen과 동일 철학: 로직은 순수 함수에, 컴포넌트는 얇게.

**`button-style.ts`** — 순수 함수 `buildButtonStyle`:
```ts
type ButtonState = { color; appearance; size; shape; disabled };
type ButtonStyle = {
  container: ViewStyle;   // height, paddingHorizontal, borderRadius, backgroundColor,
                          // borderWidth, borderColor, flexDirection:'row', alignItems/justifyContent:'center', gap
  textColor: string;      // 라벨/스피너 색
  typography: TypographyVariant;  // 'label-lg' | 'label-md'
};
function buildButtonStyle(state: ButtonState, colors: ModeColors): ButtonStyle
```
- 색상은 위 매핑을 이 함수 한 곳에 집중. size 메트릭은 내부 상수 테이블. pressed/loading/fullWidth는 런타임이라 컴포넌트에서 처리(리졸버는 정적 상태만).

**`button.tsx`** — 컴포넌트:
- `Pressable`(RN) 루트. `style={({pressed}) => [container, {alignSelf: fullWidth ? 'stretch' : 'flex-start'}, pressed && !disabled && !loading && {opacity:0.85}]}`. **기본 hug**: 부모가 Column(alignItems 기본 stretch)이면 그냥 두면 전폭이 되므로, 기본 `alignSelf:'flex-start'`로 콘텐츠 폭에 맞추고 `fullWidth`일 때만 `stretch`.
- 내부: `leading` 슬롯 → `loading ? <ActivityIndicator color={textColor}/> : <Text style={[typographyStyles[typography], { color: textColor }]}>{label}</Text>` → `trailing` 슬롯 (loading 시 라벨·슬롯 대체).
- 라벨은 Typography 컴포넌트가 아니라 `typographyStyles[typography]` + 직접 `<Text>`로 렌더(아래 이슈 항목 참고).
- `disabled || loading`이면 `Pressable`의 `disabled` true, `accessibilityState` 반영.
- React 19라 `ref`는 `...rest` 패스스루(forwardRef 불필요).

**라벨 렌더가 Typography 컴포넌트가 아닌 이유**: `textColor`(예 `primary.onPrimary`)는 Typography의 `color`(=`keyof ModeColors['text']`) 후보가 아니다(on-color 파생값이라 text 그룹 밖). 두 해법 — (A) Typography에 인라인 style로 색 주입(Typography 색-정책 우회) / (B) Button이 `typographyStyles[typography]` + 직접 `<Text>`로 렌더. **(B) 채택**: Typography의 색 정책(text 그룹 한정)을 깨지 않고 Button이 자기 on-color 계약을 명시적으로 소유. `typographyStyles`/`TypographyVariant`는 `typography/generated`에 있으며 딥임포트 대신 `typography/index.ts` 배럴에 re-export 추가 후 사용(파일 구조 참고).

## 파일 구조

```
src/shared/components/button/
  button-style.ts            # 타입 + buildButtonStyle 순수 함수 (색/사이즈 매핑 전담)
  button.tsx                 # 컴포넌트
  index.ts                   # barrel
  __tests__/button-style.test.ts
```
- kebab-case 파일명 + PascalCase export(`Button`) — 확립된 컨벤션.
- `src/shared/components/index.ts`에 `Button` + prop 타입 export 추가.
- **`typography/index.ts` 배럴에 `typographyStyles` + `TypographyVariant` re-export 추가 필요**: 현재 배럴은 `Typography`/`TypographyProps`만 노출한다(`typographyStyles`는 `typography/generated/typography.ts`에 존재하나 미노출). Button이 generated를 딥임포트하지 않도록 배럴에 올린다.

## 테스트 전략

repo 관례(순수 로직 유닛테스트, RTL 미도입). `button-style.test.ts`로 `buildButtonStyle` 검증:
1. solid primary 기본 → bg primary.primary, textColor onPrimary, typography label-lg(lg)
2. solid primary disabled → bg primaryDisabled, textColor onPrimaryDisabled
3. solid secondary 기본/disabled → secondary 색군
4. outline primary 기본 → bg transparent, borderWidth 1, borderColor/textColor = primary.primary
5. outline secondary 기본 → borderColor/textColor = secondary.secondary (색-aware 확인)
6. outline disabled → bg transparent, borderColor/textColor = color의 disabled색(primary.primaryDisabled 등)
7. size별 height/paddingHorizontal/typography (lg 56/16/label-lg, md 40/16/label-md, sm 32/12/label-md)
8. shape rounded → radius 8, pill → radius 99
9. 공통: flexDirection row, alignItems/justifyContent center, gap 8

컴포넌트 렌더(pressed/loading/fullWidth/슬롯)는 시뮬레이터 시각 검증(Typography/layout 때와 동일).

## 첫 실사용 (제안 — 스펙 검토에서 확정)

컴포넌트가 실제로 쓰여야 검증된다. 후보:
- **login 화면 Google 버튼**: 현재 outline + ActivityIndicator(loading) 수기 구현 → `<Button appearance="outline" size="lg" loading={loading} label="Google로 계속하기" onPress={onGoogle} />`로 교체. Button의 loading을 실증하는 최적 사례. **주의: 시각 변화 있음** — 현재 라벨 15px/500 → label-lg 16px/500(Noto Medium). Martin 판단 필요.
- **home 화면 링크 3개**: outline 버튼들. label 교체 시 body-md→label-md 등 변화. 후속으로.

권장: 이번 사이클에 **login Google 버튼 1곳만** 첫 실사용으로 교체(범위 최소, loading 실증), 나머지는 후속.

## 사이드이펙트 검토

1. 신규 컴포넌트 추가 + (선택)login 1곳 교체라 영향 국소적.
2. Button이 `Typography/generated`의 `typographyStyles`를 import → barrel 순환 없음(theme/typography는 components 역참조 안 함).
3. `ActivityIndicator`·`Pressable`은 RN 코어, 추가 의존성 없음.
4. login 교체 시: 기존 `onGoogle`/`loading` 로직 불변, JSX만 교체. 시각 변화(라벨 크기)만 리뷰 대상.

## 범위 밖 / 후속 (로드맵)

- 가격/할인 조합형 구매 버튼(661 가격 변형), accent(오행) 색군, 색 있는 outline, 소형 수정 버튼
- 아이콘 시스템/Icon 컴포넌트 (Font Awesome Pro 대안: react-native-vector-icons or SVG)
- home 화면 버튼 마이그레이션, Card 컴포넌트
- layout-style → token-style 분리(실소비자 등장 시)
- Figma Code Connect 매핑(Button 구현 후 연결하면 이후 codegen 품질↑)

## 실행 노트

- 브랜치: main 최신 상태에서 `feature/button-component` 분기.
- git push/commit은 명시 요청 시에만.
