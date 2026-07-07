# 리졸버 바인딩 재설계 — 순수 변환 + 컴포넌트 prop 바인딩

> 2026-07-07 브레인스토밍 확정본. 스타일 엔진(PR #10)·레이아웃 이관(PR #11)에서 드러난 구조 문제의 해소. **PR #11(`feature/layout-engine-migration`)에 이어서 구현**한다 — 재설계가 #11 검수 중 파생됐으므로 별도 PR로 쪼개지 않고 단일 브랜치에 작업 단위별 커밋으로 얹는다(Martin 지시 2026-07-07). #11은 layout 이관 + 이 재설계를 함께 담아 머지. 이 문서는 첫 커밋에 포함. 앞 #11 커밋이 만든 `backgroundColor`/`color` 리졸버는 이 사이클에서 함수형으로 재작성됨(의도된 히스토리).

## 1. 문제 (Martin 제기)

prop 이름은 **컴포넌트의 계약**이다 — Box에서 `color`는 배경, Typography(텍스트 계열)에서 `color`는 글자색. 그런데 현행 엔진은 **리졸버가 prop 이름을 소유**한다:

```ts
// 현행: props 선언 + resolve 본문의 values.color — 이름이 리졸버에 박힘
export const backgroundColor: Resolver<BackgroundColorProps> = {
  props: ['color'],
  resolve(values, theme) {
    return values.color ? { backgroundColor: theme.colors.background[values.color] } : {};
  },
};
```

결과:
- 같은 로직도 prop 이름이 다르면 리졸버를 새로 만들어야 한다 → 확장 제한.
- 실제 발생한 왜곡: `color` 리졸버(prop `background`/`borderColor`, Chip) vs `backgroundColor` 리졸버(prop `color`, 레이아웃)의 **export명↔prop명 X자 교차**.
- 리졸버마다 undefined 가드를 반복 구현(`!== undefined` vs truthy 혼재).

## 2. 해법 한 줄

**리졸버에서 prop 이름을 완전히 제거한다.** 리졸버 = 순수 변환 `(value, theme) → style`. prop 이름 → 변환의 바인딩은 컴포넌트의 `resolvers` 맵이 한다.

```ts
// 엔진: 순수 변환 — prop 이름을 모름
export const background: Resolver<BackgroundKey> = (v, theme) => ({
  backgroundColor: theme.colors.background[v],
});

// 컴포넌트: 이름의 거처. Box에선 color=배경, 텍스트 아톰에선 color=글자색
export const Box = withStyleProps(View, {
  resolvers: { p: padding, padding, m: margin, margin, color: background, radius },
});
```

## 3. 확정 결정

| 결정 | 내용 | 근거 |
|---|---|---|
| Resolver 타입 재정의 | `type Resolver<V> = (value: V, theme: ThemeContextValue) => ViewStyle \| TextStyle` — `{props, resolve}` 객체 폐지 | 이름 소유를 구조적으로 제거. "리졸버" 어휘는 유지(코드베이스 전반에 정착, 함수형이 오히려 이름에 더 부합) |
| 바인딩 = `resolvers` 맵 | `resolvers: { [propName]: Resolver }` — 배열 폐지 | prop 이름이 명시적 설정이 됨. 같은 이름 `color`가 컴포넌트별로 다른 변환에 붙는 게 정상 상태 |
| 커리드 팩토리 기각 | `createStyleResolver(transform)` → `background('color')` 호출 바인딩 안(Martin 제안)은 같은 문제를 풀지만 **미채택** | 엔진 코어 무변경이 장점이나, TokenProps 추론 부재(명시 제네릭 드리프트 존속 — 배열 추론은 UnionToIntersection 곡예)·중복 바인딩 가드 부재. 맵은 중복 키=TS 에러 + 추론 내장. 2026-07-07 비교 후 맵 확정 |
| alias = 이중 키 | `{ p: padding, padding }` — 같은 변환을 두 키에 바인딩. **뒤 선언이 이김**(CSS cascade 동일), 컨벤션: 풀네임을 나중에 | 별도 alias 메커니즘 불필요. 같은 변환 = 같은 스타일 키 집합 전체를 덮어쓰므로 부분 혼합 없음 → padding/p 동시 지정 시 풀네임 우선이라는 현행 공개 계약(`padding ?? p`)과 결과 동일 |
| 무방출 계약 엔진 강제 | `composeStyles`가 `props[key] !== undefined`일 때만 변환 호출 | 리졸버별 가드 반복 제거, 계약 위반 불가능 |
| TokenProps 추론 | `{ [K in keyof R]?: R[K] extends Resolver<infer V> ? V : never }` — 명시적 제네릭 폐지 | PR #10의 "명시적 제네릭, 리졸버와 교차검증 안 함" 트레이드오프 해소. `<Box color=`가 바인딩에서 자동완성 |
| Chip ColorPath 바인딩 콜로케이션 | ColorPath 기반 background/borderColor 변환을 chip.tsx 로컬로 이동, `resolvers/color.ts` 삭제 | ColorPath 배경은 무채색 chip 토큰 부재의 임시 우회 — chip-로컬 부채로 표시. 엔진에서 X-cross 어휘 소멸 |
| pressedStyle 불변 | 옵션 그대로 유지 | 상태 인지 리졸버는 별도 사이클(로드맵), 이번 범위 아님 |

## 4. 신규 엔진 계약

```ts
// resolver.ts
export type Resolver<V> = (value: V, theme: ThemeContextValue) => ViewStyle | TextStyle;

type ResolversMap = Record<string, Resolver<any>>;
type TokenPropsOf<R extends ResolversMap> = {
  [K in keyof R]?: R[K] extends Resolver<infer V> ? V : never;
};

// compose-styles.ts — 맵 순회. base → 바인딩 선언 순(뒤가 이김) → style 탈출구는 팩토리가 마지막 병합
export function composeStyles(
  props: Record<string, unknown>,
  base: AnyStyle | undefined,
  resolvers: ResolversMap,
  theme: ThemeContextValue,
): AnyStyle {
  const style: AnyStyle = { ...(base ?? {}) };
  for (const key of Object.keys(resolvers)) {
    const v = props[key];
    if (v !== undefined) Object.assign(style, resolvers[key](v, theme));
  }
  return style;
}

// with-style-props.tsx — 제네릭 전부 추론(명시 불필요)
export function withStyleProps<R extends ResolversMap, BaseProps extends { style?: StyleProp<any> }>(
  Component: ComponentType<BaseProps>,
  { base, pressedStyle, resolvers }: { base?: AnyStyle; pressedStyle?: ViewStyle; resolvers: R },
) {
  const consumed = new Set(Object.keys(resolvers)); // collectResolverProps 대체
  function StyledComponent(
    props: TokenPropsOf<R> & Omit<BaseProps, 'style'> & { style?: StyleProp<AnyStyle> },
  ) { /* 현행과 동일: composeStyles → consumed 필터 → style 병합(pressed 함수형 포함) */ }
  return StyledComponent;
}
```

- **불변식 유지**: composeStyles는 신선한 accumulator에 복사한다 — 변환 반환 객체를 절대 변형하지 않음(`font`가 공유 typography 참조를 반환).
- 리졸버 출력 간 스타일 키 충돌은 alias 외엔 정당한 케이스가 없음. 동시 지정 경고는 추가하지 않는다(현행 `??`도 조용히 우선순위 처리 — 패리티). alias 우선순위는 테스트로 고정(§7).
- **구현 초기 검증 항목**: TS가 `View`/`Pressable`/`Text`에서 `BaseProps`를 추론하는지(부분 제네릭 명시는 TS에 없으므로 전부 추론이어야 함). 실패 시 폴백 = 커리드 API `withStyleProps(View)({...})` — 스펙 수준에선 추론 성공을 전제.

### 4.1 성능 계약 (A+B, 2026-07-07 Martin 승인 — 바인딩 전환 커밋과 분리된 후속 커밋)

배경: 토큰 prop이 불변이어도 매 렌더 `composed` 객체·`[composed, style]` 배열이 새 identity → RN이 커밋마다 스타일 re-flatten/diff. `resolveColorPath`는 호출마다 `split('.')` 배열 할당(절대 비용은 마이크로초 오더로 미미하나 상한 보장 차원).

- **A. composed 스타일 memoization**: `withStyleProps` 내부에서 composed와 styleValue의 identity를 안정화. 소비 키 집합은 팩토리 시점 고정이므로 deps 길이 불변. **`useMemo` + spread deps 대신 ref 기반 shallow-compare 모듈 프라이빗 훅**을 쓴다(eslint exhaustive-deps 억제 불필요 + React의 "useMemo는 잊을 수 있다" 시맨틱 회피). theme identity는 provider의 `useMemo`가 보장(theme-provider.tsx 확인됨 — 모드 변경 시에만 변화). 한계(문서화): `padding={['100', 14]}` 인라인 배열 shorthand는 렌더마다 새 identity라 memo 미스 — 현행과 동일 비용, 회귀 아님.
- **B. ColorPath 플랫 테이블**: `resolveColorPath`를 `WeakMap<ModeColors, Record<string, string>>` 캐시로 — 모드별 colors 객체당 1회 flatten(`'text.default'→'#191919'`) 구축 후 split/할당 0, 단일 lookup. 시그니처 불변(호출부 무변경). day/night colors는 모듈 레벨 상수라 WeakMap 키로 안정.
- 측정 선행은 하지 않음(현 소비 규모에선 노이즈 수준 전망 + 두 항목 모두 이론적으로 명백·저비용). 실측은 리스트 스케일 소비자가 생기는 시점의 숙제.

## 5. 공유 변환 카탈로그 (`resolvers/`)

전부 `Resolver<V>` 타입 어노테이션으로 선언(파라미터 타입은 어노테이션에서 추론):

| export | V (값 타입) | 방출 | 파일 |
|---|---|---|---|
| `background` | `BackgroundKey` = `keyof ModeColors['background']` | `backgroundColor` | background.ts (← background-color.ts 리네임, 전환기 주석 삭제) |
| `textColor` | `ColorPath` | `color` | text-color.ts |
| `font` | `TypographyVariant` | 타입스케일 묶음(TextStyle) | font.ts |
| `padding` | `PaddingValue` | paddingTop/Right/Bottom/Left | spacing.ts (resolveEdges·SpaceValue·PaddingValue 유지) |
| `margin` | `PaddingValue` | marginTop/Right/Bottom/Left | spacing.ts |
| `gap` | `SpaceValue` | gap | gap.ts |
| `radius` | `RadiusKey` | borderRadius | radius.ts |
| `justify` | `ViewStyle['justifyContent']` | justifyContent | flow.ts |
| `align` | `ViewStyle['alignItems']` | alignItems | flow.ts |

- `spacing`(4 prop 복합)·`flow`(2 prop 복합) 리졸버는 **분해되어 소멸** — alias 병합은 바인딩 이중 키가, 독립 prop은 개별 변환이 담당.
- 삭제: `resolvers/color.ts`(chip 콜로케이션), `collectResolverProps`.
- 배럴: 변환 9종 + `Resolver`/`ColorPath`/`resolveColorPath` + 값 타입(`SpaceValue`/`PaddingValue`/`BackgroundKey`). 리졸버별 `*Props` 타입 export(`SpacingProps` 등)는 TokenProps 추론으로 존재 이유 소멸 — 외부 사용처 grep 후 제거(플랜에서 확정).
- 네임충돌 주의(기존 관례 재사용): 변환 `radius`/`gap` vs 토큰 스케일 import — 소비 파일에서 `radius as radiusScale` 식 alias.

## 6. 컴포넌트 바인딩

```ts
// box.tsx — 명시적 제네릭 사라짐
export const Box = withStyleProps(View, {
  resolvers: { p: padding, padding, m: margin, margin, color: background, radius },
});
export type BoxProps = ComponentProps<typeof Box>; // 유지

// row.tsx / column.tsx — Box 바인딩 + gap/justify/align, base flexDirection
export const Row = withStyleProps(View, {
  base: { flexDirection: 'row' },
  resolvers: { p: padding, padding, m: margin, margin, gap, color: background, radius, justify, align },
});

// chip.tsx — ColorPath 변환은 로컬 상수(임시 우회의 거처 명시)
const chipBackground: Resolver<ColorPath> = (v, theme) => ({ backgroundColor: resolveColorPath(v, theme) });
const chipBorderColor: Resolver<ColorPath> = (v, theme) => ({ borderColor: resolveColorPath(v, theme) });

const ChipContainer = withStyleProps(Pressable, {
  base: { /* 현행 유지 */ },
  pressedStyle: { opacity: 0.85 },
  resolvers: { background: chipBackground, borderColor: chipBorderColor },
});
const ChipTextLabel = withStyleProps(Text, { resolvers: { color: textColor, font } });
```

- **소비처(화면/위젯) diff 0**: Box/Row/Column/Chip의 공개 prop 표면 완전 동일(`padding`/`p`/`margin`/`m`/`gap`/`color`/`radius`/`justify`/`align`, Chip `appearance`/`label`).
- 레이아웃 3종의 공통 바인딩 중복은 허용(6키 리터럴, 추출은 YAGNI — 셋뿐이고 Box는 부분집합).

## 7. 테스트

- 변환 단위 테스트: 기존 리졸버 테스트를 값 레벨로 포팅(`padding('300')` → 4변 등 — values 객체 조립이 사라져 더 단순).
- `composeStyles`: 맵 순회·무방출 가드·alias 뒤-선언-우선·base 병합 순서·신선 accumulator(복사) 재검증.
- `withStyleProps`: consumed 필터·style 탈출구·pressed 함수형 — 기존 케이스 유지.
- **TokenProps 추론 음성 계약**: `@ts-expect-error`로 `<Box color="잘못된키">`·미바인딩 prop 거부 검증(기존 음성계약 관례).

## 8. 사이드이펙트

- 수정: 엔진 4파일(resolver/compose-styles/with-style-props/배럴) + resolvers 8파일 전부(색 1 삭제·1 리네임, 나머지 6 함수형 재작성) + 컴포넌트 3파일(box/row/column) + chip.tsx + 테스트.
- 소비처·시각 결과 무변경(순수 구조 리팩토링) — 게이트(test/tsc/eslint)가 회귀 커버, 시각 QA 불필요 수준이나 관례대로 Martin 재량.
- 규약 문서 `component-prop-conventions.md` §8: 아톰/리졸버 서술을 "바인딩 맵" 모델로 갱신, X-cross 전환기 노트 삭제(해소됨).
- 메모리/스펙 상호참조: style-engine 문서의 "전환기 네임 엇갈림" 항목 해소 기록.

## 9. 범위 밖 (로드맵 유지)

- 무채색 chip 시맨틱 토큰 + Chip 배경 값 모델(ColorPath→그룹키) 통일 — 그때 chip이 공유 `background`로 재바인딩.
- 상태 인지 리졸버(pressed/focused/disabled) — `pressedStyle` 대체는 그 사이클에서.
- 두 prop을 함께 봐야 하는 조인트 변환 — 현재 케이스 0, 필요 시 그때 확장.
- sizing 변환(width/height).
