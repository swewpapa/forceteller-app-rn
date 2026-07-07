# Style Engine + 아토믹 컴포넌트 조합 설계 (withStyleProps / Chip / keyword_cloud)

> 2026-07-07 브레인스토밍 확정본. build{Component}Style의 확장성 갭(Martin 제기)에서 출발, restyle 평가·사내 디자인 시스템 2종(un7qi3-design, forceteller-web-legacy cdk) 분석을 거쳐 **자체 스타일 엔진 + 아토믹 조합 모델**로 확정. 첫 소비자는 Chip(+keyword_cloud 위젯).

## 1. 결정 경위

| 검토 대상 | 결론 | 근거 |
|---|---|---|
| 현행 `build{Component}Style` | 유지하되 일반화 필요 | 컴포넌트마다 리졸버 재작성 — 토큰 prop이 공유 안 됨 (Martin: "스타일 하나에 토큰 적용") |
| un7qi3-design `packages/system` | 코드 리프트 불가, 패턴 참고 | emotion 기반 웹 전용 |
| `@shopify/restyle` v2.4.5 | 미채택(자체 제작) | 호환 리스크 낮음(npm 실측: zero-dep, peer `react-native: *`)이나 배포 15개월 정체 + Martin이 직접 소유·디벨롭 의사 |
| forceteller-web-legacy `packages/cdk` (Martin 설계) | 어휘·패턴 채택 | `leadingVisual`/`trailingVisual` 슬롯 어휘, 경로 방식 색 해석(`palette.get(path)`), `useTheme` 컬렉션 오버로드. 모듈 증강(Overrides)은 둘째 소비 앱 생길 때로 보류 |
| **아토믹 조합 모델 (Martin 제안)** | **핵심 아키텍처로 채택** | 초기 설계는 "열린 컴포넌트(Box)=엔진, 닫힌 컴포넌트(Chip)=build*Style"로 이원화됐고 Chip을 엔진 첫 소비자로 묶으며 모순 누적(resolvers 비움, variant 별도 계약, textColor 배달 문제). **"닫힌 컴포넌트 = 열린 아톰들의 조합 + 값 고정"**으로 재정의하면 단일 메커니즘으로 통일되고 위 모순이 전부 소멸 |

**네이밍**: 팩토리 `withStyleProps`(HOC 관습, 후보 8종 비교 후 확정). 폴더 `src/shared/lib/style-engine/`(lib=인프라 계층 — http/query-client와 동렬, Martin 확정).

## 2. 아키텍처: 아토믹 조합 모델

```
[엔진]  withStyleProps + 리졸버  →  열린 아톰 (토큰 prop을 받는 조각)
[조합]  닫힌 DS 컴포넌트 = 아톰 조합 + variant(토큰 경로 값 데이터)로 값 고정
```

- **아톰(열린 조각)**: `withStyleProps(Pressable, {...})`처럼 엔진으로 만들며, 토큰 prop을 노출한다.
- **조합(닫힌 컴포넌트)**: Chip/Button처럼 시각 정체성이 고정된 컴포넌트. 아톰들을 조합하고 variant 데이터로 토큰 prop 값을 고정한다. 사용자에게는 `label`/`appearance`/`onPress`만 노출(기존 3계층 규약 그대로).
- **variant는 데이터다**: 스타일 함수가 아니라 "토큰 경로 값의 묶음" 객체. 토큰 밖 임의 값(생 hex 등)을 쓸 수 없게 타입이 강제 — build*Style(임의 ViewStyle 반환 가능)보다 규율이 강함.
- RN에 CSS 색 상속이 없어 생기던 textColor 배달 문제는 **라벨이 자기 아톰**(자기 색 prop을 직접 받음)이 되면서 소멸.

### 아토믹 네이밍 규칙 (Martin 확정 — component-prop-conventions.md §신설 반영)

| 규칙 | 내용 |
|---|---|
| 아톰 suffix | `{Component}Container`(셸) / `{Component}TextLabel`(텍스트) / `{Component}LeadingVisual`·`{Component}TrailingVisual`(비주얼 슬롯 — cdk 어휘) |
| variant 키 | 슬롯 접두사 + 속성: `containerColor`, `containerBorderColor`, `textLabelFont`, `textLabelColor`, `leadingVisualSize` … |
| variant 값 | 토큰 참조만 — 시맨틱 색 경로(`'text.default'`), 타입스케일(`'label-lg'`) 등 |
| 아톰 공개 범위 | 기본 **비공개**(컴포넌트 파일 내부 구성용). 외부 조합 수요가 생기면 그때 export |
| 공개 prop | 기존 규약 유지 — `leading`/`trailing`(ReactNode)은 그대로, 아톰 이름만 `*Visual` |

**variant 속성 어휘 (슬롯 상대적, Martin 확정)**:

| 속성 | 의미 | RN 매핑 | 비고 |
|---|---|---|---|
| `Color` | 슬롯 색 | color / backgroundColor(Container) | `containerColor`는 M3 containerColor 계열(=fill) |
| `Font` | **타입스케일 한 묶음** | typographyStyles[variant] | 텍스트 슬롯의 **기본** — 스케일 규율 유지 (`textLabelFont: 'label-lg'`) |
| `Size` | 슬롯 콘텐츠 크기 | fontSize(텍스트) / 아이콘 크기(Visual) | 스케일 밖 예외 오버라이드 + Visual 슬롯(스케일 없음) |
| `Weight` / `LineHeight` / `Tracking` | 굵기 / 행높이 / 자간 | fontWeight / lineHeight / letterSpacing | Size와 동일 — 예외 오버라이드용 |

**키→prop 유도 규칙**: variant 키에서 슬롯 접두사를 떼면 아톰 prop명이다(`textLabelFont`→`font`, `textLabelColor`→`color`). 매핑 특례는 `containerColor`→`background`(기존 Box 어휘 유지) 하나뿐.

## 3. 엔진 코어 (`src/shared/lib/style-engine/`)

```
resolver.ts          # Resolver 타입
color-path.ts        # ColorPath 타입 + resolveColorPath()
resolvers/
  color.ts           # background / borderColor — 시맨틱 경로 방식
  text-color.ts      # color(텍스트) — 시맨틱 경로 방식
  font.ts            # font(타입스케일 → theme.typography 한 묶음)
compose-styles.ts    # 순수 병합
with-style-props.tsx # 팩토리
index.ts
```

**v1 리졸버는 Chip이 실제 소비하는 3종만**(color/text-color/font) — spacing(padding/p·margin/m alias 대칭)·radius·sizing 리졸버는 첫 소비자(Box/Row/Column 마이그레이션)와 함께 다음 사이클에서 출하한다(미사용 코드를 싣지 않는 관례, §8 로드맵).

**codegen 경계**: 엔진은 전부 수기. codegen(generate-tokens.js)의 생성 범위는 토큰 값+타입(현행 유지) — 단 typography 출력 경로만 `theme/generated/`로 이전(아래). 엔진 타입이 generated 타입에 직결 — tokens.json 변경 → codegen → prop 유니온 자동 확장.

### 토큰 접근 = 기존 `useTheme` 확장 (Martin 확정, B안)

엔진 전용 훅을 새로 만들지 않는다. 기존 `useTheme()`이 전체 토큰 묶음을 반환하도록 확장:

```ts
// theme-provider.tsx — ThemeContextValue 확장
export type ThemeContextValue = {
  colors: ModeColors;                    // 모드 반응형(day/night)
  spacing: typeof spacing;               // 정적
  radius: typeof radius;                 // 정적
  typography: typeof typographyStyles;   // 정적 (theme/generated로 이전)
  mode: ThemeMode; resolvedTheme: ResolvedTheme; setMode: (m: ThemeMode) => void;
};
// useTheme(): ThemeContextValue — MUI/restyle/cdk 컨벤션(theme=토큰 묶음)과 일치. useAppColors는 useTheme().colors로 유지.
```

정적 토큰(spacing/radius/typography)은 값이 안 변하므로 memoized context value에 담아도 리렌더 영향 0. 엔진 리졸버는 `resolve(values, theme)`로 이 theme을 받는다.

### typography 토큰 이전 (Martin 확정)

현재 `components/typography/generated/`의 typographyStyles/TypographyVariant를 codegen 출력째 **`theme/generated/`로 이전**. 이유: useTheme이 typography를 담으려면 theme이 소유해야 인버전(theme→components)이 없고, spacing/radius와 나란히 theme이 모든 디자인 토큰을 소유(레이어링 정합). Typography 사이클의 "컴포넌트 콜로케이트" 결정을 뒤집는 것 — 근거는 이제 토큰이 통합 theme 번들의 일부라는 것. 결과: 엔진(lib)은 `@/shared/theme`만 의존(lib→components 소멸). Typography 컴포넌트·Button·ListItem은 `@/shared/theme`에서 typographyStyles/TypographyVariant를 가져오도록 갱신(배럴 재노출로 대부분 흡수).

### 시맨틱 색 경로 (cdk `palette.get(path)` 선례)

```ts
/** 'text.default' | 'background.surface' | 'stroke.subtle' | … — ModeColors에서 타입 유도(수기 유니온 아님) */
export type ColorPath = {
  [G in keyof ModeColors]: `${G & string}.${keyof ModeColors[G] & string}`;
}[keyof ModeColors];

resolveColorPath('text.default', theme): string  // 순수함수
```

그룹 한정(`keyof ModeColors['text']`)이 아닌 경로 방식인 이유: 조합 시 on-color가 그룹을 넘나듦(Chip solid 라벨 = `background.surface`). Typography의 기존 `color` prop(text 그룹 한정)은 그대로 두고, 엔진 아톰은 경로 방식.

### Resolver + withStyleProps

```ts
export type Resolver<P extends object> = {
  props: readonly (keyof P & string)[];         // 소비 prop — 네이티브로 forward 금지(필터링)
  resolve(values: Partial<P>, theme: ThemeContextValue): ViewStyle | TextStyle;  // 순수 — TDD 대상
};

const ChipContainer = withStyleProps(Pressable, {
  base?: ViewStyle | TextStyle,     // 컴포넌트 고정 기하(h32 등) — 병합 첫 순위 정적 스타일
  pressedStyle?: ViewStyle,         // Pressable 계열 전용: pressed 시 병합되는 정적 스타일 (예: {opacity: 0.85})
  resolvers: [color],
});
```

렌더 파이프라인: `useTheme()` → `base` → 각 리졸버 해석 → 병합 → 소비 prop 필터링 → **`style` 탈출구는 병합 마지막**(기존 규약) → Pressable 베이스면 `pressedStyle`을 함수형 style로 병합. 병합부는 순수함수(`composeStyles`)로 분리해 훅 없이 유닛테스트.

초안에 있던 `createVariant`/`resolveVariant`/`styleResolver 함수 슬롯`은 **삭제** — 아토믹 모델에서 variant는 데이터, 고정 스타일은 `base`, 컴포넌트 고유 로직은 조합 코드가 담당하므로 별도 계약이 불필요해짐.

## 4. 첫 소비자: Chip

Figma ground truth: `List/Home > Type=Keywords`(node `3:3541`) 실측 — outline: h32/px14/pill/border 1 `#303030`/텍스트 16·500(=`label-lg`), solid("더 보기"): bg `#a3a3a3`/텍스트 16·400(=`body-lg`) white.

```tsx
// chip.tsx (아톰·variant·조합이 한 파일 — 아톰 비공개)
const ChipContainer = withStyleProps(Pressable, {
  base: {
    height: 32, paddingHorizontal: 14,          // Figma 실측(px14는 스케일 밖 — 원시 px, 시각검증 조정 후보)
    borderRadius: radius.xl,                     // pill
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',  // solid도 1px 투명 보더 유지 — outline과 박스 크기 동일
  },
  pressedStyle: { opacity: 0.85 },               // Button 계승
  resolvers: [color],                            // background / borderColor (경로)
});
const ChipTextLabel = withStyleProps(Text, { resolvers: [font, textColor] });

/** variant 키 규칙(슬롯+속성) 타입 — chip.tsx 로컬 정의 */
type ChipVariantMap = Record<'outline' | 'solid', {
  containerColor?: ColorPath;
  containerBorderColor?: ColorPath;
  textLabelColor: ColorPath;
  textLabelFont: TypographyVariant;
}>;

const chipVariants = {
  outline: { containerBorderColor: 'text.default', textLabelColor: 'text.default', textLabelFont: 'label-lg' },
  solid:   { containerColor: 'text.muted',         textLabelColor: 'background.surface', textLabelFont: 'body-lg' },
} as const satisfies ChipVariantMap;

export function Chip({ label, appearance = 'outline', onPress, style }: ChipProps) {
  const v = chipVariants[appearance];
  return (
    <ChipContainer
      accessibilityRole="button" onPress={onPress}
      background={v.containerColor} borderColor={v.containerBorderColor}
      style={style}
    >
      <ChipTextLabel font={v.textLabelFont} color={v.textLabelColor}>{label}</ChipTextLabel>
    </ChipContainer>
  );
}
```

- **⚠️ 색 토큰 갭(디자인 확인 항목)**: Figma `#303030`/`#a3a3a3`(웹 레거시 팔레트)는 RN 팔레트에 정확 대응 없음(기지 사실). v1 근사 — outline: `text.default`(gray900, 다크 자동 반전) / solid bg: `text.muted`(gray300 `#adadad`, 값 최근접). `text.*`를 bg에 쓰는 시맨틱 왜곡은 **무채색 chip 토큰 신설 여부를 디자인과 협의** 후 교체.
- 공개 API: `{ label, onPress, appearance?: 'outline'|'solid', disabled?, style? }` — Omit&전개 규약 준수. 위치 `src/shared/components/chip/`.

## 5. keyword_cloud 위젯 (세로슬라이스)

- `features/theme/components/keyword-cloud-widget.tsx`: `ListHeader` + flexWrap 행 + `keywords.map(→ Chip)`. `isMore` → `appearance="solid"`.
- `theme-widget.tsx` 스위치 `case 'keyword_cloud'`: `null` → `<KeywordCloudWidget/>` (never 가드가 강제하는 구조 그대로).
- 탭: `link.type==='url'` → 기존 `onPressView` 흐름. `tag_filter`는 목적지 화면 부재로 이번에도 미처리(탭 무시, 후속).
- 홈 화면 무변경.

## 6. 테스트

- `resolvers/*.test.ts` — 순수함수 TDD(색 경로 해석·잘못된 경로 처리, font 스케일 매핑, 미지정 시 무출력).
- `compose-styles.test.ts` — 병합 순서(base→리졸버→style 마지막), 소비 prop 필터링, pressedStyle 병합.
- `chip` — variant 데이터 검증은 타입(satisfies)이 담당, 렌더 테스트 없음(DS 관례). 시각은 시뮬레이터(네이티브 바이너리 이슈 시 Martin 수동 QA — theme 사이클 전례).

## 7. 사이드이펙트

- 기존 컴포넌트(Box/Row/Column/Button/TextField/Typography) **무변경 — 공존**. shared 배럴에 Chip 추가만.
- `features/theme`: keyword-cloud-widget 추가 + 스위치 1케이스 교체(기존 text_only 경로 불변).
- `component-prop-conventions.md`에 아토믹 규칙 §신설.

## 8. 로드맵 (범위 밖)

- **spacing(padding/p·margin/m alias 대칭 — Martin 확정 사항)·radius·sizing 리졸버** + Box/Row/Column 엔진 아톰 마이그레이션(buildLayoutStyle 대체 증명, 첫 소비자와 동시 출하) → Button/TextField 아토믹 재구성(ButtonContainer/ButtonTextLabel/…).
- 레이아웃 리졸버(flex/justify/align), Stack `divider`(cdk), 모듈 증강(둘째 소비 앱).
- variant 보일러플레이트가 3회 반복되면 공통 헬퍼 추출 검토(rule of three).
- `tag_filter` 네비게이션, ChipGroup(선택형 — 폼 패밀리), 무채색 chip 토큰 디자인 협의.
