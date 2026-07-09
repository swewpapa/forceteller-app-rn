# Auth 로그인 플로우 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps는 checkbox(`- [ ]`) 추적.

**Goal:** 기존 auth 인프라 위에 **로그인 실동작 + 세션 유지 + 사용자(me/profile) 로드 + 로그인·로그아웃 후 전 탭 데이터 갱신**을 완성. auth/user api 파일 분리, me/profile은 react-query 소유.

**Architecture:** `auth-api`(인증)/`user-api`(사용자) 파일 분리 · `useMe`/`useProfile` react-query(토큰 enabled) · `auth-store`는 status/토큰만(user 제거) + signIn/signOut에 `queryClient.invalidateQueries()`. 스펙 `docs/superpowers/specs/2026-07-09-auth-login-flow-design.md`.

**Tech Stack:** RN, react-query, zustand(auth-store), Google/Firebase(기존).

**실측 요약** (회원 토큰 GET, scratchpad `users-me.json`/`users-me-profile.json`):
- `/api/users/me` → `{status, data:{id, name, email, avatarURL, isGuest, userKey, anonymous, active, admin, analytics{...}}}`
- `/api/users/me/profile` → `{status, data:{name, gender, calendar, year, month, day, hour, min, city{name,fullName,timeZoneId,lat,lng,...}, 간지 a/e/h/i/s/z, ...}}`
- `/api/users/me/invalidate` → 회원탈퇴(POST). **signOut과 별개**.

---

## Task 0: 브랜치 + 문서 커밋 (커밋 ①)

- [ ] **Step 1**: `git checkout -b feature/auth-login-flow main` (main은 방금 today까지 최신화됨)
- [ ] **Step 2**: 문서 커밋(scoped):
```bash
git add docs/superpowers/specs/2026-07-09-auth-login-flow-design.md docs/superpowers/plans/2026-07-09-auth-login-flow.md
git commit -m "docs(auth): 로그인 플로우 스펙·플랜

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1: user-types + user-api + normalize (커밋 ② TDD)

**Files:** Create `auth/types/user-types.ts`, `auth/api/user-api.ts`, `auth/api/normalize-user.ts`, Test `auth/__tests__/user-api.test.ts`

- [ ] **Step 1: 타입** `user-types.ts` (실측 기반 핵심 필드 — 확장은 소비처 붙일 때):
```ts
export type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  avatarURL: string | null;
  isGuest: boolean;
};

export type UserProfile = {
  name: string;
  gender: string;
  calendar: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  min: number | null;
  city: { name: string; fullName: string; timeZoneId: string } | null;
};
```
- [ ] **Step 2: normalize** `normalize-user.ts` — `normalizeMe(raw)`/`normalizeProfile(raw)`: `{status,data}` 봉투에서 `data` 언랩 + 핵심 필드 매핑(빈 문자열→null). raw 타입(`RawMeResponse`/`RawProfileResponse`)은 파일 내부 전용, 배럴 반출 금지. `scratchpad/users-me.json`·`users-me-profile.json`으로 필드 확인.
- [ ] **Step 3: user-api** `user-api.ts` — `createUserApi(client)`:
  - `getMe(): Promise<AuthUser>` → GET `/api/users/me` → normalizeMe
  - `getProfile(): Promise<UserProfile>` → GET `/api/users/me/profile` → normalizeProfile
  - `invalidate(): Promise<void>` → POST `/api/users/me/invalidate` (회원탈퇴)
  - `export const userApi = createUserApi(http)` 싱글턴 (theme/premium/today 선례)
- [ ] **Step 4: 실패 테스트** — mock client 주입: getMe/getProfile 경로 + 봉투 언랩 + normalize 검증(premium-api.test 선례).
- [ ] **Step 5**: 게이트(jest/tsc/eslint) + 커밋 `feat(auth): user-api (me/profile/invalidate) + normalize`

---

## Task 2: useMe / useProfile 훅 (커밋 ③)

**Files:** Create `auth/hooks/useMe.ts`, `auth/hooks/useProfile.ts`

- [ ] **Step 1: useMe** — react-query. queryKey `['user','me']`, `queryFn: () => userApi.getMe()`, `enabled`: 인증 상태(`useAuthStore(s=>s.status)==='authenticated'`). 미인증 시 미페칭.
- [ ] **Step 2: useProfile** — queryKey `['user','profile']`, `queryFn: () => userApi.getProfile()`, 동일 `enabled`.
- [ ] **Step 3**: 게이트 + 커밋 `feat(auth): useMe/useProfile (react-query, 토큰 enabled)`

---

## Task 3: auth-store 무효화 + auth-api 정리 + 소비처 (커밋 ④)

**Files:** Modify `auth/stores/auth-store.ts`, `auth/api/auth-api.ts`, `auth/index.ts`, 소비처(login-screen 등)

- [ ] **Step 1: auth-api 정리** — `AuthUser` 타입을 `user-types.ts`로 이동(auth-api에서 제거, import 갱신). `ExchangeResult`는 스펙 §9대로 serviceToken 중심으로 유지하되, **응답 형태(B1)는 실제 네이티브 로그인 QA에서 확정** — 이번엔 현행 시그니처 보존(user는 me로 대체되므로 exchangeToken 응답 user는 미사용).
- [ ] **Step 2: auth-store 무효화** — `user` 필드/세팅 제거. `signIn` 성공 말미 + `signOut` 말미에 `queryClient.invalidateQueries()`(인자 없이 전체). `queryClient`는 `@/shared/lib`에서 import.
```ts
// signIn: ...serviceToken 저장 + status authenticated 후
queryClient.invalidateQueries();
// signOut: ...토큰 clear + status guest 후
queryClient.invalidateQueries();
```
- [ ] **Step 3: 소비처 정리** — `grep -rn "\.user\b\|s=>s.user\|state.user" src/features/auth` + auth-store user 사용처 확인. `login-screen` 등이 user를 쓰면 `useMe`로 전환. (현재 login-screen은 signIn만 사용 — 영향 최소 예상, grep으로 확인)
- [ ] **Step 4: 배럴** — `auth/index.ts`에 `useMe`/`useProfile`/`userApi`(필요 시) export 추가.
- [ ] **Step 5**: 게이트(전체 test/tsc/eslint — auth-store test 갱신 포함) + 커밋 `feat(auth): auth-store 데이터 무효화 + AuthUser user-types 이관`

---

## Task 4: 최종 리뷰 + finishing

- [ ] **Step 1: 게이트** — `pnpm test`/`tsc`/`eslint` 전체.
- [ ] **Step 2: 최종 통합 리뷰** — main..HEAD 전체. auth/user api 분리, me/profile react-query, auth-store 무효화, AuthUser 이관, 소비처 정합, 스켈레톤 잔여 없음.
- [ ] **Step 3: 시각/동작 검증** — **네이티브 Google Signin 빌드 필요** → Martin 수동 QA(실로그인 → me/profile 로드 → 탭 데이터 갱신 → 로그아웃 → 재시작 세션 유지). RNGoogleSignin 이슈 이연 전례.
- [ ] **Step 4: finishing-a-development-branch** — push+PR은 **Martin 명시 승인 후**.

---

## 범위 밖 (후속)

- `updateProfile` + `useUpdateProfile` mutation — 프로필 편집 화면 붙일 때(경로/메서드 실측 후).
- more 화면(프로필 표시, `useProfile` 소비).
- 회원탈퇴 플로우(확인 UI·후처리 — `invalidate` API는 이번에 정의).
- 게이트 활성 정책(requiresAuth 강제 로그인), 로그인 진입 UI.
- exchangeToken 응답(B1) 정밀 확정, 네이티브 빌드, [DEBUG] 로그 제거, 국가별 provider.
