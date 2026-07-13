# DS 작은 단위 컴포넌트 — Chip 패밀리 분리 + 신규 5종 설계

**작성일**: 2026-07-13
**대상**: `src/shared/components/` 순수 프리미티브 6종
**Figma**: KR - 포스텔러 - Component Library (`AfXabaxOG38EyU5olW5iaP`)

## Goal

Component Library의 작은 단위 컴포넌트 중 코드에 없는 6종을 DS 프리미티브로 구현한다.
Text Field / Keyword(=Chip)는 기존 컴포넌트가 이미 커버하므로 제외.

## 핵심 결정 — "통합 Chip"이 아니라 "분리"

keyword / tag / tag-label을 한 `Chip`의 variant로 묶는 안을 검토했으나 **분리**로 결정.

**판단 기준(재사용 원칙)**:
- variant가 **룩만** 다르면 → 한 컴포넌트 + variant (Button의 size/color).
- variant가 **행동/시맨틱**(인터랙션·a11y 역할·이벤트 계약)이 다르면 → **분리**.

셋은 행동이 다르다:

| | keyword (`Chip`, 기존) | tag (`TagChip`) | tag-label (`TagLabel`) |
|--|--|--|--|
| 역할 | 내비/표시 (onPress→링크) | 선택 토글 (`selected`) | 정적 status 뱃지 |
| a11y | button/link | selected | text/status (비인터랙션) |
| 상태 축 | 채움(outline/solid) | 선택(bool) | status 색 |

묶으면 `onPress`가 일부 variant에만 의미, `selected`는 tag에만, `appearance`는 tag-label에 안 맞음 → "일부 variant에만 유효한 prop" 부채가 상시화. 또 셋은 독립 진화(뱃지=dot/count, TagChip=multi-select, keyword=remove ×)한다. 그래서 분리.

- 확장성은 상태 색이 열린 유일 케이스인 **`TagLabel`에 injectable color-variant**로 부여.
- 드리프트 우려 시 private `chip-base` 아톰으로 컨테이너만 공유(공개 API 분리, 내부 DRY). 지금은 YAGNI로 보류.
- **`Chip`은 무변경** → 기존 소비처(keyword-cloud, premium tag-widget) 파괴적 변경 0.

## 네이밍

- 컴포넌트 = 도메인 개념("무엇인가") + Figma SSOT 명칭 준수.
- `TagChip`/`TagLabel`은 Figma "Tag Chip"/"Tag Label" 그대로 → Tag* 패밀리 평행성 유지(메커니즘명 SelectChip/Badge 지양).

## 공통 규약

- 위치: `shared/components/<kebab>/`. 파일 kebab-case, export 심볼 PascalCase. 배럴(`shared/components/index.ts`) 등록.
- 스타일은 **`withStyleProps` 엔진 + variant 데이터맵**(Chip 레퍼런스). `build<X>Style(state, colors)` 임퍼러티브 함수는 **지양** — 구 Button/TextField 홀드오버 패턴이라 답습하지 않는다(layout의 `buildLayoutStyle`은 폐지됨). 순수 로직(카운트 포맷·variant 주입 resolve 등)만 유닛테스트.
- 색은 `ColorPath`(스타일 엔진) 또는 `useAppColors()` 경유 → day/night 자동 대응. Figma는 day 기준.
- **onPress-optional 관례**: 상황에 따라 정적/인터랙션인 컴포넌트(`Checkbox`, `ActionButton`, `Likes`)는 `onPress?`/`onChange?` 옵셔널 — 있으면 `Pressable`, 없으면 `View`. 본질적 인터랙션(`LinkText`, `TagChip`)은 필수.
- 레이아웃 탈출구 `style?: StyleProp<ViewStyle>`는 병합 마지막(기존 규약).

## 컴포넌트 6종

### 1. `LinkText` — `link-text/`
- props: `label`, `onPress`, `colored?`(기본 false), `showArrow?`(기본 true)
- colored=true → 텍스트 `text.link` / false → `text.subtle`. 폰트 `label-md`.
- trailing 화살표 `faArrowRight`(pro-light), 텍스트 색 동일, gap `spacing[50]`(4).
- `Pressable` + Row 정렬.

### 2. `TagLabel` — `tag-label/` (비인터랙션 status 뱃지, injectable variant)
- `tag-label-style.ts`: `TagLabelVariant = { background: ColorPath; text: ColorPath }`
  ```ts
  export const tagLabelVariants = {
    default:     { background: 'background.inset',     text: 'text.muted' },
    highlighted: { background: 'background.highlight', text: 'text.default' },
  } satisfies Record<string, TagLabelVariant>;
  ```
- props: `label`, `variant?: TagLabelVariantKey | TagLabelVariant`(기본 'default')
- radius `xs`(2). 폰트/패딩 **빌드 시 get_design_context 실측**(추정 label-sm, h8/v4).
- `View`(비인터랙션).

### 3. `TagChip` — `tag-chip/` (선택 토글 rect 칩)
- Chip 패턴: `withStyleProps` 아톰(container/label) + `tagChipVariants` 데이터맵(컴포넌트 콜로케이션). `-style.ts` 없음.
- props: `label`, `selected`, `onPress`
- height 28, radius `md`(8), 폰트 `label-md`.
- selected → bg `primary.primary` / text `primary.onPrimary`
- unselected → bg 투명 + 1px border `stroke.default` / text `text.subtle`
- `Pressable` + `accessibilityState={{ selected }}`. 패딩 실측.

### 4. `Checkbox` — `checkbox/` (단일 컴포넌트, label 옵셔널)
- LinkText식 인라인: 단일 FA 글리프 + Typography 라벨 + `SIZE` 데이터맵(box/label). `-style.ts` 없음.
- props: `checked`, `onChange?(next)`, `label?`, `size?`('md' 기본 / 'sm'), `checkboxPosition?`('left' 기본 / 'right')
- **label 없으면 박스만 렌더**(아이콘 온리). onChange 없으면 정적.
- 박스: checked → bg `primary.primary` + `faCheck`(pro-solid) `primary.onPrimary` / unchecked → 투명 + 1px border `text.subtle`. radius `xs`. md=20 / sm=16.
- label: `text.default`, 폰트 md→`label-md` / sm→`label-sm`. 박스↔라벨 gap `spacing[100]`(8).
- `checkboxPosition`은 label 있을 때만 유효.

### 5. `ActionButton` — `action-button/` (제네릭 아이콘+라벨)
- props: `icon`(IconDefinition), `label`, `onPress?`, `orientation?`('vertical' 기본 / 'horizontal'), `color?`(ColorPath, 기본 `text.subtle`), `size?`('md' 기본 / 'sm')
- vertical → Column 중앙 / horizontal → Row 중앙. gap `spacing[100]`(8).
- 아이콘·라벨 색 = `color`. 폰트 md→`label-md` / sm→`label-sm`.
- copy/share = 사용처에서 `faCopy`/`faShareNodes`(pro-light) 주입.

### 6. `Likes` — `likes/` (ActionButton 조합)
- props: `count`, `liked?`(기본 false), `size?`('small' / 'large' 기본), `onPress?`
- ActionButton을 `orientation="horizontal"`로 조합:
  - liked=false → `faHeart`(pro-light 아웃라인), color `text.subtle`
  - liked=true → `faHeart`(pro-solid 채움), color `secondary.secondary`
  - label = `count` 천단위 콤마(`9999`→`"9,999"`)
  - size 'small'→ActionButton `sm` / 'large'→`md`. (small weight/폰트 **빌드 시 실측** — Figma는 label sm 참조하나 weight 400 표기 상충)
- count 포맷은 순수 함수 + 테스트.

## 빌드 순서 & 커밋

의존: `ActionButton` → `Likes`. 나머지 독립.

1. 스펙 문서 (커밋 ①)
2. `LinkText` (리졸버 불필요, 단순) — 커밋 ②
3. `TagLabel` (+style+test) — 커밋 ③
4. `TagChip` (+style+test) — 커밋 ④
5. `Checkbox` (+style+test) — 커밋 ⑤
6. `ActionButton` — 커밋 ⑥
7. `Likes` (ActionButton 조합 + count 포맷 test) — 커밋 ⑦

각 커밋 전 `tsc`/`eslint`/관련 테스트 그린 확인. 배럴 등록 포함.

## 사이드이펙트

- **`Chip` 무변경** → keyword-cloud·premium tag-widget 무영향.
- 신규 배럴 export 추가만 → 기존 import 파괴 없음.
- FA는 pro-solid/pro-light 기설치 확인(faHeart/faCopy/faShareNodes/faArrowRight/faCheck 모두 존재). pro-regular 미설치라 아웃라인은 pro-light 사용.

## 빌드 시 실측 필요 (get_design_context)

- `TagLabel` 패딩·폰트·weight
- `TagChip` 패딩
- `Checkbox` 박스 radius·border 두께·체크 아이콘 크기
- `Likes` small 폰트 weight
- `ActionButton` 아이콘 크기·정확한 gap

## 검증

- 유닛테스트: 각 `build<X>Style`/포맷 함수.
- 시각 검증: 시뮬레이터 데모(별도 데모 화면 또는 기존 화면 배치) — Martin 수동 QA로 이연 가능.
