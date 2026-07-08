# Today Posts (서버드리븐 포스트 피드) 설계

> 2026-07-08 브레인스토밍 확정본. `today` 탭(현재 별자리 운세 스켈레톤)을 `/api/today/posts` 서버드리븐 포스트 피드로 **전면 재작성**한다. premium([[premium-list-feature]])/theme([[theme-widget-feature]])에서 검증된 서버드리븐 패턴(normalize 경계 + 판별 union + `never` 가드 스위치 + self-fetch)을 복제하고, [[price-tag-component]]를 재사용한다. [[style-engine]] 소비, [[component-prop-conventions]] 준수, [[pr-workflow]] 적용.

## 1. 목표

- today feature 전면 재작성: `/api/today/posts`를 self-fetch해 포스트 피드 렌더. 기존 별자리 스켈레톤(`getBySign`/`TodayFortune`/`selectedSign`) 폐기.
- 포스트 렌더러: `full_image`/`thumbnail`/`icon`/`weather` (Phase1) + `gift`(Phase2) + `chat`(Phase3).
- **단일 브랜치, Phase별 커밋 분리**. 범위는 전체 6타입이되 인터랙션(gift/chat)은 순서상 후행.

## 2. API·데이터 (실측 2026-07-08)

`GET /api/today/posts` — 회원(`x-auth-token`) 시 15포스트 5타입, 비회원 시 일부(full_image/icon/chat 위주). `{ status, data }` 봉투, `data` = 포스트 배열.

**포스트 공통 형태**: `{ id, type, subtype, status, header, body, isDark }`.
- `type`: 렌더러 지시자. `subtype`: 세분(icon의 `daily`/`daily_weather` 등).
- `header`: `{ title, subtitle, portrait?, bgImage? }`.
- `body.items`: type별 콘텐츠(배열 또는 중첩 배열).
- `isDark`: 다크 배경 포스트 플래그.

**type별 실측**:
| type / subtype | 특징 | Phase |
|---|---|---|
| `full_image` / item | 이미지 1장 + link. header. | 1 |
| `thumbnail` / thumbnail | 썸네일 리스트(제목 + 이미지(null 가능) + price/promo + link). **빈 리스트 가능**. isDark 있음. | 1 |
| `icon` / daily | 아이콘 그리드 4(점수 title + 아이콘 image + caption + link, `params.state{code,extra}`). isDark. | 1 |
| `icon` / daily_weather | 날씨(header.bgImage + 온도 title + 미세먼지 caption + 날씨아이콘 + 외부 링크). isDark. | 1 |
| `gift` / multi_gift | 선물(amount(HTML) + 버튼[받기=api POST] + 상태). | 2 |
| `chat` / tarot·tarot_cat·proverb | 대화(말풍선 + portrait) + (tarot: 카드 스와이프 + submit POST). | 3 |

## 3. 데이터 모델 (`types/today-types.ts`)

Phase1 union(4종). `gift`/`chat`은 Phase2/3에서 union 확장.

```ts
/** Phase1은 url만. params.state 보존(웹뷰 전달 방식은 추후 상의). api(gift POST/chat submit)는 Phase2/3에서 확장. */
export type TodayLink = { type: 'url'; value: string; params?: Record<string, unknown> };

export type TodayHeader = {
  title: string;
  subtitle: string | null;
  portrait: string | null; // chat 등
  bgImage: string | null;  // weather 등
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
// Phase2: | (TodayPostBase & { type: 'gift'; ... })
// Phase3: | (TodayPostBase & { type: 'chat'; ... })
```

- **normalize**(`normalize-today.ts`): raw `type`+`subtype` → 도메인 `type`. `icon`/`daily`→`icon`, `icon`/`daily_weather`→**`weather`**(Figma도 별도 컴포넌트). 빈 `value:""` → `link: null`. 렌더 불가 드롭(unknown type/subtype, 이미지 없는 full_image/weather, **빈 items thumbnail/icon** — premium 빈 위젯 드롭 선례). raw 타입은 `api/` 밖 반출 금지.
- `promo`(할인)·`analytics`는 Phase1 미반영(promo→PriceTag discount는 데이터 확인 후, analytics→인프라 부재).
- Phase1 normalize는 gift/chat raw를 **드롭**(forward-compat) — Phase2/3에서 union+normalize 확장.

## 4. 표시형 4종 + Figma 매핑

| 도메인 type | Figma | 렌더러 | 재사용 |
|---|---|---|---|
| `full_image` | 840:3100 | `FullImagePost` | AspectRatio/Image |
| `thumbnail` | 839:229 (+840:2936 상세) | `ThumbnailPost` | **PriceTag**(shared), Image |
| `icon` | 840:3101 | `IconPost` — 아이콘 그리드 | Image, (그리드 레이아웃) |
| `weather` | 856:792 | `WeatherPost` — bgImage 배경 | Image, raw hex/이미지 배경 |
+ 공통 `TodayPostHeader`(title/subtitle/portrait?/bgImage?).

- 정밀 디자인은 구현 Task에서 `get_design_context` 실측(premium 선례). Angular `forceteller-app3`(core/components/today 등) 보조 참고.
- **isDark**: `isDark:true` 포스트는 컨테이너 다크 배경 + 텍스트 반전. 구체 색/처리는 Figma 실측.

## 5. 구조 (파일)

```
src/features/today/
  types/today-types.ts        ← TodayPost 판별 union (getBySign/TodayFortune 폐기)
  api/today-api.ts            ← createTodayApi(client) + listPosts()  (getBySign 교체)
  api/normalize-today.ts      ← raw → TodayPost[]  (신규)
  hooks/useTodayPosts.ts      ← react-query self-fetch  (useTodayBySign 교체)
  components/today-post.tsx           ← type 스위치 (never 가드)
  components/today-post-header.tsx    ← 공통 헤더
  components/full-image-post.tsx      ← 표시형 4종 (Phase1)
  components/thumbnail-post.tsx
  components/icon-post.tsx
  components/weather-post.tsx
  components/gift-post.tsx            ← Phase2
  components/chat-post.tsx            ← Phase3
  screens/today-screen.tsx    ← PlaceholderScreen 교체: self-fetch + map
  index.ts                    ← 배럴 (TodayScreen)
  (stores/today-store.ts 삭제, hooks/useTodayBySign.ts 삭제)
```

- **레이어**: today 독립 feature. shared DS만 소비(PriceTag 등). `create<Domain>Api` 팩토리 + 싱글턴(auth/theme/premium 정합). normalize 경계. switch `never` exhaustiveness.

## 6. link · isDark 처리

- `onPressLink(link: TodayLink)`: `type:'url'` → Web 웹뷰(`navigation.navigate('Web', { path: link.value })`, home/premium 선례). `link:null`(빈 value) → 렌더 시 비활성(Pressable 미부착/no-op).
- `params.state`(icon 등)는 도메인 `TodayLink.params`에 **보존**하고 네비에 전달(전달 형태는 Phase1 일단 구현, 정확한 웹뷰 계약은 추후 상의).
- **analytics**: 인프라 없음(firebase analytics 등 미설치) → Phase1 미반영. link의 analytics 필드는 도메인 미반영.
- **isDark**: 포스트 컨테이너 배경/텍스트를 다크로. 구체 토큰/색은 Figma 실측.

## 7. Phase 구조 (단일 브랜치, 커밋 분리)

- **Phase1** — 인프라(types/normalize/api/hook/screen/`TodayPost` 스위치/공통 헤더) + 표시형 4종(full_image/thumbnail/icon/weather). link=url only.
- **Phase2** — `gift`: union+normalize 확장, 상태머신(Default/Processing/Success), 받기(api POST link). Figma 840:3390(3상태). 진입 시 상태 전이/API 플로우 실측.
- **Phase3** — `chat`: union+normalize 확장, 대화(말풍선/portrait) + tarot 카드 스와이프 + submit(api POST). Figma 840:3798(Tarot/Custom). 진입 시 인터랙션 플로우 실측.

## 8. 사이드이펙트

- 기존 today 스켈레톤(`today-api` getBySign, `today-types` TodayFortune, `today-store` selectedSign, `useTodayBySign`) **폐기/교체**. today feature 밖 소비처 없음(확인 완료) — `TodayScreen`만 `tabs-navigator`에 등록, 내용만 교체(라우팅 무변경).
- **shared PriceTag 재사용**(thumbnail) — premium 사이클 자산 회수.
- 신규 shared 프리미티브는 최소화(weather bgImage 배경 등 필요 시 판단).
- 신규 feature라 기존 소비처 영향 없음(스켈레톤 교체만 예외, 소비처 0).

## 9. 테스트

- `normalize-today` 단위: raw→union, subtype 분기(icon/daily→icon, icon/daily_weather→weather), 빈 url→null, 렌더 불가 드롭, gift/chat 드롭(Phase1).
- `todayApi` 팩토리(생성자 주입) — theme/premium 선례.
- 스위치 `never` 도달·exhaustiveness — tsc.
- 실렌더·이미지·isDark는 시각 QA(RNGoogleSignin 네이티브 이슈 시 Martin 수동 QA로 이연 — 전례).

## 10. 범위 밖 (후속/로드맵)

- gift/chat 인터랙션 상세(Phase2/3에서 확정) — 상태 전이, 카드 스와이프, submit 결과 처리.
- analytics 이벤트(인프라 부재).
- `params.state` 웹뷰 전달 정확 계약(추후 상의).
- promo/할인 표기(PriceTag discount, 데이터 확인 후).
- thumbnail 빈 리스트 empty-state UX.
- 포스트 피드 세로 가상화(FlashList — 포스트 수 늘면).
