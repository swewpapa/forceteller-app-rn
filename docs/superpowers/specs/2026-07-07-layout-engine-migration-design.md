# Layout 엔진 마이그레이션 (Box/Row/Column → withStyleProps)

> 2026-07-07 브레인스토밍 확정본. 스타일 엔진([[style-engine]], PR #10 머지)의 공유 리졸버를 **첫 실전 소비**로 증명하기 위해, Box/Row/Column을 `buildLayoutStyle` 수동 병합에서 `withStyleProps` 팩토리로 이관한다. 엔진 사이클에서 "다음 사이클로" 미룬 spacing/radius 리졸버가 여기서 출하된다.

## 1. 목표

Box/Row/Column을 `withStyleProps(View, { base?, resolvers })` 기반으로 재작성. 엔진이 `buildLayoutStyle`을 대체함을 증명하고, 공유 리졸버(spacing/gap/backgroundColor/radius/flow)를 확립한다. 공개 API는 보존(색 prop `background`→`color` 리네임 + `margin`/`m` 추가 제외 — 둘 다 소비처 영향 0).

## 2. 확정 결정

| 결정 | 내용 | 근거 |
|---|---|---|
| 색 prop 이름 | `background` → **`color`** | View엔 텍스트색 개념이 없어 `color`=배경 혼동 없음(Martin). `background=` 실사용 0건(코드베이스 유일 사용처 chip.tsx는 엔진 `color` 리졸버라 무관) → free rename |
| 색 값 스코프 | 그룹키 `keyof ModeColors['background']`(예: `'surface'`) | 직전 확정. 레이아웃 배경은 background 시맨틱 그룹에서만(의미적 정합). 소비처 무변경 |
| margin | `margin`/`m`(alias, 풀네임 우선) 추가 | Martin 확정. spacing 리졸버가 padding과 대칭 처리 |
| Chip↔레이아웃 배경 불일치 | **이번 범위 밖(이연)** | Chip은 `background`(ColorPath), 레이아웃은 `color`(그룹키) — Chip의 ColorPath는 무채색 chip 토큰 부재의 임시 우회. 그 토큰 신설 후속에서 양쪽 통일(엔진 배경 리졸버 네임도 그때 정리) |

## 3. 신규 엔진 리졸버 (`src/shared/lib/style-engine/resolvers/`)

| export | props | 값 타입 | → 스타일 |
|---|---|---|---|
| `spacing` | `padding`/`p`, `margin`/`m` | `PaddingValue`(스칼라/[Y,X]/[t,X,b]/[t,r,b,l] shorthand) | `paddingTop/Right/Bottom/Left`, `marginTop/Right/Bottom/Left` (4방향 명시) |
| `gap` | `gap` | `SpaceValue`(SpacingKey \| 원시 px) | `gap` |
| `backgroundColor` | `color` | `keyof ModeColors['background']` (그룹키) | `backgroundColor` |
| `radius` | `radius` | `RadiusKey` | `borderRadius` |
| `flow` | `justify`, `align` | `ViewStyle['justifyContent'/'alignItems']` (토큰 아님, 통과) | `justifyContent`, `alignItems` |

- `SpaceValue`/`PaddingValue` 타입과 padding shorthand 정규화 로직(`resolvePadding`: 4형태 → [t,r,b,l], 원시 px 이탈 허용)은 기존 `layout-style.ts`에서 spacing 리졸버로 이식. margin도 동일 shorthand.
- **전환기 네임 주의(문서화)**: 엔진에 이미 `color` 리졸버(props `background`/`borderColor`, 값 ColorPath, Chip용)가 있고, 신규 `backgroundColor` 리졸버는 prop이 `color`(그룹키). export명↔prop명이 엇갈리는 건 Chip 우회의 잔재 — §2의 이연 항목에서 통일 예정. 각 아톰은 하나만 쓰므로(레이아웃=backgroundColor, Chip=color) 런타임 충돌 없음.
- 미지정 prop은 스타일 키를 방출하지 않는다(리졸버 계약, 기존 buildLayoutStyle 동작 계승).

## 4. 컴포넌트 재구성

```ts
// Box: 시각 컨테이너 — padding/margin/color/radius (gap·flow 없음: 현행 SharedLayoutProps 보존)
export const Box = withStyleProps<BoxTokenProps, ViewProps>(View, {
  resolvers: [spacing, backgroundColor, radius],
});
// Row/Column: + gap·justify·align (현행 FlowProps 보존)
export const Row = withStyleProps<FlowTokenProps, ViewProps>(View, {
  base: { flexDirection: 'row' },
  resolvers: [spacing, gap, backgroundColor, radius, flow],
});
export const Column = withStyleProps<FlowTokenProps, ViewProps>(View, {
  base: { flexDirection: 'column' },
  resolvers: [spacing, gap, backgroundColor, radius, flow],
});
```

- `gap`을 spacing과 별도 리졸버로 둔 이유: Box는 gap 없음(현행 API 보존 — Box=시각 컨테이너, gap은 Row/Column 관할). spacing(padding/margin)은 셋 다 공유.
- `base` flexDirection(정적) + `flow` 리졸버(justify/align) 병합은 composeStyles가 base→리졸버 순으로 처리. `style` 탈출구 마지막 병합·소비 prop 필터링은 팩토리 보장.
- `BoxTokenProps` = spacing+backgroundColor+radius의 prop 합. `FlowTokenProps` = + gap+flow. 각 리졸버 파일이 자기 Props 타입 export, 컴포넌트가 교집합으로 조합.
- **공개 API 보존**: 기존 prop 전부 유지(padding/p/radius/gap/justify/align/style/children/ViewProps 패스스루) + `background`→`color` 리네임 + `margin`/`m` 신규. → 소비처(home/login/theme 위젯 6파일 + shared 내부) 코드 무변경.

## 5. 삭제/이동

- `src/shared/components/layout/layout-style.ts` **삭제**(`buildLayoutStyle`/`resolvePadding`/`resolveSpace` → spacing/gap 리졸버로 흡수, `BackgroundKey` → backgroundColor 리졸버, `SpaceValue`/`PaddingValue` → spacing 리졸버).
- `src/shared/components/layout/index.ts`: 기존 `export type { FlowProps, PaddingValue, SharedLayoutProps, SpaceValue }`는 외부 미사용(grep 확인). 컴포넌트 prop 타입(`BoxProps`/`RowProps`/`ColumnProps`)은 유지 노출, 나머지 내부 타입은 엔진에서 재노출하거나 제거.
- `box.tsx`/`row.tsx`/`column.tsx`는 withStyleProps 호출로 축소(수동 View 조립 제거).

## 6. 테스트

- 신규 리졸버 TDD(`__tests__/` 확장): `spacing`(padding 4형태 + margin 4형태 + p/m alias 우선순위 + 원시 px + 미지정 무방출), `gap`, `backgroundColor`(그룹키 매핑 + 미지정), `radius`, `flow`(justify/align 통과 + 미지정 무방출).
- 기존 `layout-style.test.ts`(158줄) **삭제** — 케이스를 위 리졸버 테스트로 포팅(패딩 정규화가 핵심 자산). `composeStyles`/`withStyleProps`는 엔진 사이클에서 이미 검증됨.
- Box/Row/Column의 `flexDirection`/justify/align 실렌더 + 소비처 회귀는 시각 검증(네이티브 이슈 시 Martin QA 이연 — 전례).

## 7. 사이드이펙트

- 소비처 6파일(home-screen/login-screen/keyword-cloud-widget/theme-widget-list/theme-widget-list-by-code/text-only-widget) + shared 내부(Field/ListHeader 등 Column/Row 사용처) — 계약 보존이라 **코드 무변경**, 전체 테스트로 회귀 확인.
- 엔진 배럴(`style-engine/index.ts`)에 신규 리졸버 5종 export 추가.
- `layout-style.ts` 삭제로 그 파일을 import하던 곳(box/row/column + 배럴) 갱신 필요 — 전부 layout 폴더 내부.

## 8. 범위 밖 (로드맵)

- `sizing` 리졸버(height/width) — Box 현행 API에 없음, 소비자 부재.
- Chip 배경 계약 통일 + 무채색 chip 시맨틱 토큰(엔진 배경 리졸버 네임 정리 포함).
- Button/TextField 아토믹 재구성(ButtonContainer/ButtonTextLabel…).
- **상태 인지 리졸버(Martin 제안, 별도 사이클)**: 현재 `withStyleProps`의 `pressedStyle`은 하드코딩 옵션이라 리졸버 철학과 어긋나고 non-Pressable에 쓰면 조용히 실패하는 footgun이 있음. pressed/focused/disabled 같은 **런타임 상태**를 리졸버 1급 입력으로 승격 — `Resolver.resolve(values, theme, state)`로 계약 확장(또는 별도 상태-리졸버 종류). 레이아웃(pressed 무관) 이후, Chip/Button 아토믹 재구성 때 실사용처와 함께 설계. 확장 시 `pressedStyle` 옵션은 제거/이관.
- Stack `divider`(cdk), 레이아웃 flex 확장(flexGrow/basis 등 리졸버).
- 규약 §8에 "열린 레이아웃 색 prop = `color`(자기 그룹키), 아톰 = 슬롯별 색(Chip `containerColor` 등)" 한 줄 반영.
