# Premium List (서버드리븐 위젯 리스트) 설계

> 2026-07-08 브레인스토밍 확정본. `premium` 탭(현재 `PlaceholderScreen`)에 서버드리븐 위젯 리스트를 구현한다. theme widget([[theme-widget-feature]]) 패턴을 **독립 feature로 복제**하고, 가로 스크롤 셸 `CarouselFrame`을 **shared `Carousel`로 승격**해 공유한다. [[style-engine]] 소비, [[component-prop-conventions]] 아토믹 조합, [[pr-workflow]] 적용.

## 1. 목표

- `premium` feature 구축: `/api/premium/list/v2`를 self-fetch해 위젯 리스트 렌더. `PremiumScreen` = PlaceholderScreen → 실제 리스트.
- 위젯 렌더러: `rank`/`general`/`banner`/`carousel`/`button`/`tag` (6 type).
- shared `Carousel`(← `carousel-frame.tsx` 승격/리네임) — theme carousel 위젯들도 이걸 소비하도록 갱신.

## 2. API · 데이터 (실측 2026-07-08)

`GET https://api-dev.gc.forceteller.com/api/premium/list/v2` — **인증 불필요**(theme와 동일, dev 200). `{ status, data }` 봉투, `data` = 위젯 배열(실측 9개, 6 type).

**위젯 공통 형태**: `{ id, type, title, status, items[], extra }`.
- `type`: 렌더러 지시자(rank/general/banner/carousel/button/tag).
- `title`: 위젯 헤더 제목. `extra.subTitle`: 부제목(빈 문자열 가능).
- `items[]`: 콘텐츠 아이템(banner는 없음).
- `extra`: type별 부가 데이터(`listType`, `subTitle`, banner 이미지, thumbnail 크기 등).

**아이템 공통 형태**: `{ id, type, link, title, subtitle, thumbnailImage, price? }`.
- theme `ThemeView`와 유사하나 **다름**: `viewId`/`label`/`isNew`/`fullImage` 없음, `price`(general 상품)·아이템 `type` 있음.
- `link` 구조는 구현 태스크에서 실측(theme `ThemeLink` = url/tag_filter 대응 여부 확인).

**type별 실측**:
| type | 개수 | 특징 |
|---|---|---|
| `rank` | 1 | 실시간 HOT — 순위 리스트 |
| `general` | 2 | **Large 디자인**, 아이템에 `price`(프리미엄 상품) |
| `banner` | 1 | **items 없음**, `extra.bannerImage` + `extra.bannerBgColor`(이미지 배너) |
| `carousel` | 3 | `extra.thumbnailWidth/Height`(문자열 px, **세로 포스터** — 180×200, 72×112) |
| `button` | 1 | 버튼형 아이템(타로 상담소) |
| `tag` | 1 | 태그 그리드(Figma상 큰 높이) |

## 3. 데이터 모델 (`premium/types/premium-types.ts`)

theme 선례대로 discriminated union + 렌더 불가 드롭.

```ts
export type PremiumLink = /* 구현 태스크에서 API 실측 (theme ThemeLink = url|tag_filter 대응 확인) */;

/** 위젯 아이템 공통. price는 general(상품) 전용. */
export type PremiumItem = {
  id: number;
  title: string;
  subtitle: string | null;
  thumbnailImage: string | null;
  link: PremiumLink;
  price: number | null;        // general만 non-null (구현 시 형식 실측)
};

type PremiumBase = { id: number; title: string; subtitle: string | null };

export type Premium =
  | (PremiumBase & { type: 'rank'; items: PremiumItem[] })
  | (PremiumBase & { type: 'general'; items: PremiumItem[] })
  | (PremiumBase & { type: 'banner'; image: string; bgColor: string })   // items 없음
  | (PremiumBase & { type: 'carousel'; items: PremiumItem[]; thumbnail: { width: number; height: number } })
  | (PremiumBase & { type: 'button'; items: PremiumItem[] })
  | (PremiumBase & { type: 'tag'; items: PremiumItem[] });
```

- `normalize-premium.ts`: raw(문자열 px, extra 중첩) → 도메인 union. `thumbnailWidth/Height` 문자열→number, banner image/bgColor를 extra에서 승격, 렌더 불가(link 없음/이미지 없음/unknown type) 드롭. raw 타입은 배럴 반출 금지.
- 정확한 raw 필드/형식(price 타입, link 구조, rank 순위 필드, tag 구조)은 **구현 Task에서 API JSON 재실측** 후 확정.

## 4. 위젯 6종 + Figma 매핑

Figma "Premium List"(node 5:1325 아님 — `997:7359`) variant ↔ 서버 type. **정밀 디자인은 구현 Task에서 `get_design_context` 실측**(carousel 사이클 선례).

| 서버 type | Figma variant | 렌더러 | 재사용 |
|---|---|---|---|
| `general` | Large (997:7358) | `GeneralWidget` — 큰 카드 + price | AspectRatio/Image, ListHeader |
| `rank` | Rank (997:7360) | `RankWidget` — 순위 행 | ListHeader, (순위 배지) |
| `carousel` | Carousel (997:7886) + Type6 (997:10296) | `CarouselWidget` — 세로 포스터 가로 스크롤 | **shared Carousel** + AspectRatio/Image |
| `button` | Button (997:9157) | `ButtonWidget` | Button, ListHeader |
| `tag` | Tag (997:9856) | `TagWidget` — 태그 그리드 | Chip, ListHeader |
| `banner` | (Figma 확인) | `BannerWidget` — `bgColor` 배경 + `bannerImage` | Image, raw hex 배경 |

- premium `carousel`은 서버 `thumbnail.width/height`로 `AspectRatio ratio={w/h}` 계산(theme는 고정, premium은 서버 드리븐). Carousel 셸(renderItem 주입)은 도메인 무관이라 공유, 카드(`PremiumCarouselCard`)는 premium 전용.
- **Figma Carousel/Type6 두 variant 모두 이 `CarouselWidget` 하나로 흡수**(Martin 확정): Type6도 carousel이고 `thumbnail.width/height`로 그린다 — 별도 Type6 렌더러 없음.
- `banner`: `extra.bannerImage`를 `Image`로 그리고, `extra.bannerBgColor`(서버 hex)를 배경색으로. bgColor는 토큰 아닌 raw hex라 `View style={{ backgroundColor }}` 탈출구(ListItem `labelColor` 선례). 정밀 레이아웃(이미지 fit/배경 관계)은 구현 Task Figma 실측.

## 5. 구조 (파일)

```
src/shared/components/
  carousel/carousel.tsx            ← carousel-frame.tsx 승격·리네임 (Carousel)
  index.ts                         ← Carousel export 추가
src/features/theme/components/
  thumbnail-carousel-widget.tsx    ← import를 shared Carousel로 갱신
  full-image-carousel-widget.tsx   ← 〃
  (carousel-frame.tsx 삭제)
src/features/premium/
  types/premium-types.ts
  api/premium-api.ts               ← createPremiumApi(client) + 싱글턴
  api/normalize-premium.ts
  hooks/usePremiumList.ts          ← react-query self-fetch
  components/premium-widget.tsx    ← type 스위치 (never 가드)
  components/{general,rank,carousel,button,tag,banner}-widget.tsx
  components/premium-carousel-card.tsx
  index.ts                         ← 배럴
  screens/premium-screen.tsx       ← PlaceholderScreen 교체
```

- **레이어**: premium은 독립 feature. theme import 금지(레이어 규칙) — 공유가 필요한 Carousel을 shared로 승격해 해결. shared DS만 소비.
- `create<Domain>Api` 팩토리 + 싱글턴(auth/today/theme 정합). normalize 경계. switch `never` exhaustiveness.

## 6. Carousel 승격 (shared)

`features/theme/components/carousel-frame.tsx`(현 비공개) → `shared/components/carousel/carousel.tsx`의 **`Carousel`**. 계약 불변(generic `title`/`subtitle`/`data`/`keyExtractor`/`renderItem`, ListHeader + 가로 FlatList, 엣지투엣지 marginHorizontal 상쇄). theme의 두 carousel 위젯이 import 경로만 shared로 갱신(동작 불변). 네이밍 근거: `Frame`은 임의어·`Container`는 §8 아톰 셸/ScreenContainer로 예약 → 접미사 없는 `Carousel`(DS의 캐러셀 그 자체).

## 7. 미해결 / 구현 태스크에서 확정

- **Type6**: Figma에 자동 크기 carousel variant(997:10296)로 존재하나 **서버 데이터에 type6 없음**(carousel 3개 다 thumbnail 크기 지정). 구현 Task에서 Figma Type6 실측 후 — ⓐ carousel 렌더러에 "크기 자동" 분기로 흡수 ⓑ forward-compat로 보류(normalize에서 미지원 type 드롭) 중 확정. 현 데이터로는 렌더 경로 없음.
- **raw 필드 정밀**: price 타입/통화, link 구조(url/tag_filter), rank 순위 필드, tag 아이템 구조, banner extra 정확 키 — 구현 Task 첫 단계에서 `premium-list.json` 재실측 + `get_design_context`.
- **premium 탭 진입 시 fetch**: 홈 3리전과 달리 premium은 단일 화면 1쿼리(self-fetch 컨테이너 1개). 세로 가상화(FlashList 등)는 범위 밖(위젯 수 9개, 필요 시 후속).

## 8. 사이드이펙트

- `CarouselFrame` → shared `Carousel` 이동으로 theme carousel 위젯 2개 import 갱신(동작 불변, 게이트로 회귀 확인). `carousel-frame.tsx` 삭제.
- shared 배럴에 `Carousel` 추가. premium feature 신설(배럴 + 탭 스크린 교체).
- 네비게이션: `PremiumScreen`이 이미 탭에 등록됨 — 내용만 교체(라우팅 무변경).
- premium은 신규 feature라 기존 소비처 영향 없음(theme carousel import 갱신만 예외).

## 9. 테스트

- `normalize-premium` 단위 테스트(raw→union, 문자열 px 변환, banner 승격, 렌더 불가 드롭, unknown type 드롭) — theme normalize 선례.
- `premiumApi` 팩토리(생성자 주입) 테스트.
- 위젯 렌더/스위치 도달·`never` 가드 — tsc.
- 실렌더·이미지·스크롤은 시각 QA(RNGoogleSignin 네이티브 이슈 시 Martin QA 이연 — 전례).

## 10. 범위 밖 (로드맵)

Type6 자동 carousel(데이터 생기면), price 포맷팅/통화 정책, tag_filter 네비게이션, premium 세로 가상화(FlashList — 위젯 늘면), rank 순위 애니메이션, banner 링크 동작.
