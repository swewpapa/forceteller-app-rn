# Theme Widget (홈 테마 리스트) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/api/theme/list/{code}` 서버 드리븐 위젯 목록의 데이터 레이어(4타입) + `text_only` 위젯 세로슬라이스를 홈 화면에 렌더하고, 기존 도메인(auth/today)을 새 API 레이어 규약으로 정합화한다.

**Architecture:** `features/theme/` 신설 — `createThemeApi(client)` 팩토리가 raw 응답을 `normalize-theme-widgets`(순수함수, TDD)로 discriminated union `ThemeWidget[]`으로 변환. 스크린이 `useThemeListByCode` 훅으로 페치(컨테이너)하고 하위는 전부 presentational. shared DS에 `ListHeader`/`ListItem` 신규.

**Tech Stack:** RN 0.85 / TanStack Query 5 / fetch 기반 `shared/lib/http.ts` / Jest.

**참조 문서:** 스펙 `docs/superpowers/specs/2026-07-06-theme-widget-design.md`, 규약 `docs/architecture.md`("계층별 네이밍 언어", "API 레이어 패턴"), `CLAUDE.md`.

**공통 규칙:**
- 커밋은 각 태스크 끝에 1개 (플랜 승인으로 위임됨). **push 금지.**
- 테스트 실행: `pnpm test -- <파일명>` (전체: `pnpm test`). 타입: `pnpm exec tsc --noEmit`. 린트: `pnpm exec eslint .`
- import: 레이어 간 `@/` alias, 같은 feature/세그먼트 내부는 상대 경로.

---

## File Structure (전체 지도)

```
[신규] src/features/theme/
         api/theme-api.ts                  # createThemeApi + themeApi 싱글턴
         api/normalize-theme-widgets.ts    # raw 타입(비반출) + normalizeThemeWidgets 순수함수
         types/theme-types.ts              # ThemeWidget/ThemeView/ThemeKeyword/ThemeLink
         hooks/useThemeListByCode.ts
         components/theme-widget-list.tsx
         components/theme-widget-renderer.tsx
         components/text-only-widget.tsx
         index.ts
         __tests__/normalize-theme-widgets.test.ts
         __tests__/theme-api.test.ts
[신규] src/shared/components/list-header/{list-header.tsx, index.ts}
[신규] src/shared/components/list-item/{list-item.tsx, index.ts}
[수정] src/shared/components/index.ts      # ListHeader/ListItem 배럴 추가
[수정] src/features/auth/api/auth-api.ts   # createAuthApi 팩토리 전환
[수정] src/features/auth/stores/auth-store.ts
[수정] src/features/auth/__tests__/auth-api.test.ts   # 주입 방식 재작성
[수정] src/features/auth/__tests__/auth-store.test.ts # mock 모양 갱신
[수정] src/features/today/api/today-api.ts # createTodayApi 팩토리 전환
[리네임] src/features/today/hooks/useToday.ts → useTodayBySign.ts
[수정] src/features/today/index.ts
[수정] src/features/home/screens/home-screen.tsx      # ScrollView + 위젯 리스트 통합
```

---

### Task 0: 브랜치 생성 + 문서 커밋 ①

**Files:**
- 커밋 대상(이미 워킹트리에 존재): `docs/superpowers/specs/2026-07-06-theme-widget-design.md`, `docs/superpowers/plans/2026-07-06-theme-widgets.md`, `docs/architecture.md`(계층별 네이밍 언어·API 레이어 패턴 섹션 추가됨), `CLAUDE.md`(신규)

- [ ] **Step 1: main 최신화 확인 + 브랜치 생성**

```bash
git -C /Users/martin/Workspace/un7qi3inc/forceteller-app-rn checkout main && git pull
git checkout -b feature/theme-widgets
```

- [ ] **Step 2: 이번 사이클 문서만 스테이징** (다른 untracked 문서 — `docs/design-system/`, `docs/superpowers/specs/2026-06-26-*`, `2026-07-03-*`, `plans/2026-06-26-*` — 는 건드리지 않는다)

```bash
git add docs/superpowers/specs/2026-07-06-theme-widget-design.md \
        docs/superpowers/plans/2026-07-06-theme-widgets.md \
        docs/architecture.md CLAUDE.md
git status --short   # 스테이징이 위 4개뿐인지 확인
```

- [ ] **Step 3: 커밋**

```bash
git commit -m "docs(theme): theme widget 스펙 + 계층별 네이밍/API 레이어 규약 문서화"
```

---

### Task 1: auth 도메인 규약 정합화 (커밋 ②)

기존 plain 함수 `exchangeToken`을 `createAuthApi(client)` 팩토리 + `authApi.exchangeFirebaseToken`으로 전환. 동작 불변 리팩터링 — 테스트가 계약 보존을 증명한다.

**Files:**
- Modify: `src/features/auth/__tests__/auth-api.test.ts` (전체 교체)
- Modify: `src/features/auth/api/auth-api.ts` (전체 교체)
- Modify: `src/features/auth/stores/auth-store.ts:4,24`
- Modify: `src/features/auth/__tests__/auth-store.test.ts:7-9`

- [ ] **Step 1: auth-api.test.ts를 주입 방식으로 재작성** (파일 전체를 아래로 교체)

```ts
import { createAuthApi } from '../api/auth-api';
import type { HttpClient } from '@/shared/lib';

describe('auth-api', () => {
  it('exchanges firebase id token for service token', async () => {
    const post = jest.fn().mockResolvedValue({ serviceToken: 'svc', user: { id: '1' } });
    const authApi = createAuthApi({ post } as unknown as HttpClient);

    const result = await authApi.exchangeFirebaseToken('fb-id-token', 'uid-1', 'Tester');

    expect(result).toEqual({ serviceToken: 'svc', user: { id: '1' } });
    expect(post).toHaveBeenCalledWith('/api/auth/firebase', {
      provider: 'google',
      id: 'uid-1',
      name: 'Tester',
      access_token: 'fb-id-token',
    }); // ⚠️ B1: 응답 형태는 서버 확인 후 확정
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- auth-api`
Expected: FAIL — `createAuthApi`가 export되지 않음.

- [ ] **Step 3: auth-api.ts를 팩토리로 전환** (파일 전체를 아래로 교체)

```ts
import { http, type HttpClient } from '@/shared/lib';

export type AuthUser = { id: string }; // ⚠️ B1 확정 시 응답 형태로 확장

export type ExchangeResult = { serviceToken: string; user: AuthUser };

export function createAuthApi(client: HttpClient) {
  return {
    /**
     * Firebase ID token + 사용자 정보를 서버 서비스 토큰으로 교환.
     * POST /api/auth/firebase (body: { provider, id, name, access_token })
     * — 레거시 forceteller-app 형식. ⚠️ B1: 응답 형태(serviceToken/user)는 서버 실제 응답 확인 후 확정
     */
    exchangeFirebaseToken: (
      firebaseIdToken: string,
      uid: string,
      name: string | null,
    ): Promise<ExchangeResult> =>
      client.post<ExchangeResult>('/api/auth/firebase', {
        provider: 'google',
        id: uid,
        name,
        access_token: firebaseIdToken,
      }),
  };
}

export const authApi = createAuthApi(http);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- auth-api`
Expected: PASS (1 test)

- [ ] **Step 5: auth-store.ts 소비처 갱신** — line 4의 import와 line 24의 호출 두 곳:

```ts
// import 교체 (기존: import { exchangeToken, type AuthUser } from '../api/auth-api';)
import { authApi, type AuthUser } from '../api/auth-api';
```

```ts
// signIn 내부 호출 교체 (기존: await exchangeToken(firebaseIdToken, uid, name);)
    const { serviceToken, user } = await authApi.exchangeFirebaseToken(firebaseIdToken, uid, name);
```

- [ ] **Step 6: auth-store.test.ts의 mock 모양 갱신** — line 7-9의 `jest.mock('../api/auth-api', ...)` 블록을 아래로 교체:

```ts
jest.mock('../api/auth-api', () => ({
  authApi: {
    exchangeFirebaseToken: jest.fn().mockResolvedValue({ serviceToken: 'svc', user: { id: '1' } }),
  },
}));
```

- [ ] **Step 7: auth 전체 테스트 + 타입 확인**

Run: `pnpm test -- auth && pnpm exec tsc --noEmit`
Expected: auth-api·auth-store PASS, tsc 에러 0

- [ ] **Step 8: 커밋**

```bash
git add src/features/auth
git commit -m "refactor(auth): auth API를 팩토리 패턴으로 전환 (authApi.exchangeFirebaseToken)"
```

---

### Task 2: today 도메인 규약 정합화 (커밋 ③)

plain 함수 → 팩토리, 훅 리네이밍(`useToday` → `useTodayBySign`). 소비처 없음(barrel만). 경로/응답은 서버 스펙 미확정이라 구조만 정합화(⚠️ 주석 유지).

**Files:**
- Modify: `src/features/today/api/today-api.ts` (전체 교체)
- Rename+Modify: `src/features/today/hooks/useToday.ts` → `src/features/today/hooks/useTodayBySign.ts`
- Modify: `src/features/today/index.ts`

- [ ] **Step 1: today-api.ts를 팩토리로 전환** (파일 전체를 아래로 교체)

```ts
import { http, type HttpClient } from '@/shared/lib';
import type { TodayFortune } from '../types/today-types';

export function createTodayApi(client: HttpClient) {
  return {
    /** ⚠️ 스켈레톤: 경로(/api prefix 여부)·응답 형태는 서버 스펙 미확정 — 실연동 시 확정 */
    getBySign: (sign: string): Promise<TodayFortune> =>
      client.get<TodayFortune>(`/today/${sign}`),
  };
}

export const todayApi = createTodayApi(http);
```

- [ ] **Step 2: 훅 리네이밍** — `git mv` 후 내용 교체:

```bash
git mv src/features/today/hooks/useToday.ts src/features/today/hooks/useTodayBySign.ts
```

`useTodayBySign.ts` 전체 내용:

```ts
import { useQuery } from '@tanstack/react-query';
import { todayApi } from '../api/today-api';

/** Server-state hook for today's fortune (sign 기준 조회). */
export function useTodayBySign(sign: string) {
  return useQuery({
    queryKey: ['today', sign],
    queryFn: () => todayApi.getBySign(sign),
  });
}
```

- [ ] **Step 3: barrel 갱신** — `src/features/today/index.ts` 전체:

```ts
export { TodayScreen } from './screens/today-screen';
export { useTodayBySign } from './hooks/useTodayBySign';
export { useTodayStore } from './stores/today-store';
export type { TodayFortune } from './types/today-types';
```

- [ ] **Step 4: 전체 검증** (소비처 부재 확인 포함)

Run: `grep -rn "useToday\b\|fetchTodayFortune" src --include="*.ts*" | grep -v useTodayStore` → 결과 없어야 함
Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: 기존 113 tests + Task 1 변경분 전부 PASS, tsc 에러 0

- [ ] **Step 5: 커밋**

```bash
git add src/features/today
git commit -m "refactor(today): today API 팩토리 전환 + useTodayBySign 리네이밍"
```

---

### Task 3: theme 도메인 타입 + normalize TDD (커밋 ④)

**Files:**
- Create: `src/features/theme/types/theme-types.ts`
- Create: `src/features/theme/api/normalize-theme-widgets.ts`
- Test: `src/features/theme/__tests__/normalize-theme-widgets.test.ts`

- [ ] **Step 1: 도메인 타입 작성** — `theme-types.ts`:

```ts
export type ThemeLink =
  | { type: 'url'; value: string; queryParams?: Record<string, string> }
  | { type: 'tag_filter'; value: string };

/** 서버 themeViews[]의 아이템 단위. 리스트 UI가 쓰는 필드만(hits/like/description 등은 필요 시 후속 추가). */
export type ThemeView = {
  id: number;
  viewId: number;
  title: string;
  subtitle: string | null;
  /** label_text+label_color 쌍이 모두 있을 때만. color는 서버 드리븐 hex. */
  label: { text: string; color: string } | null;
  thumbnailImage: string | null;
  fullImage: string | null;
  link: ThemeLink;
  isNew: boolean;
};

export type ThemeKeyword = {
  text: string;
  /** raw class === 'more' — "더보기" pill */
  isMore: boolean;
  link: ThemeLink;
};

type ThemeWidgetBase = {
  id: number;
  uuid: string;
  title: string;
  subtitle: string | null;
};

/** /api/theme/list/{code}의 위젯 단위. type은 위젯 렌더러 지시자(서버 드리븐). */
export type ThemeWidget =
  | (ThemeWidgetBase & { type: 'text_only'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'thumbnail_carousel'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'full_image_carousel'; views: ThemeView[] })
  | (ThemeWidgetBase & { type: 'keyword_cloud'; keywords: ThemeKeyword[] });
```

- [ ] **Step 2: 실패하는 normalize 테스트 작성** — `__tests__/normalize-theme-widgets.test.ts` (dev 실응답 축약 픽스처 기반):

```ts
import { normalizeThemeWidgets } from '../api/normalize-theme-widgets';

/** dev 실응답(GET /api/theme/list/recommend_top) 축약 픽스처 */
const rawTextOnly = {
  id: 41,
  uuid: 'c2cf77ef-bba4-41ab-8c62-5868a6cd6b43',
  code: 'recommend_top',
  type: 'text_only',
  title: '실시간 인기 급상승',
  subtitle: '지금 대세',
  themeViews: [
    {
      id: 1837, viewId: 133763, type: 'item', title: '연애로 본 내 숨겨진 욕망',
      subtitle: null, thumbnail_image: 'https://static.example.com/a.jpg', full_image: '',
      label_text: '사주', label_color: '#DE8064', isNew: false,
      link: { type: 'url', value: '/item/1837' },
    },
    {
      id: 3, viewId: 62431, type: 'custom', title: '그 사람이 내 고백을 받아줄까요?',
      subtitle: '', thumbnail_image: '', label_text: 'HIT', label_color: '#A2A2A2',
      link: { type: 'url', value: '/item/1872' },
    },
  ],
};

const rawKeywordCloud = {
  id: 8, uuid: 'd8161dc4-71b4-4a11-8ac7-9603348de9ca', code: 'recommend_top',
  type: 'keyword_cloud', title: '예지 꿈 해몽', subtitle: '무서운 꿈을 꾸었구나',
  themeViews: [
    {
      id: -1, viewId: 2669, type: 'keyword_dreams',
      keywords: [
        { text: '바다', link: { type: 'url', value: '/dream', params: { queryParams: { keyword: '바다' } } } },
        { text: '더보기', class: 'more', link: { type: 'url', value: '/dream' } },
        { text: 'link 없는 키워드' },
      ],
    },
  ],
};

describe('normalizeThemeWidgets', () => {
  it('text_only 위젯을 views와 함께 매핑한다', () => {
    const [w] = normalizeThemeWidgets([rawTextOnly]);
    expect(w).toMatchObject({
      id: 41, uuid: 'c2cf77ef-bba4-41ab-8c62-5868a6cd6b43',
      type: 'text_only', title: '실시간 인기 급상승', subtitle: '지금 대세',
    });
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views).toHaveLength(2);
    expect(w.views[0]).toEqual({
      id: 1837, viewId: 133763, title: '연애로 본 내 숨겨진 욕망',
      subtitle: null, label: { text: '사주', color: '#DE8064' },
      thumbnailImage: 'https://static.example.com/a.jpg', fullImage: null,
      link: { type: 'url', value: '/item/1837' }, isNew: false,
    });
  });

  it("''(빈 문자열) subtitle/이미지는 null로 정규화한다", () => {
    const [w] = normalizeThemeWidgets([rawTextOnly]);
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views[1].subtitle).toBeNull();
    expect(w.views[1].thumbnailImage).toBeNull();
  });

  it('thumbnail_carousel / full_image_carousel도 views로 매핑한다', () => {
    const widgets = normalizeThemeWidgets([
      { ...rawTextOnly, id: 1, uuid: 'u1', type: 'thumbnail_carousel' },
      { ...rawTextOnly, id: 2, uuid: 'u2', type: 'full_image_carousel' },
    ]);
    expect(widgets.map(w => w.type)).toEqual(['thumbnail_carousel', 'full_image_carousel']);
  });

  it('keyword_cloud는 themeViews[0].keywords를 keywords로 승격하고, link 없는 키워드는 드롭한다', () => {
    const [w] = normalizeThemeWidgets([rawKeywordCloud]);
    if (w.type !== 'keyword_cloud') throw new Error('unreachable');
    expect(w.keywords).toEqual([
      { text: '바다', isMore: false, link: { type: 'url', value: '/dream', queryParams: { keyword: '바다' } } },
      { text: '더보기', isMore: true, link: { type: 'url', value: '/dream' } },
    ]);
  });

  it('unknown type 위젯은 드롭한다 (forward compat)', () => {
    expect(normalizeThemeWidgets([{ ...rawTextOnly, type: 'hologram_banner' }])).toEqual([]);
  });

  it('themeViews가 없거나 빈 위젯은 드롭한다', () => {
    expect(normalizeThemeWidgets([
      { id: 78, uuid: 'u78', type: 'thumbnail_carousel', title: '헤나테스트', subtitle: '' },
      { ...rawTextOnly, themeViews: [] },
    ])).toEqual([]);
  });

  it('link 없는 view는 드롭하고, 유효 view가 0이면 위젯도 드롭한다', () => {
    const noLink = { ...rawTextOnly, themeViews: [{ id: 9, viewId: 9, title: 'x' }] };
    expect(normalizeThemeWidgets([noLink])).toEqual([]);
  });

  it('label_text/label_color 쌍이 불완전하면 label은 null', () => {
    const [w] = normalizeThemeWidgets([{
      ...rawTextOnly,
      themeViews: [{ id: 1, viewId: 1, title: 't', label_text: '사주', link: { type: 'url', value: '/x' } }],
    }]);
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views[0].label).toBeNull();
  });

  it('tag_filter 링크를 보존하고, unknown link type인 view는 드롭한다', () => {
    const [w] = normalizeThemeWidgets([{
      ...rawTextOnly,
      themeViews: [
        { id: 1, viewId: 1, title: 'a', link: { type: 'tag_filter', value: 'all' } },
        { id: 2, viewId: 2, title: 'b', link: { type: 'deeplink', value: 'x://y' } },
      ],
    }]);
    if (w.type !== 'text_only') throw new Error('unreachable');
    expect(w.views).toEqual([
      expect.objectContaining({ link: { type: 'tag_filter', value: 'all' } }),
    ]);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm test -- normalize-theme-widgets`
Expected: FAIL — 모듈 없음.

- [ ] **Step 4: normalize 구현** — `api/normalize-theme-widgets.ts`:

```ts
import type {
  ThemeKeyword,
  ThemeLink,
  ThemeView,
  ThemeWidget,
} from '../types/theme-types';

// ─── raw 타입: 서버 응답 그대로. api/ 내부 전용 — feature 배럴로 반출 금지 ───

export type RawThemeLink = {
  type?: string;
  value?: string;
  params?: { queryParams?: Record<string, string> };
};

export type RawThemeKeyword = {
  text?: string;
  class?: string;
  link?: RawThemeLink;
};

export type RawThemeView = {
  id?: number;
  viewId?: number;
  title?: string;
  subtitle?: string | null;
  label_text?: string;
  label_color?: string;
  thumbnail_image?: string;
  full_image?: string;
  isNew?: boolean;
  link?: RawThemeLink;
  keywords?: RawThemeKeyword[];
};

export type RawThemeWidget = {
  id?: number;
  uuid?: string;
  type?: string;
  title?: string;
  subtitle?: string | null;
  themeViews?: RawThemeView[];
};

export type RawThemeListResponse = { status: number; data: RawThemeWidget[] };

// ─── 정규화 ───

const CONTENT_TYPES = [
  'text_only',
  'thumbnail_carousel',
  'full_image_carousel',
] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

function isContentType(type: string): type is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(type);
}

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

function normalizeLink(link: RawThemeLink | undefined): ThemeLink | null {
  if (!link?.type || !link.value) return null;
  if (link.type === 'url') {
    const queryParams = link.params?.queryParams;
    return { type: 'url', value: link.value, ...(queryParams ? { queryParams } : {}) };
  }
  if (link.type === 'tag_filter') return { type: 'tag_filter', value: link.value };
  return null; // unknown link type → 호출부에서 항목 드롭
}

function normalizeView(view: RawThemeView): ThemeView | null {
  const link = normalizeLink(view.link);
  if (!link) return null;
  if (view.id === undefined || view.viewId === undefined || !view.title) return null;
  return {
    id: view.id,
    viewId: view.viewId,
    title: view.title,
    subtitle: emptyToNull(view.subtitle),
    label:
      view.label_text && view.label_color
        ? { text: view.label_text, color: view.label_color }
        : null,
    thumbnailImage: emptyToNull(view.thumbnail_image),
    fullImage: emptyToNull(view.full_image),
    link,
    isNew: view.isNew ?? false,
  };
}

function normalizeKeyword(keyword: RawThemeKeyword): ThemeKeyword | null {
  const link = normalizeLink(keyword.link);
  if (!link || !keyword.text) return null;
  return { text: keyword.text, isMore: keyword.class === 'more', link };
}

/**
 * raw 위젯 목록 → 도메인 ThemeWidget[].
 * 렌더 불가능한 단위는 이 경계에서 드롭한다: unknown type(forward compat),
 * 빈 themeViews, link 없는 view/keyword. 스펙 §5 참조.
 */
export function normalizeThemeWidgets(raw: RawThemeWidget[]): ThemeWidget[] {
  const widgets: ThemeWidget[] = [];
  for (const w of raw) {
    if (w.id === undefined || !w.uuid || !w.title || !w.type) continue;
    const rawViews = w.themeViews ?? [];
    if (rawViews.length === 0) continue;
    const base = { id: w.id, uuid: w.uuid, title: w.title, subtitle: emptyToNull(w.subtitle) };

    if (w.type === 'keyword_cloud') {
      const keywords = (rawViews[0]?.keywords ?? [])
        .map(normalizeKeyword)
        .filter((k): k is ThemeKeyword => k !== null);
      if (keywords.length === 0) continue;
      widgets.push({ ...base, type: 'keyword_cloud', keywords });
    } else if (isContentType(w.type)) {
      const views = rawViews
        .map(normalizeView)
        .filter((v): v is ThemeView => v !== null);
      if (views.length === 0) continue;
      widgets.push({ ...base, type: w.type, views });
    }
    // unknown type → drop
  }
  return widgets;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test -- normalize-theme-widgets`
Expected: PASS (8 tests)

- [ ] **Step 6: 커밋**

```bash
git add src/features/theme
git commit -m "feat(theme): 도메인 타입 + normalize 순수함수 (TDD)"
```

---

### Task 4: themeApi 팩토리 + 훅 + barrel (커밋 ⑤)

**Files:**
- Create: `src/features/theme/api/theme-api.ts`
- Create: `src/features/theme/hooks/useThemeListByCode.ts`
- Create: `src/features/theme/index.ts`
- Test: `src/features/theme/__tests__/theme-api.test.ts`

- [ ] **Step 1: 실패하는 theme-api 테스트 작성** — `__tests__/theme-api.test.ts`:

```ts
import { createThemeApi } from '../api/theme-api';
import type { HttpClient } from '@/shared/lib';

describe('theme-api', () => {
  it('listByCode: 경로 조립 + 봉투 언랩 + 정규화', async () => {
    const get = jest.fn().mockResolvedValue({
      status: 200,
      data: [
        {
          id: 41, uuid: 'u41', type: 'text_only', title: '실시간 인기 급상승', subtitle: '지금 대세',
          themeViews: [
            { id: 1, viewId: 10, title: '연애로 본 내 숨겨진 욕망', link: { type: 'url', value: '/item/1' } },
          ],
        },
        { id: 99, uuid: 'u99', type: 'unknown_widget', title: 'x', themeViews: [] },
      ],
    });
    const themeApi = createThemeApi({ get } as unknown as HttpClient);

    const widgets = await themeApi.listByCode('recommend_top');

    expect(get).toHaveBeenCalledWith('/api/theme/list/recommend_top');
    expect(widgets).toHaveLength(1);
    expect(widgets[0]).toMatchObject({ type: 'text_only', title: '실시간 인기 급상승' });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- theme-api`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: theme-api.ts 구현**

```ts
import { http, type HttpClient } from '@/shared/lib';
import type { ThemeWidget } from '../types/theme-types';
import {
  normalizeThemeWidgets,
  type RawThemeListResponse,
} from './normalize-theme-widgets';

export function createThemeApi(client: HttpClient) {
  return {
    /** GET /api/theme/list/{code} — 홈 등에 꽂는 위젯 목록 (위젯 컨텍스트) */
    listByCode: async (code: string): Promise<ThemeWidget[]> => {
      const res = await client.get<RawThemeListResponse>(`/api/theme/list/${code}`);
      return normalizeThemeWidgets(res.data);
    },
    // 후속: getById(id) → GET /api/theme/{id} (페이지 컨텍스트, 어휘 예약: Theme/ThemePage)
  };
}

export const themeApi = createThemeApi(http);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- theme-api`
Expected: PASS (1 test)

- [ ] **Step 5: 훅 작성** — `hooks/useThemeListByCode.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { themeApi } from '../api/theme-api';

/** 위젯 컨텍스트 서버 상태 훅. 재시도·staleTime은 전역 queryClient 정책. */
export function useThemeListByCode(code: string) {
  return useQuery({
    queryKey: ['theme', 'list', code],
    queryFn: () => themeApi.listByCode(code),
  });
}
```

- [ ] **Step 6: feature barrel 작성** — `index.ts` (raw 타입은 반출 금지. `ThemeWidgetList` export는 컴포넌트가 생기는 Task 6에서 추가):

```ts
export { useThemeListByCode } from './hooks/useThemeListByCode';
export type { ThemeWidget, ThemeView, ThemeKeyword, ThemeLink } from './types/theme-types';
```

- [ ] **Step 7: 전체 검증 + 커밋**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: 전부 PASS, tsc 에러 0

```bash
git add src/features/theme
git commit -m "feat(theme): themeApi 팩토리 + useThemeListByCode 훅"
```

---

### Task 5: shared DS — ListHeader + ListItem (커밋 ⑥)

상태 분기 없는 정적 조립 — 리졸버/테스트 없음(스펙 §8), 시각은 Task 8에서 검증.

**Files:**
- Create: `src/shared/components/list-header/list-header.tsx`, `src/shared/components/list-header/index.ts`
- Create: `src/shared/components/list-item/list-item.tsx`, `src/shared/components/list-item/index.ts`
- Modify: `src/shared/components/index.ts`

- [ ] **Step 1: ListHeader 작성** — `list-header/list-header.tsx`:

```tsx
import { Pressable } from 'react-native';
import { Column, Row } from '../layout';
import { Typography } from '../typography';

export type ListHeaderProps = {
  title: string;
  subtitle?: string;
  /** 있으면 우측에 "모두 보기" 링크를 렌더한다. */
  onPressViewAll?: () => void;
};

/** 리스트/위젯 섹션 헤더: subtitle(위) + title(아래) + 선택적 "모두 보기". */
export function ListHeader({ title, subtitle, onPressViewAll }: ListHeaderProps) {
  return (
    <Row justify="space-between" align="flex-end">
      <Column gap="50">
        {subtitle ? (
          <Typography variant="body-sm" color="subtle">
            {subtitle}
          </Typography>
        ) : null}
        <Typography variant="headline-md">{title}</Typography>
      </Column>
      {onPressViewAll ? (
        <Pressable accessibilityRole="button" onPress={onPressViewAll}>
          <Typography variant="label-md" color="subtle">
            모두 보기
          </Typography>
        </Pressable>
      ) : null}
    </Row>
  );
}
```

`list-header/index.ts`:

```ts
export { ListHeader, type ListHeaderProps } from './list-header';
```

- [ ] **Step 2: ListItem 작성** — `list-item/list-item.tsx`:

```tsx
import { Pressable, StyleSheet, Text } from 'react-native';
import { spacing, useAppColors } from '@/shared/theme';
import { typographyStyles } from '../typography';

export type ListItemProps = {
  /** 좌측 라벨(카테고리 등). */
  label?: string;
  /**
   * 라벨 색 — 서버 드리븐 hex를 그대로 받는 탈출구.
   * 규약 3계층 정책(시각 정체성=named prop)의 명시적 예외: 색의 출처가 토큰이 아니라 서버 데이터.
   */
  labelColor?: string;
  title: string;
  onPress?: () => void;
};

/** 라벨 + 제목 텍스트 행 (하단 보더). Typography color가 토큰 한정이라 Button 선례대로 <Text>+typographyStyles 직접 조합. */
export function ListItem({ label, labelColor, title, onPress }: ListItemProps) {
  const colors = useAppColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.stroke.subtle }]}
    >
      {label ? (
        <Text style={[typographyStyles['label-sm'], { color: labelColor ?? colors.text.subtle }]}>
          {label}
        </Text>
      ) : null}
      <Text
        numberOfLines={1}
        style={[typographyStyles['label-lg'], styles.title, { color: colors.text.default }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[200],
    paddingVertical: spacing[150],
    borderBottomWidth: 1,
  },
  title: { flex: 1 },
});
```

`list-item/index.ts`:

```ts
export { ListItem, type ListItemProps } from './list-item';
```

- [ ] **Step 3: shared 배럴 갱신** — `src/shared/components/index.ts` 끝에 추가:

```ts
export { ListHeader, type ListHeaderProps } from './list-header';
export { ListItem, type ListItemProps } from './list-item';
```

- [ ] **Step 4: 타입/린트 검증 + 커밋**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/shared/components/list-header src/shared/components/list-item`
Expected: 에러 0, 경고 0

```bash
git add src/shared/components
git commit -m "feat(components): ListHeader/ListItem DS 프리미티브"
```

---

### Task 6: theme 위젯 컴포넌트 3종 (커밋 ⑦)

**Files:**
- Create: `src/features/theme/components/text-only-widget.tsx`
- Create: `src/features/theme/components/theme-widget-renderer.tsx`
- Create: `src/features/theme/components/theme-widget-list.tsx`
- Modify: `src/features/theme/index.ts`

- [ ] **Step 1: TextOnlyWidget** — `components/text-only-widget.tsx`:

```tsx
import { Column, ListHeader, ListItem } from '@/shared/components';
import type { ThemeView, ThemeWidget } from '../types/theme-types';

type TextOnlyWidgetData = Extract<ThemeWidget, { type: 'text_only' }>;

export type TextOnlyWidgetProps = {
  widget: TextOnlyWidgetData;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (widget: TextOnlyWidgetData) => void;
};

/** text_only 위젯: ListHeader + 라벨/제목 텍스트 행 목록. */
export function TextOnlyWidget({ widget, onPressView, onPressViewAll }: TextOnlyWidgetProps) {
  return (
    <Column gap="150">
      <ListHeader
        title={widget.title}
        subtitle={widget.subtitle ?? undefined}
        onPressViewAll={onPressViewAll ? () => onPressViewAll(widget) : undefined}
      />
      <Column>
        {widget.views.map(view => (
          <ListItem
            key={view.viewId}
            label={view.label?.text}
            labelColor={view.label?.color}
            title={view.title}
            onPress={() => onPressView(view)}
          />
        ))}
      </Column>
    </Column>
  );
}
```

- [ ] **Step 2: ThemeWidgetRenderer** — `components/theme-widget-renderer.tsx`:

```tsx
import type { ThemeView, ThemeWidget } from '../types/theme-types';
import { TextOnlyWidget } from './text-only-widget';

export type ThemeWidgetRendererProps = {
  widget: ThemeWidget;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (widget: ThemeWidget) => void;
};

/**
 * 위젯 type → 렌더러 스위치 (레거시 SectionComponentRenderer 대응).
 * 미구현 타입은 렌더하지 않는다 — 후속 사이클에서 case 추가:
 * thumbnail_carousel/full_image_carousel(Image 프리미티브 선행), keyword_cloud(Chip 선행).
 */
export function ThemeWidgetRenderer({ widget, onPressView, onPressViewAll }: ThemeWidgetRendererProps) {
  switch (widget.type) {
    case 'text_only':
      return (
        <TextOnlyWidget widget={widget} onPressView={onPressView} onPressViewAll={onPressViewAll} />
      );
    case 'thumbnail_carousel':
    case 'full_image_carousel':
    case 'keyword_cloud':
      return null;
  }
}
```

- [ ] **Step 3: ThemeWidgetList** — `components/theme-widget-list.tsx`:

```tsx
import { Column } from '@/shared/components';
import type { ThemeView, ThemeWidget } from '../types/theme-types';
import { ThemeWidgetRenderer } from './theme-widget-renderer';

export type ThemeWidgetListProps = {
  widgets: ThemeWidget[];
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (widget: ThemeWidget) => void;
};

/** 위젯 세로 나열. 스크롤 컨테이너는 화면(호출부) 관할. */
export function ThemeWidgetList({ widgets, onPressView, onPressViewAll }: ThemeWidgetListProps) {
  return (
    <Column gap="400">
      {widgets.map(widget => (
        <ThemeWidgetRenderer
          key={widget.uuid}
          widget={widget}
          onPressView={onPressView}
          onPressViewAll={onPressViewAll}
        />
      ))}
    </Column>
  );
}
```

- [ ] **Step 4: barrel에 컴포넌트 추가** — `src/features/theme/index.ts` 전체:

```ts
export { useThemeListByCode } from './hooks/useThemeListByCode';
export { ThemeWidgetList } from './components/theme-widget-list';
export type { ThemeWidget, ThemeView, ThemeKeyword, ThemeLink } from './types/theme-types';
```

- [ ] **Step 5: 검증 + 커밋**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/features/theme && pnpm test`
Expected: 에러 0, 전부 PASS

```bash
git add src/features/theme
git commit -m "feat(theme): 위젯 렌더러 컴포넌트 (text_only 세로슬라이스)"
```

---

### Task 7: 홈 화면 통합 (커밋 ⑧)

**Files:**
- Modify: `src/features/home/screens/home-screen.tsx` (전체 교체)

- [ ] **Step 1: home-screen.tsx 교체** — 기존 버튼 3개(로그인/로그아웃, WebView 상세 2개)는 동작 그대로 유지하고, ScrollView 래핑 + 위젯 리스트를 아래에 추가:

```tsx
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useAppNavigation, useAuthStore } from '@/features/auth';
import { ThemeWidgetList, useThemeListByCode, type ThemeView } from '@/features/theme';
import { Button, Column, ScreenContainer, Typography } from '@/shared/components';
import { radius, spacing, useAppColors } from '@/shared/theme';

/** 홈 탭(RN). 테마 위젯 리스트(recommend_top) + 예시 진입 버튼들. */
export function HomeScreen() {
  const navigation = useAppNavigation();
  const colors = useAppColors();
  const status = useAuthStore(s => s.status);
  const signOut = useAuthStore(s => s.signOut);
  const themeQuery = useThemeListByCode('recommend_top');

  const handlePressView = (view: ThemeView) => {
    // tag_filter 링크는 keyword_cloud 사이클에서 처리 (text_only에는 url만 관측됨)
    if (view.link.type === 'url') {
      navigation.navigate('Web', { path: view.link.value, title: view.title });
    }
  };

  return (
    <ScreenContainer>
      <ScrollView>
        <Column padding="300" gap="300">
          <Text style={[styles.title, { color: colors.text.default }]}>홈</Text>

          {status === 'authenticated' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                // 로그아웃 실패는 무시(상태 유지)
                signOut().catch(() => undefined);
              }}
              style={[styles.link, { borderColor: colors.stroke.subtle }]}
            >
              <Typography variant="body-md">로그아웃</Typography>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={status === 'loading'}
              onPress={() => navigation.navigate('Login')}
              style={[styles.link, { borderColor: colors.stroke.subtle }]}
            >
              <Typography variant="body-md">
                {status === 'loading' ? '...' : '로그인'}
              </Typography>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('Web', { path: '/premium/2284', title: '상세' })
            }
            style={[styles.link, { borderColor: colors.stroke.subtle }]}
          >
            <Text style={[styles.linkText, { color: colors.text.default }]}>
              상세 페이지 열기 (WebView)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('Web', { path: '/item/4053', title: '상세' })
            }
            style={[styles.link, { borderColor: colors.stroke.subtle }]}
          >
            <Text style={[styles.linkText, { color: colors.text.default }]}>
              상세 페이지 열기 (WebView)
            </Text>
          </Pressable>

          {themeQuery.isPending ? <ActivityIndicator /> : null}

          {themeQuery.isError ? (
            <Column gap="150">
              <Typography variant="body-md" color="subtle">
                테마를 불러오지 못했어요.
              </Typography>
              <Button
                label="다시 시도"
                color="secondary"
                appearance="outline"
                size="sm"
                onPress={() => themeQuery.refetch()}
              />
            </Column>
          ) : null}

          {themeQuery.data ? (
            <ThemeWidgetList widgets={themeQuery.data} onPressView={handlePressView} />
          ) : null}
        </Column>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700' },
  link: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[100],
    paddingHorizontal: spacing[300],
    alignItems: 'center',
  },
  linkText: { fontSize: 15, fontWeight: '500' },
});
```

주의: 기존 `styles.body`(flex:1)는 ScrollView 전환으로 제거. `onPressViewAll`은 이번 사이클 미연결(스펙 §7 — 테마 페이지 컨텍스트가 후속이므로 헤더에 "모두 보기"가 렌더되지 않는 것이 의도된 동작).

- [ ] **Step 2: 전체 검증**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm test`
Expected: 에러 0, 경고 0, 전부 PASS

- [ ] **Step 3: 커밋**

```bash
git add src/features/home
git commit -m "feat(home): 홈에 테마 위젯 리스트 통합 (recommend_top)"
```

---

### Task 8: 시뮬레이터 시각 검증

dev API가 인증 없이 200을 반환하므로(실측) 실데이터 렌더를 확인할 수 있다. **표시 확인만 필요** — 입력 주입 인프라 갭(idb 부재)과 무관.

- [ ] **Step 1: Metro/시뮬레이터 기동 확인** (이미 떠 있으면 재사용)

```bash
xcrun simctl list devices booted   # 부팅된 시뮬 확인
# Metro가 없으면: pnpm start (별도 터미널/백그라운드)
# 앱이 설치돼 있으면 시뮬에서 재실행, 없으면: pnpm ios (cold build — 오래 걸림)
```

- [ ] **Step 2: 홈 탭 스크린샷 캡처 + 확인 항목**

```bash
xcrun simctl io booted screenshot /tmp/theme-widgets-home.png
```

확인:
1. `text_only` 위젯들이 렌더됨 (dev 데이터 기준 "실시간 인기 급상승" 등) — 헤더(부제목+제목) + 라벨/제목 행
2. 라벨 색이 서버 값(사주=산호색, 프리미엄=금색 등)으로 표시
3. carousel/keyword 위젯은 **보이지 않음** (의도: 미구현 타입 스킵)
4. 스크롤 동작 (기존 버튼들 → 위젯 목록)
5. 행 탭 → WebView 상세 진입 (탭 1회는 시뮬 UI로 Martin 확인 또는 검수 항목으로 이연)
6. 다크모드(설정 앱 or 개발자 메뉴) 전환 시 텍스트/보더 색 추종 — 라벨 색만 서버 고정(의도)
7. 마지막 행의 하단 보더 — 현재 전 행에 렌더됨. Figma와 대조해 마지막 행 제외가 맞으면 조정(스펙 §7 미확정 항목)

- [ ] **Step 3: 조정 항목 기록** — 간격(위젯 간 gap 400=32px, 행 padding 150=12px, 헤더 gap 50=4px)은 Figma 실측 없이 잡은 초기값. 스크린샷 대조 후 어긋나면 이 태스크에서 조정 커밋 1개 허용:

```bash
git add -A && git commit -m "style(theme): 위젯 간격 시각 조정"   # 조정이 있을 때만
```

---

## 완료 기준

- [ ] `pnpm test` 전체 PASS (기존 113 + 신규 ~10)
- [ ] `pnpm exec tsc --noEmit` / `pnpm exec eslint .` 클린
- [ ] 시뮬레이터에서 dev 실데이터 text_only 위젯 렌더 확인
- [ ] 커밋 8개(±조정 1), 브랜치 `feature/theme-widgets`, **push는 하지 않음** (Martin 명시 요청 시에만)
