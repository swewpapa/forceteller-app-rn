# 인증 가드 Phase A — 메커니즘 완성 설계

**작성일**: 2026-07-13
**전제**: 구조 점검(Artifact)에서 도출. 가드 3중 방어(useAppNavigation 사전 가드 + useAuthGuard 백스톱 + LoginScreen redirect)는 기구현·양호. `ROUTE_GUARDS = {}` 비활성이며, 활성화 전 메워야 할 갭 4개를 이 브랜치에서 해결한다. **활성화(선언 채우기)는 Phase B**(보호 페이지 목록 = 제품 결정) — 이 브랜치에서 ROUTE_GUARDS는 계속 `{}`.

## 해결하는 갭

| # | 갭 | 해법 |
|---|---|---|
| P0 | 가드 단위가 라우트 이름뿐 → Web 부분 보호 불가 | `requiresAuth: boolean \| (params) => boolean` predicate + Web path 프리픽스 헬퍼 |
| P0 | 401(토큰 만료) 미처리 → status 부패 | 응답 인터셉터 → `expireSession()` (App 레이어 배선, 기존 request 인터셉터 선례) |
| P1 | 백스톱 모달 dismiss 감금 루프 | 백스톱 정책: 같은 라우트 재감지 시 Login 재오픈 대신 안전 라우트(Tabs) 이탈 |
| P1 | 탭 라우트 가드 선언 불가(키 공간 불일치) | 전역 `AppRoutes.GuardableParamList` = Stack ∪ Tab 키 |
| P2 | `(nav as any)` 3곳 산재 | `navigateUnsafe` 헬퍼 1곳 격리 |
| P2 | 부팅 `loading` 오탐 가능성 | evaluator가 `loading`은 판정 보류(리다이렉트 안 함) |

## 설계

### 1. 키 공간 — `AppRoutes.GuardableParamList` (전역)

`navigation-types.ts`(app)에 전역 선언 추가. features/auth는 app을 import하지 않고 키만 참조(기존 `ReactNavigation.RootParamList` 선례).

```ts
declare global {
  namespace AppRoutes {
    /** 가드 선언 가능한 전체 라우트(스택 + 탭 leaf). getCurrentRoute()가 leaf를 반환하므로 탭 포함. */
    interface GuardableParamList extends RootStackParamList, RootTabParamList {}
  }
}
```

- 탭 가드의 강제 지점은 **백스톱뿐**(탭바 탭은 useAppNavigation을 안 거침) — 수용, 문서화.

### 2. 가드 규칙 + 평가기 (`features/auth/guard/`)

```ts
// route-guards.ts
export type RouteGuardRule = {
  requiresAuth: boolean | ((params: object | undefined) => boolean);
};
export const ROUTE_GUARDS: Partial<Record<keyof AppRoutes.GuardableParamList, RouteGuardRule>> = {};
// Phase B 활성화 예시(웹 feature import 없이 구조적 타입으로):
//   Web: { requiresAuth: (p) => webPathRequiresAuth((p as { path?: string })?.path ?? '') },

// evaluate-guard.ts — 순수, 테스트 대상
export function shouldRedirectToLogin(rule, params, status): boolean;
// status 'authenticated' → false / 'loading' → false(판정 보류, 백스톱이 다음 이벤트에 재검사)
// 'guest' → requiresAuth가 함수면 params로 평가, 불린이면 그대로
```

```ts
// web-guard.ts — 순수. 프리픽스 경계 매칭(/my는 /my·/my/x 매치, /mypage 미매치)
export const GUARDED_WEB_PATH_PREFIXES: string[] = []; // Phase B에서 채움
export function webPathRequiresAuth(path: string): boolean;
```

### 3. 401 → 세션 만료 (auth-store + 인터셉터)

```ts
// auth-store: expireSession 액션 추가
// status가 'authenticated'일 때만 동작(중복 401 dedupe): 토큰 clear + guest + invalidateQueries.
// googleProvider.signOut()은 호출하지 않음 — 만료는 로컬 세션 정리(원격 로그아웃 아님).

// api/session-expired-interceptor.ts
export function createSessionExpiredInterceptor(): (error: unknown) => never;
// ApiError(kind='http', status=401) → expireSession() 후 rethrow(복구 안 함 — 호출부 에러 유지).
```

배선: `App.tsx` 모듈 스코프에서 `http.interceptors.response.use(undefined, createSessionExpiredInterceptor())` — 기존 request 인터셉터와 같은 위치·사유(순환 회피, app이 연결).

### 4. 백스톱 dismiss 정책 (`use-auth-guard` 재작성)

순수 정책 함수로 분리해 테스트:

```ts
// backstop-policy.ts
export type BackstopAction = 'none' | 'login' | 'fallback';
export function decideBackstopAction(input: {
  redirect: boolean;        // evaluator 결과
  routeKey: string;         // getCurrentRoute().key (인스턴스 고유)
  pendingKey: string | null; // 직전에 Login을 띄운 원인 라우트 key
}): BackstopAction;
// redirect=false → 'none'(pending 해제)
// redirect=true && pendingKey===routeKey → 'fallback'  ← Login이 로그인 없이 닫혀 돌아옴(감금 루프 차단)
// redirect=true(그 외) → 'login'(pending=routeKey)
```

- `'fallback'` = `Tabs`로 navigate(네이티브 스택에서 기존 라우트로 pop). Login 라우트 자체는 검사 제외.
- 사전 가드 경로의 dismiss는 원래 화면에 머무는 것이므로 정책 불필요(진입 자체를 안 했음).

### 5. `navigateUnsafe` 헬퍼 (`features/auth/navigation/navigate-unsafe.ts`)

RN v7 navigate 오버로드가 union RouteName에서 `[never,never]`로 수렴하는 타입 한계의 any-캐스트를 한 함수로 격리. use-app-navigation / use-auth-guard / login-screen 3곳이 사용.

## 하지 않는 것 (Phase B/후속)

- ROUTE_GUARDS·GUARDED_WEB_PATH_PREFIXES 채우기(제품 결정 후) 및 실기기 QA
- 보호 화면 선마운트 완화(`enabled: isAuthenticated` 쿼리 게이트) — 화면 개발 시 적용 규칙
- LoginScreen 실패 토스트, refresh_token 활용(별도 논의)
- 딥링크 linking config

## 검증

- 유닛: evaluate-guard / web-guard / backstop-policy / expireSession / 인터셉터(401·비401)
- 스모크(시뮬레이터): ROUTE_GUARDS를 임시로 켜서(Web) 가드 진입→Login→dismiss→fallback→로그인→복귀 확인 후 원복(미커밋)

## 커밋 계획

① 스펙 → ② 가드 코어(키 공간+평가기+web-guard+정책, TDD) → ③ 401(스토어+인터셉터+배선, TDD) → ④ 네비 정렬(navigateUnsafe+훅 3곳 재작성) → 검증/스모크
