# 레이아웃 프리미티브 (Box · Row · Column) 설계

2026-07-03 · 브레인스토밍 확정본. [2026-07-03-typography-component-design.md](2026-07-03-typography-component-design.md)에서 확립한 토큰 소비 컴포넌트 패턴의 두 번째 적용.

## 목적

Flutter의 위젯 조립 방식(Container/Row/Column)을 RN에 이식해, 화면 레이아웃을 **토큰이 타입으로 박힌 props를 받는 조립용 컴포넌트**로 구성한다. 핵심 가치: 토큰 소비가 기본 경로가 되고, 이탈은 가시화된다 — spacing은 토큰을 **문자열 키**(`padding="300"` → 24px, 자동완성+오타 컴파일 체크)로, 원시 px는 **숫자**(`padding={10}`)로 받아 따옴표 유무만으로 토큰/의도적 이탈이 호출부에서 구분된다. `radius`/`background`는 토큰 키만 허용(스케일 밖 값 컴파일 차단 유지).

Flutter를 문자 그대로 직역(모든 스타일을 `Padding`/`Center` 래퍼 위젯 중첩으로)하지 않는다 — RN `View`가 이미 flexbox 컨테이너라 트리 깊이만 늘어난다. **얇은 프리미티브 + 토큰 타입 props**(Shopify Restyle, Braid 계열)가 채택 지점.

## 컴포넌트 세트 (A안 확정)

| Flutter | 우리 | 역할 |
|---|---|---|
| `Container` | `Box` | 배경·패딩·radius를 가진 시각적 컨테이너 (나열 의미 없음) |
| `Row` | `Row` | 가로 나열 + gap + 축 정렬 |
| `Column` | `Column` | 세로 나열 + gap + 축 정렬 |
| `SizedBox`(간격) | — 없음 | RN 0.71+ 네이티브 `gap`으로 대체, 별도 Gap 위젯 불필요 |
| `Text` | `Typography` | 완료 (PR #4) |

`Stack`이라는 이름은 사용하지 않는다 — Flutter에서 `Stack`은 z축 겹침 위젯이라 수직 나열에 쓰면 혼동.

## API 명세

### 공유 스타일 props (Box·Row·Column 공통)

```ts
type SpacingKey = `${keyof typeof spacing}`;            // '50' | '100' | … | '1000' — 문자열 리터럴 (Martin 결정)
type RadiusKey = keyof typeof radius;                   // 'xs' | 'md' | 'lg' | 'xl'
type BackgroundKey = keyof ModeColors['background'];    // 'default' | 'surface' | 'inset' | 'highlight' | 'alert'

type SpaceValue = SpacingKey | number;                  // 문자열 = 토큰, 숫자 = 원시 px(의도적 이탈 — 가시적)
type PaddingValue =
  | SpaceValue                                                      // 전 방향
  | readonly [SpaceValue, SpaceValue]                               // [Y, X] — CSS 2-value(상하, 좌우)
  | readonly [SpaceValue, SpaceValue, SpaceValue]                   // [top, X, bottom] — CSS 3-value
  | readonly [SpaceValue, SpaceValue, SpaceValue, SpaceValue];      // [top, right, bottom, left] — CSS 4-value 시계방향

type SharedLayoutProps = {
  padding?: PaddingValue;
  /** padding의 alias. 동시 지정 시 padding(풀네임)이 우선. */
  p?: PaddingValue;
  background?: BackgroundKey; // 모드컬러 → 테마 자동 반응
  radius?: RadiusKey;
  /** 토큰 비관할 레이아웃 전용 탈출구(flex/width/position 등). 병합 순서 마지막. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;       // optional — 빈 장식 컨테이너 허용
} & Omit<ViewProps, 'style' | 'children'>;
```

- padding은 CSS shorthand의 배열 번역(**Martin 제안**), **1/2/3/4-value 완전 대응**(3-value 포함은 Martin 확정): 스칼라=전 방향, `[Y, X]`, `[top, X, bottom]`, `[top, right, bottom, left]` 시계방향 — CSS와 규칙이 동일해 별도 학습 없음. 튜플 유니언 타입이라 5개 이상 등 잘못된 길이는 컴파일 에러. 빌더가 4변으로 정규화해 방출하므로 RN 내부 shorthand 해석에 의존하지 않는다(아래 구현 방식).
- 원시 숫자 허용의 근거: 기존 설계에선 스케일 밖 padding의 정당한 표현 수단이 없었다(`style`은 토큰 관할 속성 금지 정책). 숫자 리터럴은 따옴표가 없어 호출부에서 즉시 드러나는 이탈 — 필요 시 후속으로 숫자 사용을 경고하는 lint 규칙 검토 가능.
- 개별 변 props(`paddingTop` 등)는 미제공 — 한 변만 필요하면 `[0, 0, '100', 0]`. 현재 소비처에 한-변 케이스가 0건이라 YAGNI, 빈번해지면 재논의(**Martin 확정**).
- `paddingStart`/`paddingEnd`(RTL 논리 방향)는 미지원 — 한국어 단일 로케일, 필요해지면 후속.

### Row / Column 전용

```ts
type FlowProps = SharedLayoutProps & {
  gap?: SpaceValue;                       // padding과 동일 정책(문자열=토큰, 숫자=원시 px)
  justify?: ViewStyle['justifyContent'];  // 주축 정렬(분배)
  align?: ViewStyle['alignItems'];        // 교차축 정렬
};
```

- 정렬 네이밍은 CSS/RN 표준 축약 `justify`/`align`(**Martin 결정**). 검토 경과: mainAxis/crossAxis(Flutter 계열), arrange/align(Compose 계열)을 후보로 올렸으나 표준 용어의 무학습 이점을 우선해 확정. flexbox의 justifyContent/alignItems 자체가 축 상대 개념이므로 매핑은 Row/Column 동일: `justify→justifyContent`, `align→alignItems`.
- 값 타입은 `ViewStyle['justifyContent']`/`ViewStyle['alignItems']`에서 유도 — RN 버전업 자동 추종.

### Box 전용

없음. 공유 props만. `gap` 미제공 — 나열 의미는 Row/Column이 소유.

## 정책 결정 기록

1. **style 탈출구 = 토큰 비관할 레이아웃 전용** (Typography 3계층 정책의 연장, 확정안 (a)). 토큰 관할 속성(padding/gap/radius/background)은 props로만 쓴다. 물리적 차단이 아닌 관례+리뷰 강제라는 트레이드오프는 Typography와 동일.
2. **margin 계열 미제공** — 간격은 부모가 `gap`/`padding`으로 소유. margin은 컴포넌트가 자기 바깥 공간을 침범해 재사용성을 깨뜨린다. (placeholder 화면의 `marginTop`이 `gap`으로 치환되는 것이 첫 사례.)
3. **`flex`는 named prop 없이 style로** — 3개 화면 body가 전부 `flex: 1`이라 유혹이 크지만, props 표면 무한 확장(기각된 (b)안)의 시작점이 될 수 있어 v1은 원칙 유지. 사용 빈도를 보고 승격 재논의.
4. **border 계열 미지원** — 현재 border는 전부 `Pressable`(버튼류) 위에 있고 향후 Button 컴포넌트의 관할.
5. **padding은 CSS shorthand 완전 대응 + `p` alias + 문자열 토큰/숫자 원시값** — 개별 변/축 props 없이 `padding` 하나로 통합(**Martin 제안**). `SpacingKey`를 문자열 리터럴(`'100'`)로 두어 원시 px(숫자)와 값 공간이 타입으로 분리된다: `padding="100"`(토큰→8px)과 `padding={100}`(원시 100px)이 모호하지 않다(**Martin 결정**). `p`는 순수 alias, 동시 지정 시 `padding` 우선. `gap`도 동일 정책(SpaceValue) — padding만 숫자를 받으면 API가 자의적이 되므로 일관 적용(테드 판단, 거부 가능).

## 파일 구조

```
src/shared/components/layout/
  layout-style.ts        # 공유 prop 타입 + buildLayoutStyle() 순수 함수 (padding·background·radius·gap 등 토큰 매핑 전담)
  box.tsx / row.tsx / column.tsx
  index.ts               # barrel
  __tests__/layout-style.test.ts
```

- 파일명은 repo 지배 관례인 kebab-case. Typography가 PascalCase 폴더인 건 codegen 생성물 콜로케이션 때문이었고, 여긴 **생성물 없음** — 기존 `theme/generated/`의 spacing/radius/mode-colors를 소비만 한다. codegen 확장 불필요.
- `src/shared/components/index.ts` barrel에 `Box`/`Row`/`Column` + prop 타입 export 추가.
- `src/shared/theme/index.ts` public API에 `SpacingKey`/`RadiusKey` 타입 export 추가 (컴포넌트 API 표면에 노출되는 타입). `SpacingKey`는 `` `${keyof typeof spacing}` `` 템플릿 리터럴 타입으로 숫자 키를 문자열 리터럴 유니언으로 변환 — 생성물(spacing.ts)과 codegen은 무변경. 런타임 조회(`spacing['100']`)는 JS 프로퍼티 접근 그대로이고, TS 타입 성립은 플랜의 typecheck 단계에서 검증(불일치 시 codegen이 키를 따옴표로 방출하도록 조정하는 fallback).

## 구현 방식

- `buildLayoutStyle(props, colors: ModeColors): ViewStyle` — **순수 함수**. 토큰→스타일 매핑을 전부 이 한 곳에 집중(gap 포함).
  - padding은 `padding ?? p`로 입력을 정한 뒤 스칼라/2/3/4-value를 4변으로 해석해 정규화 방출: 출력에는 `paddingTop/Bottom/Left/Right`만 존재하고 shorthand 키는 방출하지 않는다 — RN 내부 우선순위 해석에 대한 의존 제거, 결정적(deterministic) 동작. 배열 지정 시 모든 변을 명시 방출(0 포함).
  - 요소 해석은 `resolveSpace(v) = typeof v === 'string' ? spacing[v] : v` 한 곳으로 통일 — 문자열이면 토큰 조회, 숫자면 원시 px. gap도 동일 함수 사용.
  - 미지정 prop은 키 자체를 방출하지 않는다 (`paddingTop: undefined` 같은 잔여 키 금지).
- Box/Row/Column 셋 다 `View`를 **직접** 렌더하고 빌더만 공유한다. Row가 Box를 감싸는 구조는 배제 — 시스템 스타일이 사용자 `style` 채널에 섞여 병합 순서가 흐려지는 것을 피한다.
- 병합 순서: `[방향·정렬(flexDirection/justifyContent/alignItems), buildLayoutStyle 결과, style]` — 사용자 `style`이 항상 마지막 (Typography와 동일 규칙).
- Column도 `flexDirection: 'column'`을 명시한다 (RN 기본값이지만 명시성 우선).
- `useAppColors()`는 background 지정 여부와 무관하게 항상 호출(훅 규칙). 테마 전환 시 리렌더는 색상 반영에 필요한 동작.
- React 19라 `ref`는 일반 prop — `{...rest}` 패스스루로 자동 전달, forwardRef 불필요.

## 테스트 전략

repo 관례(순수 로직만 유닛테스트, RTL 미도입) 유지. `layout-style.test.ts`:

1. `padding: '300'` → 4변 24 정규화 (토큰)
2. `padding: 10` → 4변 10 (원시 px)
3. `padding: ['100', '300']` → 상하 8, 좌우 24 ([Y, X] 관례)
4. `padding: ['100', '200', '100']` → top 8 / 좌우 16 / bottom 8 (3-value)
5. `padding: ['50', '100', '150', '200']` → top 4 / right 8 / bottom 12 / left 16 (시계방향)
6. `padding: [8, '200', 0]` → 토큰/원시 혼용 + 0 명시 방출
7. `p: '300'` alias 동작 + `padding`과 동시 지정 시 `padding` 우선
8. 미지정 → 빈 객체 (undefined 키 없음)
9. `background: 'surface'` → `colors.background.surface` 값
10. `radius: 'md'` → `borderRadius: 8`
11. `gap: '300'` → 24, `gap: 10` → 10

컴포넌트 렌더는 마이그레이션 후 시뮬레이터 day/night 시각 검증(Typography 때와 동일).

## 마이그레이션 (같은 사이클, 3화면 전체 — Martin 확정)

전부 값 등가 = **시각 diff 0 목표**.

| 화면 | Before | After |
|---|---|---|
| home body | `View` + `{flex:1, padding:300, gap:300}` | `<Column padding="300" gap="300" style={{flex:1}}>` |
| login body | 위 + `justifyContent:'center'` | `<Column padding="300" gap="300" justify="center" style={{flex:1}}>` |
| placeholder body | `padding:300` + caption `marginTop:100` | `<Column padding="300" gap="100" style={{flex:1}}>` — marginTop 삭제, gap이 동일 간격(8px) 재현 |
| home link / login btn | `borderRadius: 8` 수기 값 | StyleSheet 안에서 `radius.md` 치환 (Pressable 구조 불변) |

**불변 항목**: Text 시각 속성(title 24/700, linkText 15/500 — Typography 관할), `Pressable` 구조(Button 관할), `ScreenContainer`(safe area/배경 관심사 별개).

## 사이드이펙트 검토

1. StyleSheet.create → 렌더당 스타일 객체 생성: 화면당 컴포넌트 몇 개 규모라 무시 가능 판단. 성능 민감 화면(리스트 셀 등)이 생기면 측정 후 대응.
2. 모든 프리미티브가 `useAppColors()` 구독 — 테마 전환 시 리렌더는 필요 동작, 기존 화면들도 동일 구조.
3. barrel 확장은 Typography와 동일 구조(theme import)라 순환 참조 없음.
4. 다른 화면/모듈 영향 없음 (신규 컴포넌트 추가 + 3화면 내부 교체).

## 범위 밖 / 후속

- `Gap`/`Spacer` 위젯, `flexWrap`·`reverse` props, `paddingStart/End`(RTL), `flex` named prop 승격 — 사용 데이터 보고 결정
- Button/Card 컴포넌트 (이 프리미티브 위에 조립, 다음 사이클)
- 섀도 토큰, `typography.numeric` 용도 확인 (기존 로드맵 유지)

## 실행 노트

- **브랜치는 PR #4(typography) 머지 후 main에서** 딴다 (Martin 확정) — home-screen.tsx가 양쪽에서 수정되어 충돌 원천 차단.
- git push는 명시 요청 시에만.
