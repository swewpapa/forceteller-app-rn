# Premium List 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development(권장) 또는 executing-plans. Steps는 checkbox 추적.

**Goal:** `premium` 탭에 `/api/premium/list/v2` 서버드리븐 위젯 리스트(6 type) 구현. theme widget 패턴 복제 + `CarouselFrame`을 shared `Carousel`로 승격.

**Architecture:** shared `Carousel`(승격) → premium feature(types/api/normalize/hook/위젯 6종/스위치/screen). `create<Domain>Api` 팩토리 + normalize 경계 + `never` 가드 + self-fetch. 스펙 `docs/superpowers/specs/2026-07-08-premium-list-design.md`.

**Tech Stack:** RN, react-query(self-fetch), 스타일 엔진, shared DS(AspectRatio/Image/Button/Chip/ListHeader/Carousel), Figma(위젯 정밀 실측).

**데이터 실측 요약** (`/api/premium/list/v2`, 인증 불필요):
- 위젯: `{ id, type, title, status, items[]|tags[], extra }`. type: rank/general/banner/carousel/button/tag.
- 아이템: `{ id, title, subtitle, thumbnailImage, price?, type, status, link }`. price=general/rank만.
- link: `{type:'url', value}` (아이템) / `{type:'api', value, params.queryParams.keyword}` (tag).
- banner: items 없음, `extra.bannerImage` + `extra.bannerBgColor`(#hex).
- carousel: `extra.thumbnailWidth/Height`(문자열 px, 세로 포스터). Figma Carousel+Type6 흡수.
- tag: items 대신 `tags[]`(`{text, link:api}`, 22개).

---

## Task 0: 브랜치 + 문서 커밋

- [ ] **Step 1**: `git checkout -b feature/premium-list main`(origin/main 최신 pull 후)
- [ ] **Step 2**: 문서 커밋(scoped)
```bash
git add docs/superpowers/specs/2026-07-08-premium-list-design.md docs/superpowers/plans/2026-07-08-premium-list.md
git commit -m "docs(premium): premium list 스펙·플랜

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1: `CarouselFrame` → shared `Carousel` 승격 (커밋 ②)

**Files:**
- Create: `src/shared/components/carousel/carousel.tsx` (← carousel-frame.tsx 이동)
- Modify: `src/shared/components/index.ts`(Carousel export), `theme/components/thumbnail-carousel-widget.tsx`·`full-image-carousel-widget.tsx`(import 갱신)
- Delete: `src/features/theme/components/carousel-frame.tsx`

- [ ] **Step 1**: `carousel-frame.tsx` 내용을 `shared/components/carousel/carousel.tsx`로 이동, export명 `CarouselFrame`→`Carousel`, 타입 `CarouselFrameProps`→`CarouselProps`. 로직/계약 불변(generic title/subtitle/data/keyExtractor/renderItem, ListHeader + 가로 FlatList, marginHorizontal 상쇄).
- [ ] **Step 2**: shared 배럴에 `export { Carousel, type CarouselProps } from './carousel/carousel';`
- [ ] **Step 3**: theme 두 위젯 import를 `import { CarouselFrame } from './carousel-frame'` → `import { Carousel } from '@/shared/components'`, JSX `<CarouselFrame>`→`<Carousel>`.
- [ ] **Step 4**: `git rm src/features/theme/components/carousel-frame.tsx`
- [ ] **Step 5**: 게이트 — `pnpm test`(138 유지, theme carousel 무변경 회귀), `pnpm exec tsc --noEmit` 0, `pnpm exec eslint . --max-warnings=0`. 소비처(theme 두 위젯) 동작 불변.
- [ ] **Step 6**: 커밋 `refactor(components): CarouselFrame → shared Carousel 승격`

---

## Task 2: premium types + normalize (커밋 ③ TDD)

**Files:** Create `premium/types/premium-types.ts`, `premium/api/normalize-premium.ts`, Test `premium/__tests__/normalize-premium.test.ts`

- [ ] **Step 1: 타입** `premium-types.ts`
```ts
export type PremiumLink =
  | { type: 'url'; value: string }
  | { type: 'api'; value: string; keyword: string };

/** 위젯 아이템. price는 general/rank만 non-null. */
export type PremiumItem = {
  id: number;
  title: string;
  subtitle: string | null;
  thumbnailImage: string | null;
  price: number | null;
  link: PremiumLink;
};

export type PremiumTag = { text: string; link: PremiumLink };

type PremiumBase = { id: number; title: string; subtitle: string | null };

export type Premium =
  | (PremiumBase & { type: 'rank'; items: PremiumItem[] })
  | (PremiumBase & { type: 'general'; items: PremiumItem[] })
  | (PremiumBase & { type: 'banner'; image: string; bgColor: string })
  | (PremiumBase & { type: 'carousel'; items: PremiumItem[]; thumbnail: { width: number; height: number } })
  | (PremiumBase & { type: 'button'; items: PremiumItem[] })
  | (PremiumBase & { type: 'tag'; tags: PremiumTag[] });
```
- [ ] **Step 2: 실패 테스트** — raw 픽스처(scratchpad `premium-list.json`에서 발췌: 각 type 1개 + 렌더불가 케이스)로 `normalizePremiumList(raw)` 검증: url/api link 변환, 문자열 px→number(thumbnail), banner image/bgColor 승격, price null 처리, unknown type·link 없음·image 없음 드롭.
- [ ] **Step 3: 구현** `normalize-premium.ts` — raw→`Premium[]`. link: `params.queryParams.keyword`→평탄화. `extra.thumbnailWidth/Height`(string)→`{width,height}`(number). banner는 `extra.bannerImage`(없으면 드롭)+`bannerBgColor`. tag는 `tags[]`. raw 타입은 파일 안에서만(배럴 반출 금지).
- [ ] **Step 4**: 게이트(jest/tsc/eslint) — 정확한 raw 필드는 이 단계에서 `scratchpad/premium-list.json` 재확인하며 매핑.
- [ ] **Step 5**: 커밋 `feat(premium): Premium 타입 + normalize (TDD)`

---

## Task 3: premium api 팩토리 + usePremiumList (커밋 ④)

**Files:** Create `premium/api/premium-api.ts`, `premium/hooks/usePremiumList.ts`, Test `premium/__tests__/premium-api.test.ts`

- [ ] **Step 1**: `createPremiumApi(client)` + 싱글턴 — theme `themeApi` 선례(`listV2()` → GET `/api/premium/list/v2`, normalize 적용). 생성자 주입 테스트.
- [ ] **Step 2**: `usePremiumList()` — react-query(`useThemeListByCode` 선례, queryKey `['premium','list']`).
- [ ] **Step 3**: 게이트 + 커밋 `feat(premium): premiumApi 팩토리 + usePremiumList`

---

## Task 4: 위젯 rank/general/banner (커밋 ⑤)

정밀 디자인은 `get_design_context`로 실측(Figma 997:7360 rank, 997:7358 general/Large, banner Figma 노드). presentational.

**Files:** Create `premium/components/{rank,general,banner}-widget.tsx`

- [ ] **Step 1: Figma 실측** — `get_design_context`(forceCode)로 rank/general/banner variant 치수·레이아웃·타이포·price 표기 확정.
- [ ] **Step 2: general-widget** — Large 카드(ListHeader + 큰 썸네일 + title/subtitle + **price**). AspectRatio/Image, Typography.
- [ ] **Step 3: rank-widget** — 순위 리스트(ListHeader + 순위 배지 + 아이템). 실측 기반.
- [ ] **Step 4: banner-widget** — `View`(배경 `bgColor` raw hex) + `Image`(bannerImage). ListHeader 유무 실측.
- [ ] **Step 5**: 게이트 + 커밋 `feat(premium): rank/general/banner 위젯`

---

## Task 5: 위젯 carousel/button (커밋 ⑥)

**Files:** Create `premium/components/{carousel,button}-widget.tsx`, `premium/components/premium-carousel-card.tsx`

- [ ] **Step 1: Figma 실측** — Carousel(997:7886)/Type6(997:10296)/Button(997:9157) 치수·레이아웃.
- [ ] **Step 2: premium-carousel-card** — `AspectRatio ratio={thumbnail.width/thumbnail.height}` + `Image`. 서버 크기(세로 포스터).
- [ ] **Step 3: carousel-widget** — shared `Carousel`(renderItem=PremiumCarouselCard). Figma Carousel/Type6 흡수(thumbnail W/H로 크기).
- [ ] **Step 4: button-widget** — Button/ListHeader 조합, 실측 기반.
- [ ] **Step 5**: 게이트 + 커밋 `feat(premium): carousel/button 위젯`

---

## Task 6: 위젯 tag + 스위치 + 배럴 (커밋 ⑦)

**Files:** Create `premium/components/tag-widget.tsx`, `premium/components/premium-widget.tsx`, `premium/index.ts`

- [ ] **Step 1: Figma 실측** — Tag(997:9856) 그리드 레이아웃.
- [ ] **Step 2: tag-widget** — `Chip` 그리드(tags[], wrap). Chip 재사용. 태그 탭은 api link(keyword) — 네비 목적지 부재라 no-op 콜백(theme keyword 선례, 범위 밖).
- [ ] **Step 3: premium-widget** — type 스위치(rank/general/banner/carousel/button/tag), `never` 가드. onPress 핸들러(url link → Web 네비).
- [ ] **Step 4: 배럴** `premium/index.ts` — `PremiumScreen` + 필요 export.
- [ ] **Step 5**: 게이트 + 커밋 `feat(premium): tag 위젯 + 위젯 스위치`

---

## Task 7: PremiumScreen 통합 + 최종 리뷰 + finishing

**Files:** Modify `premium/screens/premium-screen.tsx`

- [ ] **Step 1: PremiumScreen** — `PlaceholderScreen` → `ScreenContainer` + `ScrollView` + `usePremiumList` self-fetch + `premium.map(PremiumWidget)`(로딩/에러 처리, theme `ThemeWidgetListByCode` 선례). url link → `navigation.navigate('Web', ...)`.
- [ ] **Step 2: 게이트** — `pnpm test`/`tsc`/`eslint`.
- [ ] **Step 3: 최종 통합 리뷰** — main..HEAD 전체. 스펙 정합, Carousel 승격 회귀(theme 무변경), normalize 정확, 위젯 6종, 스위치 never, 소비처.
- [ ] **Step 4: 시각 검증** — `pnpm ios` 빌드 후 premium 탭 렌더(위젯 6종·이미지·price·태그 그리드·carousel 세로 포스터). RNGoogleSignin 이슈 시 Martin QA 이연.
- [ ] **Step 5: finishing-a-development-branch** — push+PR은 **Martin 명시 승인 후**.

---

## 범위 밖 (로드맵)

tag 키워드 필터 네비(api link 목적지), price 통화 포맷, premium 세로 가상화(FlashList), banner 링크, rank 순위 애니메이션, `/api/premium/fetch`(태그 필터 결과).
