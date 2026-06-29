# 소셜 로그인(Firebase Auth + 구글) + 게스트 우선 모달 게이트 설계

> 상태: **설계 — 사용자 리뷰 대기**. 브레인스토밍으로 도출(2026-06-29).
> 작업 순서: **이 인증 작업 먼저 → 이후 네비게이션 static 마이그레이션**(별도 작업).
> 범위 노트: 웹뷰 세션 공유·서비스 토큰 갱신·401 자동 처리는 **후속 스펙**으로 분리.

## Goal

비회원(게스트)도 앱을 자유롭게 보되, **로그인이 필요한 페이지 진입 시 로그인 모달**을 띄우고, 로그인 성공 후 원래 목적지로 진입시킨다. 인증은 **기존 서비스와 동일하게 Firebase Auth 기반**이며, 첫 프로바이더는 **구글**이다. 국가별로 공급자가 다르므로 **프로바이더 추상화**(Firebase credential 획득) 위에 구글을 첫 구현체로 얹는다.

목적 우선순위: **(1) 구글→Firebase 로그인/로그아웃 + 인증 상태**, **(2) 보호 라우트 게이트(모달 유도 + redirect 복원)**.

## 범위

| 포함 (이번 스펙) | 제외 (후속 스펙) |
|---|---|
| 구글 로그인 → **Firebase ID token** → 백엔드 교환 → 서비스 토큰 저장 | 웹뷰(WebView) 세션 공유 |
| 전역 인증 상태(`auth-store`) + 앱 시작 시 세션 복원 | **서비스 토큰** 갱신 / 401 자동 재인증 |
| 게스트 우선 + 보호 라우트 모달 게이트 + 로그아웃 | 카카오·애플·네이버 등 추가 구현 |
| 프로바이더 추상화(구글 1개 구현) | |

## 브레인스토밍 결정 이력

1. **로그인 주체**: 소셜/SSO → **구글**(국가별 공급자 상이, 추상화 필요)
2. **인증 스택**: **Firebase Auth(@react-native-firebase)** — 기존 서비스가 Firebase 기반. RN 앱엔 **신규 도입**.
3. **토큰 교환**: 구글 로그인 → **Firebase ID token** 발급 → 백엔드 POST → 서비스 토큰 발급받아 저장.
4. **상태관리**: **zustand**(기존 `today-store` 패턴 일관)
5. **게이트**: 게스트 우선이라 전면 게이트(조건부 렌더링) ✗ → **모달 + 가드**
6. **가드 가로채기**: 앱 내는 **이동 전용 훅(`useAppNavigation`)** 진입 전 차단 + ESLint 강제. 딥링크는 훅 밖이라 **중앙 리스너 백스톱** 추가(딥링크 사용 확정)
7. **순서**: 인증 먼저, static 마이그레이션 나중

## 확정된 사실 (공식 문서 검증 완료)

출처: [Modal](https://reactnavigation.org/docs/modal), [Auth flow](https://reactnavigation.org/docs/auth-flow), [Troubleshooting](https://reactnavigation.org/docs/troubleshooting), [RNFirebase social-auth](https://rnfirebase.io/auth/social-auth), [google-signin docs](https://react-native-google-signin.github.io/docs/).

- **인증 = Firebase Auth + google-signin 조합**(RNFirebase 공식 패턴):
  ```js
  const result = await GoogleSignin.signIn();              // 구글 idToken (v13+: result.data.idToken)
  const cred = GoogleAuthProvider.credential(result.data.idToken);
  const userCred = await signInWithCredential(getAuth(), cred);  // Firebase 로그인
  const firebaseIdToken = await userCred.user.getIdToken();      // → 서버로
  ```
  google-signin은 **구글 idToken 획득용**(Original 무료 모듈; Universal은 유료), Firebase가 **인증 통합 레이어**.
- **모달은 `presentation: 'modal'` + `navigate('Login')`로 연다** — static/dynamic API **동일**(*"distinction lies in configuration syntax, not navigation behavior"*). 현재 dynamic 그대로 가능, static 전환은 인증과 독립.
- **auth-flow의 토큰 복원/signIn/signOut 로직**은 차용하되 **zustand로 동일 역할** 대체. 단 **딥링크 자동 복원**(`UNSTABLE_routeNamesChangeBehavior`)은 **전면 게이트 전용**이라 게스트 우선인 우리와 충돌 → **딥링크 redirect를 직접 처리**.
- **함수/콜백을 navigation params로 넘기면 안 됨**(*"Non-serializable values…"* 경고). → `redirect`는 **직렬화 가능한 디스크립터**로.
- **Firebase ID token은 Firebase가 만료 시 자동 갱신**(`getIdToken`) — 후속의 토큰 갱신 부담을 줄임. (단 *서비스 토큰* 갱신은 서버 정책, 별개)

## 현재 repo 정합 (재사용 / 신규)

- **재사용**: `authTokenStore`(MMKV **암호화**, `get/set/clear` — [auth-token.ts:38](src/shared/lib/auth-token.ts#L38)), `createAuthRequestInterceptor`(`X-Auth-Token` 주입, **헤더명 TODO**), `http`(fetch + response 인터셉터 슬롯), [App.tsx:9](src/app/App.tsx#L9)의 인터셉터 등록, zustand 5 / react-query 5, MMKV 동기 읽기.
- **신규 도입**: `@react-native-firebase/app` + `@react-native-firebase/auth` + `@react-native-google-signin/google-signin`. **이 RN 앱엔 Firebase 미설치 상태**(package.json 확인).
- 네비게이션: `@react-navigation` 7.x **dynamic API**(현재). RN 0.85 + New Arch.

## 데이터 흐름

```
[게스트] 보호 진입 시도
  ├─ 앱 내 이동  → useAppNavigation 이 진입 전 차단
  └─ 딥링크 진입 → use-auth-guard(중앙 리스너)가 진입 후 감지
        ↓ (미인증)
  navigate('Login', { redirect })                       # redirect = { screen, params } (직렬화)
        ↓ GoogleSignin.signIn() → 구글 idToken
        ↓ GoogleAuthProvider.credential → signInWithCredential(getAuth()) → Firebase user
        ↓ user.getIdToken() → Firebase ID token
        ↓ authApi.exchange(firebaseIdToken) → { serviceToken, user }
        ↓ authTokenStore.set(serviceToken) + authStore.status = 'authenticated'
  모달 닫고 → navigate(redirect.screen, redirect.params)
```

## 아키텍처 / 디렉토리

```
src/features/auth/
├─ screens/login-screen.tsx      # 모달 (presentation: 'modal'), redirect param 처리
├─ stores/auth-store.ts          # zustand: status / user / signIn / signOut / restore
├─ providers/
│  ├─ auth-provider.ts           # 인터페이스: signIn(): Promise<{ firebaseIdToken }>, signOut()
│  ├─ firebase.ts                # Firebase Auth 래퍼 (signInWithCredential / getIdToken / signOut)
│  └─ google-provider.ts         # 구글: google-signin → 구글토큰 → Firebase credential
├─ api/auth-api.ts               # exchange(firebaseIdToken) → 서비스 토큰
├─ guard/
│  ├─ route-guards.ts            # ROUTE_GUARDS 선언 (보호 라우트 한 곳)
│  └─ use-auth-guard.ts          # 중앙 state 리스너 (딥링크/훅 밖 백스톱)
├─ navigation/use-app-navigation.ts  # 앱 내 이동 + 진입 전 가드 (ESLint로 사용 강제)
└─ index.ts
# ※ auth = foundation feature: home/today/… 가 @/features/auth 에서 useAppNavigation 등을 import (단방향)
```

## 컴포넌트

| 컴포넌트 | 책임 | 비고 |
|---|---|---|
| `auth-store` | `status: 'loading'\|'guest'\|'authenticated'`, `user`, `signIn`/`signOut`/`restore` | zustand. 복원은 MMKV 동기 |
| `auth-provider` | 프로바이더 인터페이스(Firebase credential 획득 추상화) | `signIn(): Promise<{ firebaseIdToken: string }>`, `signOut()` |
| `firebase.ts` | Firebase Auth 래퍼 | `signInWithCredential`/`getIdToken`/`signOut`, 초기화 |
| `google-provider` | 구글 구현체 | google-signin→구글idToken→`GoogleAuthProvider.credential`→Firebase. 국가별 공급자는 같은 인터페이스로 추가 |
| `auth-api` | **Firebase ID token**→서비스 토큰 교환 | `http.post`. **백엔드 계약 확정 필요(미확정)** |
| `use-app-navigation` | 앱 내 이동 진입 전 가드 | `navigate/push/replace`까지 가드(우회 차단) |
| `use-auth-guard` | 딥링크/훅 밖 진입 사후 가드 | `RootNavigator`에 1회 장착, 같은 `ROUTE_GUARDS`/모달 재사용 |
| `route-guards` | 보호 라우트 선언 | `ROUTE_GUARDS` 한 곳 |
| `login-screen` | 모달 로그인 UI | `redirect` param으로 목적지 복원 |

## 게이트 설계 (하이브리드 — 둘이 같은 가드맵·모달 공유)

```ts
// guard/route-guards.ts — 보호 선언 한 곳
export const ROUTE_GUARDS = {
  Web: { requiresAuth: true },
} satisfies Partial<Record<keyof RootStackParamList, { requiresAuth: boolean }>>;

// features/auth/navigation/use-app-navigation.ts — 앱 내 이동(진입 전 차단)
export function useAppNavigation() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const status = useAuthStore((s) => s.status);
  const guarded = (screen, params) => {
    if (status !== 'authenticated' && ROUTE_GUARDS[screen]?.requiresAuth) {
      nav.navigate('Login', { redirect: { screen, params } });
      return;
    }
    nav.navigate(screen, params);
  };
  return useMemo(() => ({ navigate: guarded, push: guarded, replace: guarded, goBack: nav.goBack }), [nav, status]);
}

// guard/use-auth-guard.ts — 딥링크/훅 밖 진입(진입 후 백스톱)
export function useAuthGuard(navRef: NavigationContainerRef<RootStackParamList>) {
  const status = useAuthStore((s) => s.status);
  useEffect(() => navRef.addListener('state', () => {
    const route = navRef.getCurrentRoute();
    if (status !== 'authenticated' && ROUTE_GUARDS[route?.name]?.requiresAuth) {
      navRef.navigate('Login', { redirect: { screen: route.name, params: route.params } });
    }
  }), [status, navRef]);
}
```

```jsonc
// .eslintrc — README가 아니라 규칙으로 강제 (use-app-navigation.ts만 예외)
"no-restricted-imports": ["error", { "paths": [{
  "name": "@react-navigation/native",
  "importNames": ["useNavigation"],
  "message": "useNavigation 직접 사용 금지. useAppNavigation으로 이동하세요 (인증 가드 우회 방지)."
}]}]
```

## 세션 복원

앱 시작 시 `authTokenStore.get()`(MMKV 동기)으로 **서비스 토큰** 존재 여부 → status 즉시 결정. **Firebase는 자체 세션을 영속**하므로(`getAuth().currentUser` / `onAuthStateChanged`), Firebase user가 있으면 `getIdToken()`으로 서비스 토큰 재발급도 가능. **서버 토큰 검증(만료/유효성)은 후속 스펙**.

## 에러 / 엣지케이스

- 구글 로그인 **취소** → 조용히 무시.
- **구글 idToken 없음** / **Firebase `signInWithCredential` 실패**(잘못된 credential·네트워크) → 사용자 메시지 + 재시도.
- **교환 실패**(네트워크·5xx) / **401·거부** → 로그인 실패(토큰 저장 안 함), Firebase 세션도 정리(`signOut`) 검토.
- **redirect 없음**(직접 로그인 진입) → 모달만 닫음.
- Firebase 세션은 있는데 서비스 토큰 없음(불일치) → 복원 시 `getIdToken`으로 재교환.

## 테스트 전략

기존 `auth-token.test.ts`/`http.test.ts` 패턴 따름.
- `auth-store`: 복원/signIn/signOut **상태 전이**.
- 가드 로직: (보호/비보호) × (인증/게스트) 매트릭스.
- `auth-api`: mock `http`로 교환 성공/실패.
- `google-provider`/`firebase`: mock google-signin·mock `@react-native-firebase/auth`로 credential→firebaseIdToken 경로.

## 사이드이펙트

- `root-navigator.tsx`: `Login` 모달 그룹 추가, `useAuthGuard` 장착.
- `home-screen.tsx` 등: `useNavigation` → `useAppNavigation` 교체.
- `.eslintrc`: `no-restricted-imports` 추가.
- **네이티브**: Firebase/google-signin 네이티브 설정(아래 미확정 2).
- **static 마이그레이션(#7) 시**: `useAppNavigation`·`root-navigator`·route 타입만 static 문법 조정.

## 미확정 / 리스크 (구현 착수 전 해소 필요)

1. **백엔드 교환 계약 [확정]** — 서비스 토큰을 `X-Auth-Token` 헤더로 전송(기존 `createAuthRequestInterceptor` 그대로). [auth-token.ts:5](src/shared/lib/auth-token.ts#L5)의 `AUTH_HEADER` TODO 해소(`X-Auth-Token` 확정). **단 refresh-token 요청에는 `X-Auth-Token` 제외** — refresh는 후속 스펙이며, 도입 시 인터셉터에 해당 요청 skip 처리 추가. (남은 확인: 교환 엔드포인트 경로·응답 바디 형식)
2. **네이티브 설정**(bare 프로젝트) — Firebase: `GoogleService-Info.plist`(iOS)·`google-services.json`(Android)·`google-services` Gradle 플러그인·`pod install`. google-signin: iOS URL scheme·`webClientId`/`iosClientId`, Android SHA-1. EAS config plugin 의존 불가(직접).
3. **@react-native-firebase + google-signin의 New Arch/RN 0.85 호환 버전** — 설치 시 빌드 검증(**확인 필요** — 공식 문서에 호환 명시 없음).
4. **레이어 의존 방향 [확정: (a) foundation feature]** — `auth`를 **foundation feature**로 취급한다. `use-app-navigation`·가드·store·provider를 `features/auth`에 응집하고, 다른 feature는 `@/features/auth`에서 import(예: `home` → `auth`). 규칙: **`auth`만 다른 feature가 import 가능**, `auth`는 다른 feature를 import하지 않음(단방향, 순환 방지). `RootStackParamList`는 전역 등록(`ReactNavigation.RootParamList`)을 참조해 app import를 피한다.

## 후속 스펙 (분리)

- **웹뷰 세션 공유**: 네이티브 서비스 토큰을 WebView에 주입/쿠키 동기화.
- **세션 견고화**: 서비스 토큰 갱신·401 자동 재인증/로그아웃·만료 토큰 서버 검증. (Firebase ID token 갱신은 SDK 자동)
- **네비게이션 static 마이그레이션**: 본 인증 작업 완료 후(#7).
