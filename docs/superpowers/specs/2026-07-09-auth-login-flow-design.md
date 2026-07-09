# Auth 로그인 플로우 설계

> 2026-07-09 브레인스토밍 확정본. 기존 auth 인프라(Google/Firebase/route-guard/auth-store) 위에 **로그인 실동작 + 세션 유지 + 사용자(me/profile) 로드 + 로그인·로그아웃 후 전 탭 데이터 갱신**을 완성한다. auth/user 관심사 분리, me/profile은 react-query 소유. [[auth-merge-status]] 후속. [[pr-workflow]] 적용.

## 1. 목표

Martin 요구 4가지:
1. **로그인 동작** — Google 로그인 플로우 실동작(기존 코드 활용).
2. **세션 유지** — 앱 재시작해도 로그인 유지(토큰 복원 + user 재로드).
3. **사용자 불러오기** — 로그인/복원 후 `me`(기본) + `profile`(사주) 로드.
4. **데이터 갱신** — 로그인/로그아웃 시 모든 탭(home/premium/today) + user 데이터 refetch.

## 2. 현황 (기존 auth)

- **있음**: Google→Firebase→`exchangeFirebaseToken`→serviceToken 저장→`authenticated` 플로우. route-guard(진입 전 + 딥링크 백스톱), `AuthProvider` 추상화, `auth-store`(status/signIn/signOut/restore).
- **미완**: (3) restore 시 user 미페칭·user 조회 API 없음, (4) signIn/signOut에 query 무효화 없음, `exchangeFirebaseToken` 응답 형태(B1) 미확정, 네이티브 Google Signin 빌드 미검증.

## 3. 아키텍처

### 3.1 auth-api / user-api 관심사 분리
경로가 갈리므로(`/api/auth/*` vs `/api/users/me/*`) 도메인 분리(`create<Domain>Api` 규약):
- **`auth-api`**(기존): `exchangeFirebaseToken` — Firebase 토큰 → 서비스 토큰(순수 인증).
- **`user-api`**(신규 `createUserApi`):
  - `getMe()` → `GET /api/users/me` (계정 기본)
  - `getProfile()` → `GET /api/users/me/profile` (사주 프로필)
  - `updateProfile(patch)` → 프로필 변경 (mutation, 편집 화면은 후속이나 API는 정의)
  - `invalidate()` → `POST /api/users/me/invalidate` (**회원탈퇴 — signOut과 별개 관심사**, 이번엔 API 정의까지)

### 3.2 me/profile = react-query 소유
- `useMe()` — queryKey `['user','me']`, 토큰 있을 때만 `enabled`.
- `useProfile()` — queryKey `['user','profile']`, 토큰 있을 때만 `enabled`.
- `useUpdateProfile()` — mutation, `onSuccess`에 profile 무효화(편집 화면 붙일 때 소비).
- **근거**: profile은 mutable + 다중 소비처(more/편집/…)라 react-query의 캐시 공유·mutation 무효화가 정확히 들어맞는다. 비-컴포넌트 접근은 `queryClient.getQueryData(['user','me'])`.

### 3.3 auth-store = 인증 상태만
- 유지: `status`(loading/guest/authenticated), `signIn`/`signOut`/`restore`, 토큰(authTokenStore).
- **제거**: `user` 필드(me는 react-query 소유). `AuthUser`도 auth-api→user-api로 이동.
- status는 토큰 유무로 결정, user 정보는 useMe/useProfile.

### 3.4 데이터 갱신 (전체 무효화)
- `signIn` 성공 후, `signOut` 후 → `queryClient.invalidateQueries()` (인자 없는 전체 무효화).
- me/profile도 query라 자동 포함 + today/premium/theme 전부 refetch. 로그인 상태 반영(비회원↔회원 데이터 전환)이 한 번에.
- auth-store가 `queryClient`를 import해 signIn/signOut 말미에 호출.

## 4. 데이터 모델 (`user-api` / `user-types`)

`{status, data}` 봉투 → `data` 정규화. raw 타입은 api/ 밖 반출 금지.

```ts
// me — 계정 기본 (실측: id/name/email/avatarURL/isGuest/userKey/anonymous/active/admin/analytics…)
export type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  avatarURL: string | null;
  isGuest: boolean;
  // 그 외 필드는 소비처(more) 붙일 때 확장 — 이번엔 핵심만
};

// profile — 사주 프로필 (실측: year/month/day/hour/min, gender, calendar, city{...}, 간지 a/e/h/i/s/z…)
export type UserProfile = {
  name: string;
  gender: string;
  calendar: string;
  year: number; month: number; day: number;
  hour: number | null; min: number | null;
  city: { name: string; fullName: string; timeZoneId: string; /* … */ } | null;
  // 간지·기타 필드는 more/편집 화면 붙일 때 확장
};
```
- 정확한 필드/정규화는 구현 Task에서 `scratchpad/users-me.json`·`users-me-profile.json` 재확인 후 확정. 이번엔 조회(read) 중심 — 소비처(more/편집)가 요구하는 필드만 점진 확장.

## 5. 플로우

- **signIn**: `googleProvider.signIn()` → Firebase idToken → `authApi.exchangeFirebaseToken()` → serviceToken → `authTokenStore.set` → status `authenticated` → **`queryClient.invalidateQueries()`**. (useMe/useProfile가 토큰 생기며 자동 페칭)
- **restore**(앱 시작, `App.tsx`): 토큰 있으면 status `authenticated`(즉시) → useMe/useProfile 자동 페칭. 없으면 `guest`.
- **signOut**: `googleProvider.signOut()` → `authTokenStore.clear()` → status `guest` → **`queryClient.invalidateQueries()`**.
- **invalidate**(회원탈퇴): `userApi.invalidate()` 호출 (탈퇴 확인 UI·후처리는 범위 밖 — signOut과 엮지 않음).

## 6. 구조 (파일)

```
src/features/auth/
  api/auth-api.ts            ← exchangeFirebaseToken (AuthUser는 user-types로 이동)
  api/user-api.ts            ← createUserApi (getMe/getProfile/updateProfile/invalidate)
  api/normalize-user.ts      ← raw → 도메인 (필요 시)
  types/user-types.ts        ← AuthUser, UserProfile
  hooks/useMe.ts             ← react-query
  hooks/useProfile.ts        ← react-query
  hooks/useUpdateProfile.ts  ← mutation
  stores/auth-store.ts       ← user 필드 제거, signIn/signOut에 queryClient 무효화
  (기존 providers/guard/navigation 유지)
  index.ts                   ← 배럴 (useMe/useProfile 등 추가 export)
```
- **관심사 분리는 feature가 아닌 api/hooks 파일 레벨**(Martin 확정, 옵션 b): user 정보(me/profile)는 로그인 세션에 종속적이라 auth와 한 feature로 두되, `auth-api`(인증) ↔ `user-api`(사용자)를 파일로 분리한다. 별도 feature로 빼면 user→auth(토큰) 의존이 레이어를 복잡하게 하므로 피한다. user 도메인이 커지면 그때 feature 승격 검토.
- me/profile은 react-query 독립 소유(auth-store가 user를 참조하지 않음).

## 7. 사이드이펙트

- `auth-store`에서 `user` 필드 제거 → 소비처 확인(`login-screen` 등 `useAuthStore(s=>s.user)` 사용처). 현재 login-screen은 signIn만 쓰므로 영향 적음 — 구현 시 grep 확인.
- `auth-api`의 `AuthUser` → `user-api`로 이동(import 경로 갱신).
- `queryClient` 무효화가 auth-store에 추가 → 순환 참조 주의(auth-store→queryClient는 shared/lib, 단방향 OK).
- 네이티브 Google Signin 빌드는 실기기/시뮬 검증 필요(RNGoogleSignin — 기존 시각검증 이연 원인).

## 8. 테스트

- `user-api` 팩토리(생성자 주입) — getMe/getProfile/invalidate.
- `normalize-user`(있으면) 단위.
- `auth-store` signIn/signOut → queryClient 무효화 호출 검증(mock queryClient).
- 실로그인·세션 유지는 네이티브 빌드 필요 → Martin 수동 QA(전례).

## 9. 미해결 / 구현 시 확정

- **B1**: `exchangeFirebaseToken` 응답 형태 — me/profile 별도 API가 있으니 exchangeToken은 **serviceToken만** 반환하면 충분(user는 getMe). 실제 응답 확인 후 `ExchangeResult` 정리(현재 `{serviceToken, user}` → `{serviceToken}` 가능성).
- me/profile 정규화 상세 필드(간지 등)는 소비처(more) 요구 시 확장.

## 10. 범위 밖 (후속)

- **more 화면**(프로필 표시) — 별도 작업, `useProfile()` 소비.
- **프로필 편집 화면** — `useUpdateProfile` mutation 소비.
- **회원탈퇴 플로우** — 확인 다이얼로그·후처리·화면(invalidate API는 이번에 정의).
- **게이트 활성 정책** — requiresAuth 화면 강제 로그인은 별도 결정(현재 비활성 유지).
- **로그인 진입 UI** — 어디서 로그인 트리거할지(more 버튼/게이트)는 소비처 몫.
- 국가별 provider(애플/카카오), 네이티브 빌드 설정, [DEBUG] 로그 제거.
