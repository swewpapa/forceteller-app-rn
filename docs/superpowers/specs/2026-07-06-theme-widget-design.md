# Theme Widget (홈 테마 리스트) 설계

> 2026-07-06 브레인스토밍 확정본. Figma `List/Home`(fileKey `xX6xsjXGIcywNl9ARyyzv4`, node `3:3544`)과 실서버 응답(`GET /api/theme/list/recommend_top`, dev 실측)을 ground truth로 한다.
> 이 사이클에서 확정된 네이밍·API 레이어 규약은 `docs/architecture.md`("계층별 네이밍 언어", "API 레이어 패턴")에 명문화되어 있으며, 이 스펙은 그 규약의 첫 적용 사례다.

## 1. 목표

`/api/theme/list/{code}`가 반환하는 서버 드리븐 위젯 목록을 홈 화면에 렌더한다. 이번 사이클은 **데이터 레이어 전체(4개 위젯 타입 모델링) + `text_only` 위젯의 세로슬라이스**(홈 화면 실렌더)까지. 나머지 위젯 렌더러(thumbnail_carousel/full_image_carousel/keyword_cloud)는 후속 사이클.

추가로, 이번에 확정한 규약을 기존 도메인(auth/today)에 소급 적용한다(§9).

## 2. 확정 결정 요약

| 결정 | 내용 | 근거 |
|---|---|---|
| 도메인 분리 | `features/theme/` 신설 (Martin: "여러 군데 사용") | today/auth와 같은 feature 격리 |
| 컨텍스트 분리 | 위젯(`/theme/list/{code}`) vs 페이지(`/theme/{id}`) — 어휘 분리, `ThemeList` 금지 | 레거시 `theme-list-page`와의 중의성 |
| 타입 전략 | 정규화 + discriminated union. raw는 `api/` 밖 반출 금지 | 레거시 raw-passthrough 엔티티의 전 필드 optional 지옥 |
| API 레이어 | `createThemeApi(client)` 팩토리 + 싱글턴 (class 아님) | `createHttpClient` 선례, 생성자 주입 테스트 |
| 훅 네이밍 | `useThemeListByCode(code)` — API-친화적 | 두 엔드포인트의 중의성 제거 (Martin 제안) |
| 페칭 위치 | 스크린 레벨(컨테이너) + presentational 하위 | 한 응답이 화면 전체를 채움; TanStack Query dedup 확인 |
| label 색 | 서버 값(`label_color` hex) 그대로 사용, 토큰 매핑 없음 | Figma `#d5a35a` ≈ 서버 프리미엄 라벨 `#D6A35A` 실측 |

## 3. 파일 구조

```
src/features/theme/
  api/theme-api.ts                 # createThemeApi(client) + themeApi 싱글턴
  api/normalize-theme-widgets.ts   # raw → ThemeWidget[] 순수함수 (raw 타입 콜로케이트, TDD)
  types/theme-types.ts             # ThemeWidget / ThemeView / ThemeKeyword / ThemeLink
  hooks/useThemeListByCode.ts      # useQuery(['theme', 'list', code])
  components/
    theme-widget-list.tsx          # ThemeWidget[] → map → ThemeWidgetRenderer
    theme-widget-renderer.tsx      # switch(widget.type): text_only 렌더, 나머지 null
    text-only-widget.tsx           # ListHeader + views.map(ListItem)
  index.ts                         # 공개: useThemeListByCode, ThemeWidgetList, 도메인 타입

src/shared/components/
  list-header/                     # 신규 범용 DS: subtitle + title + "모두 보기"
  list-item/                       # 신규 범용 DS: 라벨 + 제목 텍스트 행
```

- 스위치 컴포넌트는 `ThemeWidgetRenderer`로 명명 — 타입 `ThemeWidget`과의 값/타입 이름 겹침 회피, 레거시 en 앱 `SectionComponentRenderer` 선례.
- 별도 `ThemeView` 행 컴포넌트는 만들지 않는다 — `TextOnlyWidget`이 `ListItem`을 직접 조합(YAGNI). carousel 사이클에서 카드 렌더러가 필요해지면 그때 재논의.

## 4. 도메인 타입 (`types/theme-types.ts`)

```ts
export type ThemeLink =
  | { type: 'url'; value: string; queryParams?: Record<string, string> }
  | { type: 'tag_filter'; value: string };

/** 서버 themeViews[]의 아이템 단위. 리스트 UI가 쓰는 필드만 (hits/like/description 등 제외 — 필요 시 후속 추가) */
export type ThemeView = {
  id: number;
  viewId: number;
  title: string;
  subtitle: string | null;        // ''·null → null 정규화
  label: { text: string; color: string } | null;  // label_text+label_color 쌍이 모두 있을 때만
  thumbnailImage: string | null;  // '' → null
  fullImage: string | null;
  link: ThemeLink;
  isNew: boolean;
};

export type ThemeKeyword = {
  text: string;
  isMore: boolean;                // raw class === 'more'
  link: ThemeLink;
};

type ThemeWidgetBase = {
  id: number;
  uuid: string;
  title: string;
  subtitle: string | null;
};

export type ThemeWidget =
  | (ThemeWidgetBase & { type: 'text_only'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'thumbnail_carousel'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'full_image_carousel'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'keyword_cloud'; keywords: ThemeKeyword[] });
```

## 5. API + 정규화 (`api/`)

```ts
// theme-api.ts
export function createThemeApi(client: HttpClient) {
  return {
    /** GET /api/theme/list/{code} — 홈 등에 꽂는 위젯 목록 (dev 실측 200) */
    listByCode: async (code: string): Promise<ThemeWidget[]> => {
      const res = await client.get<RawThemeListResponse>(`/api/theme/list/${code}`);
      return normalizeThemeWidgets(res.data);
    },
    // 후속: getById(id) → GET /api/theme/{id} (페이지 컨텍스트)
  };
}

export const themeApi = createThemeApi(http);
```

- 응답 봉투 `{ status, data }`는 여기서 언랩.
- `baseURL`에 `/api`를 넣지 않는다(다른 prefix 경로·기존 코드 영향 회피). **feature api가 전체 경로를 소유**한다. 실측: `/api/theme/list/{code}` → 200, `/theme/list/{code}` → 401.
- raw 타입(`RawThemeListResponse` 등)은 `normalize-theme-widgets.ts`에 콜로케이트한다. `theme-api.ts`가 import하는 것은 허용(같은 `api/` 내부), **feature 배럴(`index.ts`)로는 반출 금지**.

**정규화 규칙** (`normalizeThemeWidgets(raw): ThemeWidget[]`, 순수함수 · TDD 대상):

| 입력 | 처리 | 근거 |
|---|---|---|
| unknown `type` 위젯 | 드롭 | forward compat — 서버 신규 타입에 구버전 앱 안 깨짐 (레거시 `componentMapping` unknown→null 선례) |
| `themeViews` 누락/빈 배열 | 위젯 드롭 | dev 실측에 2건 실존 |
| `keyword_cloud` | `themeViews[0].keywords`를 위젯의 `keywords`로 승격, 비면 드롭 | 서버 구조 (keywords가 themeViews[0]에 중첩) |
| `''` (subtitle/이미지) | `null` 정규화 | UI 분기 단순화 |
| `link` 없는 아이템/키워드 | 해당 항목 드롭 | 탭 불가능한 행·태그는 무의미 (레거시 raw는 `link?: Link \| string` optional) |
| `label_text`/`label_color` 중 하나라도 없음 | `label: null` | 쌍으로만 의미 있음 |

## 6. 훅 (`hooks/useThemeListByCode.ts`)

```ts
export function useThemeListByCode(code: string) {
  return useQuery({
    queryKey: ['theme', 'list', code],
    queryFn: () => themeApi.listByCode(code),
  });
}
```

재시도·staleTime은 전역 `queryClient` 정책 그대로(4xx 재시도 없음, 일시 오류 2회, staleTime 60s).

## 7. UI 컴포넌트

### shared DS (신규 2종 — 범용, theme 어휘 없음)

- **`ListHeader`**: `{ title: string; subtitle?: string; onPressViewAll?: () => void }`. subtitle(`body-sm`, `text.subtle`) 위, title(`headline-md`) 아래, 우측에 onPressViewAll 있으면 "모두 보기" 링크(`label-md`, `text.subtle`, Pressable). Figma 매핑 근거는 지난 분석(제목=headline-md 정확 일치).
- **`ListItem`**: `{ label?: string; labelColor?: string; title: string; onPress?: () => void }`. 라벨(`label-sm`) + 제목(`label-lg`) 가로 행, 하단 보더(`stroke.subtle`). 라벨 색은 **서버 드리븐 hex를 그대로 받는 탈출구**(`labelColor`) — Typography의 `color` prop은 `ModeColors['text']` 한정이라, Button의 선례(typographyStyles + RN `<Text>` 직접 조합)를 따른다. 규약 3계층 정책의 예외임을 컴포넌트 주석에 명시. 마지막 행의 하단 보더 포함 여부는 구현 시 Figma 재확인(미확정).

### features/theme

- **`ThemeWidgetList`**: `{ widgets: ThemeWidget[]; onPressView: (view: ThemeView) => void; onPressViewAll?: (widget: ThemeWidget) => void }` — map → `ThemeWidgetRenderer`.
- **`ThemeWidgetRenderer`**: `switch(widget.type)` — `text_only` → `TextOnlyWidget`, 나머지 3타입 → `null`(후속 사이클에서 case 추가).
- **`TextOnlyWidget`**: `ListHeader(title, subtitle, onPressViewAll)` + `views.map(v => <ListItem label={v.label?.text} labelColor={v.label?.color} title={v.title} onPress={() => onPressView(v)} />)`.

### 홈 통합 (`features/home/screens/home-screen.tsx`)

- `useThemeListByCode('recommend_top')` 호출(컨테이너), 기존 버튼들 유지, 화면을 `ScrollView`로 감싼다(위젯 ~13개 수준 — FlatList 최적화는 YAGNI, 필요 시 재검토).
- `onPressView`: `link.type === 'url'` → `navigation.navigate('Web', { path: link.value, title: view.title })` (기존 홈 WebView 흐름 그대로). `tag_filter`는 이번 범위 밖(text_only에는 url만 관측됨).
- `onPressViewAll`: 이번 사이클에서는 **미연결(prop 생략)** — 테마 페이지(`/theme/{id}`) 컨텍스트가 후속이므로.
- 로딩: `ActivityIndicator`. 에러: 짧은 안내 + 재시도 `Button`(refetch). 정규화 후 0개면 아무것도 렌더하지 않음.

## 8. 테스트

- `normalize-theme-widgets.test.ts` — **핵심**. §5 표의 규칙 전부 + 4타입 매핑 + dev 실응답 축약 픽스처.
- `theme-api.test.ts` — 가짜 client 생성자 주입(팩토리 패턴 실증, `jest.mock` 불필요)으로 경로/언랩 검증.
- `auth-api.test.ts` — 팩토리 전환에 맞춰 주입 방식으로 재작성(기존 `jest.mock('@/shared/lib')` 제거).
- 컴포넌트(ListHeader/ListItem/렌더러)는 **렌더 테스트를 도입하지 않는다** — 기존 DS 관례가 리졸버 테스트 + 시뮬레이터 시각 검증이고, 렌더 테스트는 ThemeProvider→스토리지(MMKV 모킹 함정) 체인을 끌고 옴. 이 컴포넌트들은 상태 분기 없는 정적 조립이라 리졸버로 뽑을 로직도 없음. 시뮬레이터 시각 검증(dev 실데이터)으로 커버.

## 9. 기존 도메인 규약 정합화 (이번 브랜치, 분리 커밋)

2026-07-06 감사 결과. 동작 불변의 순수 리팩터링.

| 대상 | 현재 | 변경 | 소비처 영향 |
|---|---|---|---|
| `auth/api/auth-api.ts` | plain 함수 `exchangeToken` | `createAuthApi(client)` + `authApi.exchangeFirebaseToken(...)` (엔드포인트 `/api/auth/firebase`가 드러나는 액션명) | `auth-store.ts` 1곳, `auth-api.test.ts`(주입 방식 전환), `auth-store.test.ts`(mock 모양 갱신) |
| `today/api/today-api.ts` | plain 함수 `fetchTodayFortune`, 경로 `/today/{sign}` | `createTodayApi(client)` + `todayApi.getBySign(sign)`. 경로는 서버 스펙 미확정이라 ⚠️ 주석 유지(구조만 정합화) | 없음 |
| `today/hooks/useToday.ts` | `useToday(sign)` | `useTodayBySign(sign)` 리네이밍 (파일명 동일 규칙) | barrel만 (화면 소비처 없음) |

기존 ⚠️ B1 주석(auth 응답 형태 미확정)은 그대로 유지한다.

## 10. 사이드이펙트

- `home-screen.tsx`: 기존 로그인/로그아웃/WebView 버튼 동작 불변. ScrollView 래핑으로 레이아웃 변화(기존 `Column flex:1` → 스크롤 컨테이너) — 시각 검증 항목.
- `shared/components` 배럴: ListHeader/ListItem 추가 (충돌 없음).
- auth 리팩터링: 게이트 비활성 상태(실동작 전)라 런타임 위험 낮음, 테스트로 계약 보존 확인.
- dev 서버가 인증 없이 200을 반환하므로 시뮬레이터에서 실데이터 렌더 검증 가능(이전 사이클들의 입력 주입 갭과 무관 — 표시만 확인하면 됨).

## 11. 범위 밖 (후속 로드맵)

- 나머지 위젯 렌더러: `thumbnail_carousel`/`full_image_carousel`(Image/Thumbnail DS 프리미티브 선행 필요), `keyword_cloud`(Chip — `buildButtonStyle` 리졸버 재사용 검토, Martin 확정).
- 페이지 컨텍스트: `themeApi.getById(id)`, `useThemeById`, `ThemePage` (어휘 예약됨).
- "모두 보기" 네비게이션(페이지 컨텍스트 의존), `tag_filter` 링크 처리.
- `view_all_type`/`meta`/`heroImage`/`tags` 필드 소비, `isSeen`/`isWishMark`/`hits`/`like` 노출.
- today 실서버 경로/응답 확정.
