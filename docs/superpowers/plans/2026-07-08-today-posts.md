# Today Posts Phase 1 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps는 checkbox(`- [ ]`) 추적.

**Goal:** `today` 탭을 `/api/today/posts` 서버드리븐 포스트 피드로 전면 재작성. **Phase 1 = 인프라 + 표시형 4종**(full_image/thumbnail/icon/weather). 기존 별자리 스켈레톤 폐기.

**Architecture:** premium([[premium-list-feature]]) 패턴 복제 — normalize 경계 + 판별 union + `never` 가드 스위치 + self-fetch + `create<Domain>Api` 팩토리. shared PriceTag 재사용. 스펙 `docs/superpowers/specs/2026-07-08-today-posts-design.md`.

**Tech Stack:** RN, react-query, 스타일 엔진, shared DS(PriceTag/AspectRatio/Image/Typography), Figma(위젯 정밀 실측).

**데이터 실측 요약** (`/api/today/posts`, 회원 토큰 시 15포스트 5타입):
- 포스트: `{ id, type, subtype, status, header{title,subtitle,portrait?,bgImage?}, body{items}, isDark }`.
- 도메인 정규화: `full_image`→full_image, `thumbnail`→thumbnail, `icon`+`daily`→icon, `icon`+`daily_weather`→**weather**, (gift/chat은 Phase2/3, Phase1은 드롭).
- link: `{type:'url', value, params?}` — 빈 value→null(no-op). api(gift/chat 액션)는 Phase2/3.

**Figma 노드**: full_image 840:3100 · thumbnail 839:229(+840:2936 상세) · icon 840:3101 · weather 856:792 · (gift 840:3390 Phase2 · chat 840:3798 Phase3).

---

## Task 0: 브랜치 + 문서 커밋 (커밋 ①)

⚠️ **PriceTag 의존**: thumbnail(Task 4)이 shared `PriceTag`를 재사용하는데, PriceTag는 `feature/premium-list`(PR #15)에만 있고 main 미머지 상태다. Task 0에서 상태 확인 후 브랜치 기반을 결정한다.

- [ ] **Step 1**: premium PR #15 머지 여부 확인 (`gh pr view 15 --json state`). 
  - 머지됨 → `git checkout -b feature/today-posts main`(origin/main pull 후).
  - 미머지 → **Martin에게 확인**: (a) premium 먼저 머지, (b) `feature/premium-list` 기반으로 today 브랜치(PriceTag 포함), (c) thumbnail을 PriceTag 없이 선행 후 교체. 기본 권장은 (a).
- [ ] **Step 2**: 스펙·플랜 문서를 브랜치로 이동/커밋(scoped):
```bash
git add docs/superpowers/specs/2026-07-08-today-posts-design.md docs/superpowers/plans/2026-07-08-today-posts.md
git commit -m "docs(today): today posts 스펙·플랜

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1: 타입 + normalize (커밋 ② TDD)

**Files:** Create `today/types/today-types.ts`(교체), `today/api/normalize-today.ts`, Test `today/__tests__/normalize-today.test.ts`

- [ ] **Step 1: 타입** — 기존 `today-types.ts`(TodayFortune) 내용 교체:
```ts
export type TodayLink = { type: 'url'; value: string; params?: Record<string, unknown> };

export type TodayHeader = {
  title: string;
  subtitle: string | null;
  portrait: string | null;
  bgImage: string | null;
};

type TodayPostBase = { id: number; header: TodayHeader; isDark: boolean };

export type FullImageItem = { image: string; link: TodayLink | null };
export type ThumbnailItem = { title: string; image: string | null; price: number; link: TodayLink | null };
export type IconItem = { title: string; image: string; caption: string; link: TodayLink | null };
export type WeatherItem = { temp: string; caption: string; image: string; link: TodayLink | null };

export type TodayPost =
  | (TodayPostBase & { type: 'full_image'; item: FullImageItem })
  | (TodayPostBase & { type: 'thumbnail'; items: ThumbnailItem[] })
  | (TodayPostBase & { type: 'icon'; items: IconItem[] })
  | (TodayPostBase & { type: 'weather'; item: WeatherItem });
```
- [ ] **Step 2: 실패 테스트** — raw 픽스처(scratchpad `today-posts-member.json`에서 각 타입 발췌: full_image/thumbnail(items 있는 400)/icon(daily)/weather(daily_weather) + 렌더불가 케이스)로 `normalizeTodayPosts(raw)` 검증: type+subtype 정규화(icon/daily_weather→weather), header 매핑, 빈 url→null, gift/chat 드롭, 빈 items thumbnail/icon 드롭, 이미지 없는 full_image/weather 드롭.
- [ ] **Step 3: 구현** — `normalize-today.ts`: raw→`TodayPost[]`. raw `type`+`subtype`→도메인 type. header 정규화(빈 문자열→null). link 빈 value→null. raw 타입은 파일 안에서만(배럴 반출 금지). `RawTodayResponse = {status, data: RawTodayPost[]}` export.
- [ ] **Step 4**: 게이트(jest/tsc/eslint) — 정확한 raw 필드는 `scratchpad/today-posts-member.json` 재확인하며 매핑.
- [ ] **Step 5**: 커밋 `feat(today): TodayPost 타입 + normalize (TDD)`

---

## Task 2: todayApi 팩토리 + useTodayPosts (커밋 ③)

**Files:** Modify `today/api/today-api.ts`(getBySign 교체), Create `today/hooks/useTodayPosts.ts`, Delete `today/hooks/useTodayBySign.ts`, Test `today/__tests__/today-api.test.ts`

- [ ] **Step 1**: `createTodayApi(client)` — 기존 `getBySign` 제거, `listPosts(): Promise<TodayPost[]>` → GET `/api/today/posts`, `normalizeTodayPosts(res.data)` 적용. theme/premium `res.data` 언랩 선례. 싱글턴 `todayApi` 유지.
- [ ] **Step 2**: `useTodayPosts()` — react-query, queryKey `['today','posts']`. `useThemeListByCode`/`usePremiumList` 선례.
- [ ] **Step 3**: `git rm today/hooks/useTodayBySign.ts`. 생성자 주입 테스트(theme-api 선례).
- [ ] **Step 4**: 게이트 + 커밋 `feat(today): todayApi listPosts + useTodayPosts`

---

## Task 3: 공통 헤더 + full_image + weather (커밋 ④)

정밀 디자인은 `get_design_context`(forceCode) 실측. presentational — 탭은 `onPressLink` 위임.

**Files:** Create `today/components/{today-post-header,full-image-post,weather-post}.tsx`

- [ ] **Step 1: Figma 실측** — `get_design_context`로 full_image(840:3100)·weather(856:792)·헤더 구조(title/subtitle/portrait/bgImage) 치수·레이아웃·isDark 색 확정.
- [ ] **Step 2: today-post-header** — 공통 헤더(title/subtitle, portrait/bgImage 옵션). `isDark` prop으로 텍스트 색 반전. Typography 소비.
- [ ] **Step 3: full-image-post** — header + `AspectRatio`+`Image`(item.image). 카드 전체 `Pressable`(item.link 있을 때) → onPressLink.
- [ ] **Step 4: weather-post** — header(bgImage 배경) + 온도(temp)/미세먼지(caption)/날씨아이콘(image) + 탭 link. bgImage 배경 위 콘텐츠.
- [ ] **Step 5**: 게이트 + 커밋 `feat(today): 공통 헤더 + full_image/weather 포스트`

---

## Task 4: thumbnail + icon (커밋 ⑤)

**Files:** Create `today/components/{thumbnail-post,icon-post}.tsx`

- [ ] **Step 1: Figma 실측** — thumbnail(839:229 + 840:2936 상세: _List Thumbnail 74×48 + 제목 + Price Tag slot)·icon(840:3101 그리드) 치수·레이아웃.
- [ ] **Step 2: thumbnail-post** — header + 썸네일 리스트 행(_List Thumbnail 이미지 + 제목 2줄 + **shared PriceTag**). price>0일 때 PriceTag(실측 size). isDark 대응.
- [ ] **Step 3: icon-post** — header + 아이콘 그리드(점수 title + 아이콘 image + caption + link). daily 그리드 레이아웃(실측 열 수). isDark 대응.
- [ ] **Step 4**: 게이트 + 커밋 `feat(today): thumbnail/icon 포스트`

---

## Task 5: TodayPost 스위치 + screen + 배럴 + 스켈레톤 정리 (커밋 ⑥)

**Files:** Create `today/components/today-post.tsx`, Modify `today/screens/today-screen.tsx`·`today/index.ts`, Delete `today/stores/today-store.ts`·`today/__tests__/today-store.test.ts`

- [ ] **Step 1: today-post** — type 스위치(full_image/thumbnail/icon/weather), `never` 가드(theme-widget/premium-widget 선례). 각 case에 narrowed post + `onPressLink` 전달.
- [ ] **Step 2: today-screen** — `PlaceholderScreen` → `useTodayPosts` self-fetch + `posts.map(TodayPost)`. `onPressLink(link)`: url→`navigation.navigate('Web',{path:value})`, null→미부착. 로딩/에러(home/premium 선례). ScreenContainer + ScrollView.
- [ ] **Step 3: 스켈레톤 정리** — `git rm today/stores/today-store.ts today/__tests__/today-store.test.ts`. `today/index.ts` 배럴을 `TodayScreen`만 남기고 정리(useTodayStore/useTodayBySign/TodayFortune export 제거).
- [ ] **Step 4**: 게이트 — `tabs-navigator`의 `TodayScreen` import 무변경 확인(배럴 export 유지).
- [ ] **Step 5**: 커밋 `feat(today): TodayPost 스위치 + screen 통합 + 스켈레톤 정리`

---

## Task 6: 최종 리뷰 + finishing

- [ ] **Step 1: 게이트** — `pnpm test`/`tsc`/`eslint` 전체.
- [ ] **Step 2: 최종 통합 리뷰** — main..HEAD 전체. 스펙 정합, normalize 정확(subtype 분기), 표시형 4종, 스위치 never, 스켈레톤 폐기 잔여 없음, PriceTag 재사용, link/isDark.
- [ ] **Step 3: 시각 검증** — premium 탭처럼 시뮬레이터 QA(포스트 4종·isDark·이미지·PriceTag). RNGoogleSignin 이슈 시 Martin QA 이연.
- [ ] **Step 4: finishing-a-development-branch** — push+PR은 **Martin 명시 승인 후**.

---

## Phase 2 / 3 (후속 plan)

- **Phase 2 — gift**(840:3390): union+normalize 확장, 상태머신(Default/Processing/Success), 받기(api POST `/api/post/{id}/gifts`), amount HTML 파싱. 진입 시 상태 전이/API 플로우 실측 + 별도 브레인스토밍.
- **Phase 3 — chat**(840:3798): union+normalize 확장, 대화(말풍선/portrait), tarot 카드 스와이프 + submit(api POST `/api/daily/calc/*`). 진입 시 인터랙션 설계 + 별도 브레인스토밍.

## 범위 밖 (로드맵)

analytics 이벤트(인프라 부재), params.state 웹뷰 전달 계약, promo/할인 PriceTag, thumbnail 빈 리스트 empty-state, 포스트 피드 세로 가상화(FlashList).
