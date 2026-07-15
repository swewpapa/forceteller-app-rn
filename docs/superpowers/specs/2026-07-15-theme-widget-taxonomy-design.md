# theme 위젯/컴포넌트 분류 재정비 설계

작성일: 2026-07-15

## 목표

`features/theme` 내부를 **데이터 결합 축**으로 재조직한다: **위젯 = useQuery가 결합된 컴포넌트**(`widgets/`), **순수(presentational) 컴포넌트 = `components/`**. 순수 컴포넌트에 붙어 있던 `-widget` 접미사를 제거하고, 위젯 이름(`ThemeWidget`)을 실제 query 컴포넌트가 승계한다.

## 비목표

- **premium/today의 동일 패턴 정리** — `PremiumWidget`(순수 디스패처인데 widget 네이밍) 등 같은 미스네이밍이 premium에도 있으나 이번 스코프는 theme만. 후속 작업으로 분리.
- 위젯/변형의 시각·동작 변경 — 순수 구조/네이밍 리팩터. 렌더 결과물은 변경 전후 동일해야 한다.
- `shared/components` 재조직 — shared에는 container가 존재하지 않아 데이터 결합 축의 변별력이 없다. shared는 지금처럼 granularity(컴포넌트 종류)로 조직한다.

## 배경: 무엇이 어긋나 있었나

현재 `theme/components/`는 flat 9파일로, 서로 다른 세 층이 섞여 있다:

1. **query 컨테이너**(`theme-widget-list-by-code`)와 순수 컴포넌트 8개가 같은 폴더에 동거.
2. 순수 변형 4종(`text-only-widget` 등)이 `-widget` 접미사를 달고 있음 — 레거시 웹에서 "widget"이 실제로 지시하던 대상은 **query를 가진 컴포넌트**(`features/section/section.tsx`의 `Section`: `useQuery({queryKey: [section.url]})` 내장)였고, 순수 변형은 접미사 없는 룩 네이밍(`list-text`, `carousel-card`)이었다.
3. `ThemeWidgetListByCode`라는 컴포넌트 이름에 조회 방법(`ByCode`)이 노출 — `docs/architecture.md` 네이밍 표의 "컴포넌트 = 도메인 개념, 데이터 조회 방법이 아니라 개념을 렌더" 원칙 위반.

**어긋남의 뿌리:** 레거시 웹은 섹션마다 자기 url을 fetch해서(섹션 = 컨테이너 1:1) granularity 축과 데이터 축이 우연히 일치했다. RN theme은 쿼리를 리전 단위로 끌어올려(`useThemeListByCode` 1회가 `Theme[]` 반환) 섹션들이 순수 렌더러가 됐는데, 네이밍(`-widget`)은 granularity를 따라 그대로 내려와 두 축이 불일치하게 됐다.

## 원칙 (이번 설계의 축)

- **feature 내부는 데이터 결합 축으로 나눈다**: `useQuery`(또는 store 구독) 유무가 이진 판정 기준. `widgets/` = query 있음, `components/` = props만(전부 mock-free 테스트·재사용 가능).
- **shared는 granularity 축 유지**: container가 없는 레이어라 데이터 축이 무의미.
- 이 원칙은 CLAUDE.md의 "스크린이 훅 호출(컨테이너), 하위 컴포넌트는 presentational" 규칙과 같은 축이다. theme 위젯은 그 규칙의 승인된 예외(리전 독립 로딩을 위해 스크린 아래에서 페칭)이며, `widgets/` 폴더가 그 예외를 구조적으로 표시한다.

## 디렉토리 구조 (확정)

```
theme/
├── widgets/
│   └── theme-widget.tsx        ← 유일한 위젯: useThemeListByCode + 로딩/에러 + 변형 나열
├── components/                  ← 전부 순수 (presentational)
│   ├── theme-renderer.tsx       ← type→변형 디스패처 (구 theme-widget)
│   ├── text-only.tsx
│   ├── keyword-cloud.tsx
│   ├── thumbnail-carousel.tsx
│   ├── full-image-carousel.tsx
│   ├── thumbnail-card.tsx
│   └── full-image-card.tsx
├── api/        (변경 없음)
├── hooks/      (변경 없음 — useThemeListByCode)
├── types/      (변경 없음)
└── index.ts    (배럴 갱신)
```

**`widgets/`가 1파일 폴더인 것에 대해:** 형제 feature 4곳(home/today/premium/more)의 `screens/`가 전부 1파일 폴더다. 이 리포에서 역할 폴더는 파일 수가 아니라 역할 표시로 존재한다. 루트는 모든 feature에서 `index.ts` + 역할 폴더로 통일 유지.

## 심볼 이동 맵

| 현재 | 역할 | 새 심볼 | 새 파일 |
|---|---|---|---|
| `ThemeWidgetListByCode` | **query** | **`ThemeWidget`** (이름 승계) | `widgets/theme-widget.tsx` |
| `ThemeWidget` | 순수 디스패처 | `ThemeRenderer` | `components/theme-renderer.tsx` |
| `ThemeWidgetList` | 순수 나열 | (위젯에 흡수 — 파일 삭제) | — |
| `TextOnlyWidget` | 순수 변형 | `TextOnly` | `components/text-only.tsx` |
| `KeywordCloudWidget` | 순수 변형 | `KeywordCloud` | `components/keyword-cloud.tsx` |
| `ThumbnailCarouselWidget` | 순수 변형 | `ThumbnailCarousel` | `components/thumbnail-carousel.tsx` |
| `FullImageCarouselWidget` | 순수 변형 | `FullImageCarousel` | `components/full-image-carousel.tsx` |
| `ThumbnailCard` / `FullImageCard` | 순수 조각 | 그대로 | `components/` (그대로) |

- 변형 4종의 파일명은 서버 `type` 문자열(`text_only` 등)과 1:1 유지 — grep 추적성.
- `ThemeRenderer`는 레거시 `SectionComponentRenderer`의 축약. `-view` 계열은 `ThemeView` 엔티티(테마 안 아이템)와 충돌하므로 배제.
- Props 타입도 심볼을 따른다: `ThemeWidgetProps`(query 위젯 것으로 승계), `ThemeRendererProps`, `TextOnlyProps` 등.

## 위젯 상세 (`widgets/theme-widget.tsx`)

구 `theme-widget-list-by-code` + 구 `theme-widget-list`를 합친다.

- **공개 표면 유지**: `type ThemeWidgetProps = { code: string; onPressView: (view: ThemeView) => void }` — 홈 사용부와 동일.
- 내부: `useThemeListByCode(code)` → `isPending`(ActivityIndicator) / `isError`(재시도 UI) / 성공 시 `<Column gap="400">{themes.map(t => <ThemeRenderer …/>)}</Column>`.
- **흡수 근거**: 구 리스트는 외부 소비 0곳(배럴 export만 존재), 25줄짜리 Column+map 간접층. 또한 체인에 죽은 prop 배관이 있었다 — 리스트가 노출한 `onPressViewAll`은 아무도 배선하지 않았고, 디스패처의 `onPressKeyword`는 홈 경로에서 항상 no-op. 흡수로 이 배관을 제거한다.
- `ThemeRenderer`의 `onPressViewAll?`/`onPressKeyword?` optional prop은 유지(변형이 이미 소비) — 위젯이 배선하지 않을 뿐, 향후 필요 시 위젯 표면에 추가한다(YAGNI).

## 배럴 (`index.ts`)

```ts
export { ThemeWidget } from './widgets/theme-widget';
export type { Theme, ThemeView, ThemeKeyword, ThemeLink } from './types/theme-types';
```

- `useThemeListByCode` export 제거(외부 소비 0 확인됨 — 위젯이 유일 소비자).
- `ThemeWidgetList` export 제거(외부 소비 0 확인됨).

## 소비처 영향

- `home-screen.tsx` 2줄: `ThemeWidgetListByCode` → `ThemeWidget` (import + JSX). 외부 영향은 이것뿐.
- eslint zone: feature 내부 이동이라 무영향.
- 테스트: 기존 테스트는 api만 참조(`normalize-themes`, `theme-api`) — 무영향. 나머지 경로 오류는 tsc가 잡는다.

## 문서 개정 (같은 PR에 포함)

1. **`docs/architecture.md`** theme 어휘 절(§ "theme 도메인의 엔티티/컴포넌트 분리"):
   - "컴포넌트 = `ThemeWidget*`" → **"위젯 = query 결합 컴포넌트(`ThemeWidget`), 순수 변형 = 룩 네이밍 접미사 없음(`TextOnly`, `ThumbnailCarousel`), 디스패처 = `ThemeRenderer`"**로 재정의.
   - 네이밍 표(§계층별 네이밍 언어)의 컴포넌트 예시(`ThemeWidget`, `ThemeWidgetList`, `TextOnlyWidget`)를 새 심볼로 교체.
   - **feature 내부 폴더 규약 추가**: `widgets/` = useQuery 결합 컴포넌트, `components/` = 순수. (theme이 첫 적용, premium 후속.)
2. **`CLAUDE.md`** theme 도메인 어휘 요약 갱신 (architecture.md가 SSOT, CLAUDE.md는 요약 동기화).

## 커밋 전략 (같은 심볼의 의미 교체로 인한 diff 혼란 방지)

`ThemeWidget`이 커밋 전후로 다른 대상을 가리키므로 3커밋으로 이름 충돌 구간을 없앤다:

1. **커밋 ①** — 순수 쪽 정리: 디스패처 `ThemeWidget`→`ThemeRenderer`, 변형 4종 접미사 탈락. 이 시점에 `ThemeWidget` 이름이 비워진다.
2. **커밋 ②** — 위젯 승격: `theme-widget-list-by-code` → `widgets/theme-widget.tsx`(리스트 흡수 + `ThemeWidget` 승계), `theme-widget-list.tsx` 삭제, 배럴·홈 갱신.
3. **커밋 ③** — 문서 개정 (architecture.md + CLAUDE.md).

각 커밋에서 `tsc --noEmit` + eslint + jest 통과 유지. 파일 이동은 `git mv`로 히스토리 보존.

## 브랜치/순서 제약

- main에서 새 브랜치(예: `refactor/theme-widget-taxonomy`).
- **선행 조건**: 현재 워킹트리의 Martin WIP(`home-screen.tsx` popover 수정, 미커밋)가 커밋된 후 시작 — 이 리팩터도 `home-screen.tsx`를 건드리므로 충돌 방지.

## 기각한 대안

- **granularity 축 분리(widgets/=섹션들, components/=조각들)**: 폴더가 컴포넌트 크기는 말해주지만 "mock 없이 테스트 가능한가"를 보장하지 않음 — query 컨테이너와 순수 변형이 widgets/에 동거하게 됨. 판정도 주관적(디스패처는 섹션인가?).
- **위젯 루트 배치(`theme/theme-widget.tsx`, 레거시 1:1)**: 레거시는 페이지도 루트에 두지만 우리는 이미 `screens/`로 이탈 — RN 리포 관용구는 "루트 = index.ts + 역할 폴더". 형제 feature의 1파일 `screens/` 선례가 `widgets/` 1파일 폴더를 정당화.
- **variant별 서브폴더(`components/text-only/…` + 카드 `-item` 리네임, 레거시 section 최대 충실)**: 4폴더 중 2개가 1파일 — 규모에 안 맞는 기계적 미러링(remote-config 피드백 선례). 변형이 3파일+ 되는 시점에 폴더 승격.
- **순수 리스트(`theme-list.tsx`) 유지**: 소비처 1곳짜리 간접층 + `ThemeList` 심볼은 architecture.md가 타입에서 금지한 중의성 논쟁을 컴포넌트에서 재개함.
