# Today 포스트 표시형 재정렬 + gift/chat 신규 — 설계

**작성일:** 2026-07-10
**브랜치:** `feature/today-post-types` (feature/more-screen 위 스택)
**목표:** today 피드 7종 표시형을 Component Library 디자인 기준으로 정렬하고, 미구현 `gift`/`chat`을 인터랙션까지 신규 구현한다.

---

## 1. 범위 (Martin 확정)

- **신규 2종**: `gift`(3상태 클레임), `chat`(2타입 카드 선택) — **인터랙션(api)까지 풀 구현**
- **기존 4종 재정렬**: `full_image` / `thumbnail` / `icon`(daily) / `weather`(daily_weather) — Component Library diff 반영
- **thumbnail price-tag 변형** 반영
- **기존 오드롭 3건 수정** (아래 §5): 지원 타입인데 normalize에서 잘못 드롭되는 실제 버그

Figma (Component Library, fileKey `AfXabaxOG38EyU5olW5iaP`):
chat `840:3798` / gift `840:3390` / weather `856:792` / icon `840:3101` / thumbnail `839:229` / thumbnail+pricetag `840:2936` / full_image `840:3100`

---

## 2. 현재 상태 (기준선)

- 도메인 union `TodayPost` = `full_image | thumbnail | icon | weather` (`type`으로 discriminate), 각각 `{ id, header, isDark, ...데이터 }`.
- 디스패처 `today-post-view.tsx` — `switch(post.type)` + `never` 가드(union 추가 시 컴파일 강제).
- `normalize-today.ts` — raw → 도메인, 렌더 불가/미지원 단위는 경계에서 드롭.
- `normalizeLink`는 **`type:'url'`만** 도메인 링크로 변환 → `api` 링크는 전부 `null`(gift/chat 인터랙션엔 불충분, §6에서 확장).

---

## 3. 실제 서버 raw 계약 (네이티브 QA 채취, 2026-07-10)

### gift (`type:"gift"`, `subtype:"multi_gift"`)
```jsonc
{ "id":6536, "type":"gift", "subtype":"multi_gift", "status":"S3",
  "header": { "title":"...", "subtitle":"..." },   // portrait 없음
  "body": { "items": [ {
    "title":"선물 어쩌구 외 3개", "description":"",
    "amount":"<b>X7</b>",        // ⚠️ HTML 태그 포함 — 파싱 필요
    "color":"#E85E5E",           // 강조색(수량/배지)
    "icon":"https://.../gift_type_saletag.png",   // SALE 배지 아이콘
    "buttons": [
      { "text":"쿠폰 받기", "type":"link", "icon":".../ic_download.svg",
        "disabled":false,
        "link": { "type":"api", "value":"/api/post/6536/gifts", "method":"POST", "analytics":{...} } },
      { "text":"사용하기", "type":"link", "icon":".../ic_arrow_right.svg", "disabled":true }  // link 없음
    ] } ] },
  "isDark": false }
```
- **3상태(Figma Default/Processing/Success)**는 서버 필드가 아니라 **클라 클레임 진행**으로 파생: 초기 = `쿠폰 받기` 활성/`사용하기` 비활성 → 받는 중(mutation pending) → 완료(받기 비활성/사용하기 활성 + "발급 완료" 표시).

### chat (`type:"chat"`, `subtype:"tarot" | "tarot_cat" | "proverb" | "custom"`)
```jsonc
{ "id":8, "type":"chat", "subtype":"tarot", "status":"S3",
  "header": { "title":"...", "subtitle":"...", "portrait":"https://.../portrait.png" },  // 아바타 O
  "body": {
    "bgColor":"#ACD9FF",       // proverb 등 일부만
    "items": [
      [ /* [0] 채팅 말풍선 배열 */
        { "v":"반가워요.\n타로 마스터 아이샤예요." },   // 텍스트 버블(\n 개행)
        { "v":"..." },
        { "t":"image", "src":"https://...", "w":"", "h":"", "link":{...} }   // 이미지 버블(선택)
      ],
      [ /* [1] 피커(선택 영역) */
        { "v":"좌우로 스와이프하여 카드를 한 장 고르세요",   // 안내 캡션
          "a":[ { "t":"button", "button":{ "text":"이 카드로 할게요", "type":"submit",
                  "link":{ "type":"api", "value":"/api/daily/calc/d_tarot", "method":"POST", ... } } } ] },
        { "t":"tarot", "src":"https://.../d_tarot_summer.png" }   // 단일 타로카드(스와이프)
      ] ] },
  "isDark": false }
```
**피커 구조가 subtype에 따라 2형태:**
- **tarot / tarot_cat**: `[1]`에 `{t:"tarot", src}` 단일 카드 + `a`에 **submit 버튼**("이 카드로 할게요"/"온도 재기"). 카드 스와이프 후 버튼으로 확정.
- **proverb / custom**: `[1]`의 `a`가 **선택 이미지 배열**(각 `{t:"image", src, link:api}`) + `{t:"carousel"}` 마커. 이미지 **탭 자체가 선택+api**(별도 버튼 없음).

→ Figma "Type=Tarot" = 단일카드+버튼, "Type=Custom" = 이미지 캐러셀 탭선택.

---

## 4. 도메인 모델 확장

`today-types.ts`에 union 추가. raw 타입은 `api/` 밖 반출 금지(기존 규약).

```ts
// 공통 액션 — api 링크(인터랙션). normalizeLink를 url 외 api까지 확장(§6).
export type TodayAction = { endpoint: string; method: string };   // 'GET'|'POST' 등

// ── gift ──
export type GiftButton = {
  text: string;
  iconUrl: string | null;
  disabled: boolean;
  action: TodayAction | null;   // disabled거나 link 없으면 null
};
export type GiftItem = {
  title: string;
  amount: string;      // "X7" (HTML 스트립)
  color: string;       // hex
  iconUrl: string | null;
  buttons: GiftButton[];
};
// TodayPost에 추가: { type:'gift', ...base, items: GiftItem[] }

// ── chat ──
export type ChatMessage =
  | { kind: 'text'; text: string }
  | { kind: 'image'; src: string };
export type ChatCard = { src: string; action: TodayAction };   // carousel 선택 이미지
export type ChatPicker =
  | { kind: 'tarot'; cardSrc: string; caption: string; submit: TodayAction }   // 단일카드+확정버튼
  | { kind: 'carousel'; caption: string; cards: ChatCard[] };                  // 이미지 탭선택
export type ChatHeader = TodayHeader & { portrait: string | null };  // 이미 portrait 있음
// TodayPost에 추가: { type:'chat', ...base, bgColor: string|null, messages: ChatMessage[], picker: ChatPicker }
```

`header.portrait`는 이미 `TodayHeader`에 존재(현재 4종은 미사용) → chat에서 소비.

---

## 5. 기존 오드롭 3건 수정 (실제 버그)

raw로 확인된 잘못된 드롭:
- **`full_image #6547` `subtype:"item"` → "no image"**: full_image인데 `items[0].image`가 없음. 실제 full_image 데이터 형태(subtype `item`)가 현 `normalizeFullImage` 가정과 다름 → **raw 재확인 후 필드 매핑 교정** (image 위치가 다를 가능성).
- **`thumbnail #196 / #6531` → "empty items"**: `normalizeThumbnailItems`가 `title` 없는 아이템을 드롭 → 결과 0 → 포스트 드롭. 썸네일 아이템이 `title` 대신 다른 필드를 쓰거나 title이 정말 비었을 수 있음 → **raw 재확인** 후 가드 완화 또는 필드 교정.

→ 구현 시 이 2건의 **raw 원문을 추가 채취**해 정확히 교정한다(로그 재계측).

---

## 6. 인터랙션 & API 레이어 (Martin 확정, 2026-07-10)

**인터랙션 플로우 (gift·chat 공통):**
1. 액션 버튼/이미지 탭 → 그 요소의 api-link 호출: `link.method` `link.value`
   (예: gift `POST /api/post/6536/gifts`, chat `POST /api/daily/calc/d_tarot`).
2. 성공 후 **포스트를 id로 재조회**: `GET /api/today/post/{id}` → 갱신된 raw 포스트(새 상태).
3. normalize → 피드의 해당 포스트를 **교체**. → gift 발급완료·chat 결과는 **서버가 준 새 데이터로 반영**(순수 클라 상태 아님).

### normalizeLink 확장
현재 `url`만 처리 → `api` 타입도 `TodayAction { endpoint, method }`로 보존(gift/chat 필수). 표시형 링크(url) 경로는 불변.

### today action api + 훅
- `today-api.ts`: `runAction(action)` = `client[method](endpoint)`; `getPostById(id)` = `GET /api/today/post/{id}` → `normalizeTodayPosts([raw])[0]`.
- `useTodayAction` (`useMutation`): 액션 실행 → onSuccess에서 `getPostById(id)` → `queryClient.setQueryData(['today','posts'], 해당 포스트 교체)`. pending/error는 컴포넌트가 소비(버튼 로딩/비활성).

---

## 7. 컴포넌트 매핑

| type | 컴포넌트 | 비고 |
|---|---|---|
| full_image | FullImagePost | 기존, Component Library diff 반영 |
| thumbnail | ThumbnailPost | 기존 + price-tag 변형(이미 PriceTag 사용 — 변형 diff 확인) |
| icon | IconPost | 기존 |
| weather | WeatherPost | 기존 |
| **gift** | **GiftPost** (신규) | 티켓카드(PriceTag 스타일 SALE 배지) + 버튼 2개 + mutation 상태 |
| **chat** | **ChatPost** (신규) | 헤더(아바타) + 말풍선 리스트 + 피커(tarot: 단일카드 / carousel: `Carousel` 재사용) + submit |

- 디스패처 `today-post-view.tsx`에 `gift`/`chat` case 추가(`never` 가드가 강제).
- chat 캐러셀은 shared `Carousel` 재사용, gift SALE 배지는 `PriceTag`/`ForceIcon` 패턴 참조.
- **각 컴포넌트 정확한 치수/색은 구현 시 `get_design_context`로 노드별 확보**(More 화면과 동일 방식).

---

## 8. Open Questions

1. ✅ **해결(§6)** — 액션 성공 후 `GET /api/today/post/{id}` 재조회 → 포스트 교체.
2. ✅ **해결** — gift 3상태는 서버 재조회로 반영(순수 클라 상태 아님).
3. **기존 오드롭 2건 raw** — full_image(subtype `item`)·thumbnail의 실제 아이템 형태 (Phase 1, 채취 대기).
4. **Component Library diff** — 기존 4종이 현 구현과 시각 차이가 있는지(노드별 design_context 비교, 구현 시).
5. **thumbnail price-tag 변형** — 현 thumbnail과 별개 변형인지, 같은 컴포넌트의 상태인지(구현 시).

---

## 9. 구현 순서 (플랜에서 태스크화)

1. **기존 오드롭 수정** (§5) — 빠른 실익, raw 재채취 + normalize 교정 + 테스트.
2. **normalizeLink api 확장 + today action api/훅** (§6) — gift/chat 공통 기반.
3. **gift** — 도메인 + normalize + GiftPost + 클레임 mutation + 테스트 + 시각검증.
4. **chat** — 도메인 + normalize(중첩·2피커) + ChatPost(말풍선/캐러셀/tarot) + 선택 mutation + 테스트 + 시각검증.
5. **기존 4종 Component Library 정렬** (§7) — 노드별 diff 확인 후 필요한 것만.
6. 최종 통합 리뷰 + 시뮬레이터 시각검증.

각 단계 TDD(normalize 순수함수 우선) + 디스패처 `never` 가드 + 커밋 분리.

---

## 10. 테스트 전략

- normalize(gift/chat/기존 오드롭 수정) — 순수함수, raw 픽스처 기반 단위 테스트(디자인/실 raw 예시로).
- action api/훅 — mock client로 endpoint/method 호출 검증.
- 컴포넌트 — 표시형 스위치 + 상태(gift 3상태, chat 선택) 렌더.
- 시각검증 — 시뮬레이터(로그인 상태에서 today 피드, 실 raw로).
