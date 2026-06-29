# 인증 (Firebase + 구글 소셜 로그인) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게스트 우선 앱에서 구글 로그인(Firebase Auth)으로 서비스 토큰을 발급받고, 보호 라우트 진입 시 로그인 모달로 유도하는 인증을 구현한다.

**Architecture:** `auth` = foundation feature. 구글 SDK → Firebase ID token → 서버 → 서비스 토큰(`authTokenStore`, `X-Auth-Token`). 게이트는 `useAppNavigation`(진입 전 차단) + `use-auth-guard` 중앙 리스너(딥링크 백스톱) 하이브리드. 상태는 zustand `auth-store`.

**Tech Stack:** `@react-native-firebase/app`+`auth`, `@react-native-google-signin/google-signin`, zustand 5, `@react-navigation` 7(dynamic), MMKV.

**Spec:** [docs/superpowers/specs/2026-06-29-auth-google-signin-design.md](../specs/2026-06-29-auth-google-signin-design.md)

---

## 선행 조건 (Blocking — 추측 불가, 외부 확정 필요)

> 아래는 코드로 추측 못 한다. 표시된 Task 착수 전 확정. 그 외 Task는 이것과 무관하게 병행 진행 가능.

### B1. 백엔드 교환 계약 → **Task 5(auth-api) blocking**
- 교환 **엔드포인트** 경로 (예: `POST /v1/auth/firebase`)
- **요청** 바디: Firebase ID token 필드명
- **응답** 바디: 서비스 토큰 필드명, user 정보 형태
- [확정] 서비스 토큰은 `X-Auth-Token` 헤더로 전송. refresh 요청은 제외(후속).

### B2. Firebase 콘솔 + 네이티브 설정 → **Task 2(네이티브 설정) blocking**
- Firebase 프로젝트 + iOS/Android 앱 등록
- `GoogleService-Info.plist`(iOS), `google-services.json`(Android) 다운로드 (사용자)
- `webClientId`(google-signin `configure`용), iOS reversed client id(URL scheme)

---

## 파일 구조

**생성** (`src/features/auth/`, foundation feature):
| 파일 | 책임 |
|---|---|
| `providers/auth-provider.ts` | 프로바이더 인터페이스 |
| `providers/firebase.ts` | Firebase Auth 래퍼 |
| `providers/google-provider.ts` | 구글 구현체 |
| `api/auth-api.ts` | Firebase ID token → 서비스 토큰 교환 (B1) |
| `stores/auth-store.ts` | zustand: status/user/signIn/signOut/restore |
| `guard/route-guards.ts` | `ROUTE_GUARDS` 선언 |
| `navigation/use-app-navigation.ts` | 앱 내 이동 + 진입 전 가드 |
| `guard/use-auth-guard.ts` | 중앙 state 리스너(딥링크 백스톱) |
| `screens/login-screen.tsx` | 모달 로그인 화면 |
| `index.ts` | 배럴 (foundation exports) |

**수정**:
- `src/app/navigation/navigation-types.ts` (`Login` 라우트)
- `src/app/navigation/root-navigator.tsx` (`Login` 모달 + `useAuthGuard`)
- `src/features/home/screens/home-screen.tsx` (`useNavigation`→`useAppNavigation`)
- ESLint config (`no-restricted-imports`)

**네이티브** (B2): `ios/`(plist, AppDelegate, Info.plist, Podfile), `android/`(json, build.gradle)

---

## Task 1: 의존성 설치

**Files:** `package.json`, `ios/Podfile.lock`

- [ ] **Step 1: 패키지 설치**

Run: `pnpm add @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin`

- [ ] **Step 2: iOS pod 설치**

Run: `cd ios && pod install && cd ..`
Expected: Firebase/GoogleSignIn pods 추가됨

- [ ] **Step 3: New Arch 빌드 검증 (스펙 미확정 3 해소)**

Run: `pnpm typecheck`
Expected: PASS (타입 충돌 없음). 빌드 실패 시 호환 버전으로 조정 후 기록.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml ios/Podfile.lock
git commit -m "chore(auth): add firebase + google-signin deps"
```

---

## Task 2: 네이티브 설정 ⚠️ 선행조건 B2 필요

**Files:** `ios/Forceteller/GoogleService-Info.plist`(추가), `ios/Forceteller/AppDelegate.swift`, `ios/Forceteller/Info.plist`, `android/app/google-services.json`(추가), `android/build.gradle`, `android/app/build.gradle`

> B2 미충족 시 이 Task는 보류. 코드 Task(3~11)는 병행 가능.

- [ ] **Step 1: 설정 파일 배치** — `GoogleService-Info.plist`를 `ios/Forceteller/`에, `google-services.json`을 `android/app/`에 추가 (Xcode 타겟에 plist 포함).

- [ ] **Step 2: iOS Firebase 초기화** — `AppDelegate.swift`에 `FirebaseApp.configure()` 추가(`import Firebase`).

- [ ] **Step 3: iOS URL scheme** — `Info.plist`에 reversed client id(`GoogleService-Info.plist`의 `REVERSED_CLIENT_ID`)를 `CFBundleURLTypes`로 추가.

- [ ] **Step 4: Android google-services 플러그인** — `android/build.gradle`에 `classpath 'com.google.gms:google-services:<버전>'`, `android/app/build.gradle`에 `apply plugin: 'com.google.gms.google-services'`.

- [ ] **Step 5: 빌드 검증**

Run: `pnpm ios` / `pnpm android`
Expected: 앱 실행, Firebase 초기화 로그.

- [ ] **Step 6: Commit**

```bash
git add ios android
git commit -m "chore(auth): native setup for firebase + google-signin"
```

---

## Task 3: 프로바이더 인터페이스 + Firebase 래퍼

**Files:** Create `src/features/auth/providers/auth-provider.ts`, `src/features/auth/providers/firebase.ts`

- [ ] **Step 1: 인터페이스 정의**

`auth-provider.ts`:
```ts
/** 소셜 프로바이더 추상화. 국가별 공급자(구글/애플/…)가 이 인터페이스를 구현한다. */
export type AuthProvider = {
  /** 소셜 로그인 + Firebase 인증 → Firebase ID token 반환 */
  signIn: () => Promise<{ firebaseIdToken: string }>;
  signOut: () => Promise<void>;
};
```

- [ ] **Step 2: Firebase 래퍼**

`firebase.ts`:
```ts
import { getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';

/** 구글 idToken으로 Firebase 로그인 후 Firebase ID token을 반환한다. */
export async function firebaseSignInWithGoogle(googleIdToken: string): Promise<string> {
  const credential = GoogleAuthProvider.credential(googleIdToken);
  const userCred = await signInWithCredential(getAuth(), credential);
  return userCred.user.getIdToken();
}

export async function firebaseSignOut(): Promise<void> {
  await getAuth().signOut();
}
```

- [ ] **Step 3: typecheck + Commit**

Run: `pnpm typecheck`
```bash
git add src/features/auth/providers/auth-provider.ts src/features/auth/providers/firebase.ts
git commit -m "feat(auth): provider interface + firebase wrapper"
```

---

## Task 4: google-provider (TDD)

**Files:** Create `src/features/auth/providers/google-provider.ts`, Test `src/features/auth/__tests__/google-provider.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
// __tests__/google-provider.test.ts
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ data: { idToken: 'g-token' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
    configure: jest.fn(),
  },
}));
jest.mock('../providers/firebase', () => ({
  firebaseSignInWithGoogle: jest.fn().mockResolvedValue('fb-id-token'),
  firebaseSignOut: jest.fn().mockResolvedValue(undefined),
}));

import { googleProvider } from '../providers/google-provider';

describe('google-provider', () => {
  it('returns firebase id token from google sign-in', async () => {
    const result = await googleProvider.signIn();
    expect(result).toEqual({ firebaseIdToken: 'fb-id-token' });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test google-provider`
Expected: FAIL (module not found)

- [ ] **Step 3: 구현**

```ts
// providers/google-provider.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { env } from '@/shared/config';
import type { AuthProvider } from './auth-provider';
import { firebaseSignInWithGoogle, firebaseSignOut } from './firebase';

GoogleSignin.configure({ webClientId: env.googleWebClientId }); // ⚠️ env에 추가 필요 (B2)

export const googleProvider: AuthProvider = {
  async signIn() {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const googleIdToken = result.data?.idToken;
    if (!googleIdToken) throw new Error('No Google ID token');
    const firebaseIdToken = await firebaseSignInWithGoogle(googleIdToken);
    return { firebaseIdToken };
  },
  async signOut() {
    await GoogleSignin.signOut();
    await firebaseSignOut();
  },
};
```

> ⚠️ `env.googleWebClientId`는 `src/shared/config/env.ts`에 추가 (B2의 webClientId). `env` 패턴 따름.

- [ ] **Step 4: 통과 확인 + Commit**

Run: `pnpm test google-provider` → PASS
```bash
git add src/features/auth/providers/google-provider.ts src/features/auth/__tests__/google-provider.test.ts src/shared/config/env.ts
git commit -m "feat(auth): google provider via firebase credential"
```

---

## Task 5: auth-api ⚠️ 선행조건 B1 필요 (TDD)

**Files:** Create `src/features/auth/api/auth-api.ts`, Test `src/features/auth/__tests__/auth-api.test.ts`

> 응답/요청 형식은 B1 확정값으로 채운다. 아래는 **잠정 형태**(필드명은 계약 확정 시 교체).

- [ ] **Step 1: 타입 + 실패 테스트**

```ts
// __tests__/auth-api.test.ts
jest.mock('@/shared/lib', () => ({ http: { post: jest.fn() } }));
import { http } from '@/shared/lib';
import { exchangeToken } from '../api/auth-api';

describe('auth-api', () => {
  it('exchanges firebase id token for service token', async () => {
    (http.post as jest.Mock).mockResolvedValue({ serviceToken: 'svc', user: { id: '1' } });
    const result = await exchangeToken('fb-id-token');
    expect(result).toEqual({ serviceToken: 'svc', user: { id: '1' } });
    expect(http.post).toHaveBeenCalledWith('/auth/firebase', { idToken: 'fb-id-token' }); // ⚠️ 경로/필드 B1
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test auth-api` → FAIL

- [ ] **Step 3: 구현** (⚠️ 경로·필드명은 B1 확정으로 교체)

```ts
// api/auth-api.ts
import { http } from '@/shared/lib';

export type AuthUser = { id: string }; // ⚠️ B1 응답 형태로 확장
export type ExchangeResult = { serviceToken: string; user: AuthUser };

/** Firebase ID token을 서버 서비스 토큰으로 교환. */
export function exchangeToken(firebaseIdToken: string): Promise<ExchangeResult> {
  return http.post<ExchangeResult>('/auth/firebase', { idToken: firebaseIdToken }); // ⚠️ B1
}
```

- [ ] **Step 4: 통과 + Commit**

Run: `pnpm test auth-api` → PASS
```bash
git add src/features/auth/api/auth-api.ts src/features/auth/__tests__/auth-api.test.ts
git commit -m "feat(auth): firebase token exchange api"
```

---

## Task 6: auth-store (TDD)

**Files:** Create `src/features/auth/stores/auth-store.ts`, Test `src/features/auth/__tests__/auth-store.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
// __tests__/auth-store.test.ts
const mockTokenStore = { get: jest.fn(), set: jest.fn(), clear: jest.fn() };
jest.mock('@/shared/lib', () => ({ authTokenStore: mockTokenStore }));
jest.mock('../providers/google-provider', () => ({
  googleProvider: { signIn: jest.fn().mockResolvedValue({ firebaseIdToken: 'fb' }), signOut: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../api/auth-api', () => ({
  exchangeToken: jest.fn().mockResolvedValue({ serviceToken: 'svc', user: { id: '1' } }),
}));

import { useAuthStore } from '../stores/auth-store';

describe('auth-store', () => {
  beforeEach(() => { mockTokenStore.get.mockReset(); useAuthStore.setState({ status: 'loading', user: null }); });

  it('restore → guest when no token', () => {
    mockTokenStore.get.mockReturnValue(null);
    useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('guest');
  });

  it('restore → authenticated when token exists', () => {
    mockTokenStore.get.mockReturnValue('svc');
    useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('signIn → stores token + authenticated', async () => {
    await useAuthStore.getState().signIn();
    expect(mockTokenStore.set).toHaveBeenCalledWith('svc');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('signOut → clears + guest', async () => {
    await useAuthStore.getState().signOut();
    expect(mockTokenStore.clear).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('guest');
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test auth-store` → FAIL

- [ ] **Step 3: 구현**

```ts
// stores/auth-store.ts
import { create } from 'zustand';
import { authTokenStore } from '@/shared/lib';
import { googleProvider } from '../providers/google-provider';
import { exchangeToken, type AuthUser } from '../api/auth-api';

type Status = 'loading' | 'guest' | 'authenticated';

type AuthState = {
  status: Status;
  user: AuthUser | null;
  restore: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  restore: () => set({ status: authTokenStore.get() ? 'authenticated' : 'guest' }),
  signIn: async () => {
    const { firebaseIdToken } = await googleProvider.signIn();
    const { serviceToken, user } = await exchangeToken(firebaseIdToken);
    authTokenStore.set(serviceToken);
    set({ status: 'authenticated', user });
  },
  signOut: async () => {
    await googleProvider.signOut();
    authTokenStore.clear();
    set({ status: 'guest', user: null });
  },
}));
```

- [ ] **Step 4: 통과 + Commit**

Run: `pnpm test auth-store` → PASS
```bash
git add src/features/auth/stores/auth-store.ts src/features/auth/__tests__/auth-store.test.ts
git commit -m "feat(auth): zustand auth-store (restore/signIn/signOut)"
```

---

## Task 7: route-guards + use-app-navigation

**Files:** Create `src/features/auth/guard/route-guards.ts`, `src/features/auth/navigation/use-app-navigation.ts`. Modify `src/app/navigation/navigation-types.ts` (`Login` 라우트 선행 추가)

- [ ] **Step 1: navigation-types에 Login 라우트 추가**

`navigation-types.ts`의 `RootStackParamList`에 추가:
```ts
export type RootStackParamList = {
  Tabs: undefined;
  Web: WebRouteParams;
  Login: { redirect?: { screen: keyof RootStackParamList; params?: Record<string, unknown> } };
};
```

- [ ] **Step 2: route-guards**

```ts
// guard/route-guards.ts
import type { RootStackParamList } from '@/app/navigation/navigation-types';
// ⚠️ 주: foundation feature라 app import 허용? → 전역 타입 ReactNavigation.RootParamList 사용으로 회피 가능.
//    여기선 보호 라우트 키만 필요하므로 문자열 집합으로 선언해 app 의존을 피한다:
export const ROUTE_GUARDS: Partial<Record<keyof ReactNavigation.RootParamList, { requiresAuth: boolean }>> = {
  Web: { requiresAuth: true },
};
```

- [ ] **Step 3: use-app-navigation (구현 — 훅, 수동 검증)**

```ts
// navigation/use-app-navigation.ts
import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native'; // eslint-disable-line no-restricted-imports
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/auth-store';
import { ROUTE_GUARDS } from '../guard/route-guards';

type Nav = NativeStackNavigationProp<ReactNavigation.RootParamList>;

export function useAppNavigation() {
  const nav = useNavigation<Nav>();
  const status = useAuthStore((s) => s.status);
  return useMemo(() => {
    const guarded = (screen: keyof ReactNavigation.RootParamList, params?: object) => {
      if (status !== 'authenticated' && ROUTE_GUARDS[screen]?.requiresAuth) {
        nav.navigate('Login' as never, { redirect: { screen, params } } as never);
        return;
      }
      nav.navigate(screen as never, params as never);
    };
    return { navigate: guarded, push: guarded, replace: guarded, goBack: () => nav.goBack() };
  }, [nav, status]);
}
```

- [ ] **Step 4: typecheck + 수동 검증** — Run: `pnpm typecheck`. 미인증 시 보호 라우트 navigate → Login 모달 뜨는지(Task 12 통합에서 확인).

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/guard/route-guards.ts src/features/auth/navigation/use-app-navigation.ts src/app/navigation/navigation-types.ts
git commit -m "feat(auth): route guards + useAppNavigation (entry-time guard)"
```

---

## Task 8: use-auth-guard (중앙 리스너, 딥링크 백스톱)

**Files:** Create `src/features/auth/guard/use-auth-guard.ts`

- [ ] **Step 1: 구현**

```ts
// guard/use-auth-guard.ts
import { useEffect } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import { useAuthStore } from '../stores/auth-store';
import { ROUTE_GUARDS } from './route-guards';

/** 딥링크/훅 밖 진입을 사후 감지해 미인증이면 Login 모달로. RootNavigator에 1회 장착. */
export function useAuthGuard(navRef: NavigationContainerRef<ReactNavigation.RootParamList>) {
  const status = useAuthStore((s) => s.status);
  useEffect(() => {
    const unsub = navRef.addListener('state', () => {
      const route = navRef.getCurrentRoute();
      if (!route) return;
      if (status !== 'authenticated' && ROUTE_GUARDS[route.name as keyof ReactNavigation.RootParamList]?.requiresAuth) {
        navRef.navigate('Login' as never, { redirect: { screen: route.name, params: route.params } } as never);
      }
    });
    return unsub;
  }, [status, navRef]);
}
```

- [ ] **Step 2: typecheck + Commit**

Run: `pnpm typecheck`
```bash
git add src/features/auth/guard/use-auth-guard.ts
git commit -m "feat(auth): central auth guard listener (deeplink backstop)"
```

---

## Task 9: index 배럴 (foundation exports)

**Files:** Create `src/features/auth/index.ts`

- [ ] **Step 1: 배럴**

```ts
// features/auth/index.ts — foundation feature 공개 API
export { useAuthStore } from './stores/auth-store';
export { useAppNavigation } from './navigation/use-app-navigation';
export { useAuthGuard } from './guard/use-auth-guard';
export { LoginScreen } from './screens/login-screen';
```

- [ ] **Step 2: Commit** (LoginScreen은 Task 10 후 추가 — 순서상 Task 10 다음에 이 export 포함 커밋)

---

## Task 10: login-screen 모달

**Files:** Create `src/features/auth/screens/login-screen.tsx`

- [ ] **Step 1: 구현**

```tsx
// screens/login-screen.tsx
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'; // eslint-disable-line no-restricted-imports
import { ScreenContainer } from '@/shared/components';
import { spacing, useAppColors } from '@/shared/theme';
import { useAuthStore } from '../stores/auth-store';

type LoginRoute = RouteProp<{ Login: { redirect?: { screen: string; params?: object } } }, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation();
  const route = useRoute<LoginRoute>();
  const colors = useAppColors();
  const signIn = useAuthStore((s) => s.signIn);
  const [loading, setLoading] = useState(false);

  const onGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signIn();
      const redirect = route.params?.redirect;
      if (redirect) navigation.navigate(redirect.screen as never, redirect.params as never);
      else navigation.goBack();
    } catch {
      // TODO(Task 12): 에러 토스트
    } finally {
      setLoading(false);
    }
  }, [signIn, route.params, navigation]);

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>로그인</Text>
        <Pressable accessibilityRole="button" onPress={onGoogle} disabled={loading} style={[styles.btn, { borderColor: colors.tabBarBorder }]}>
          {loading ? <ActivityIndicator color={colors.text} /> : <Text style={[styles.btnText, { color: colors.text }]}>Google로 계속하기</Text>}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  btn: { borderWidth: 1, borderRadius: 8, paddingVertical: spacing.md, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '500' },
});
```

- [ ] **Step 2: typecheck + index 배럴(Task 9) export 포함 Commit**

Run: `pnpm typecheck`
```bash
git add src/features/auth/screens/login-screen.tsx src/features/auth/index.ts
git commit -m "feat(auth): login modal screen + barrel exports"
```

---

## Task 11: 네비게이터 등록 (Login 모달 + useAuthGuard)

**Files:** Modify `src/app/navigation/root-navigator.tsx`

- [ ] **Step 1: Login 모달 그룹 + 가드 장착**

```tsx
// root-navigator.tsx (핵심 변경)
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { LoginScreen, useAuthGuard } from '@/features/auth';
// ...
export function RootNavigator() {
  const scheme = useColorScheme();
  const navRef = useNavigationContainerRef<RootStackParamList>();
  useAuthGuard(navRef);
  return (
    <NavigationContainer ref={navRef} theme={scheme === 'dark' ? navigationDarkTheme : navigationLightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen name="Web" component={WebScreen} options={({ route }) => ({ headerShown: true, title: route.params.title ?? '' })} />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: '로그인' }} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

> ⚠️ `useAuthGuard(navRef)`는 `NavigationContainer` 컨텍스트 밖에서 ref만 쓰므로 동작. 시퀀스 이상 시 `onReady`/`onStateChange`로 조정(스펙 게이트 노트).

- [ ] **Step 2: 앱 시작 시 세션 복원 + typecheck**

`App.tsx`에 `useAuthStore.getState().restore()` 호출 추가(인터셉터 등록 옆, 모듈 1회) 또는 `RootNavigator` 마운트 시 `useEffect`로. Run: `pnpm typecheck`.

- [ ] **Step 3: Commit**

```bash
git add src/app/navigation/root-navigator.tsx src/app/App.tsx
git commit -m "feat(auth): register Login modal + central guard + session restore"
```

---

## Task 12: 기존 화면 마이그레이션 + ESLint 강제 + 통합 검증

**Files:** Modify `src/features/home/screens/home-screen.tsx`, ESLint config

- [ ] **Step 1: home-screen 마이그레이션**

`home-screen.tsx`의 `useNavigation()` → `useAppNavigation()`(`@/features/auth`). `navigation.navigate('Web', …)` 호출은 그대로(시그니처 동일).

- [ ] **Step 2: ESLint no-restricted-imports 추가**

ESLint config에 스펙의 `no-restricted-imports` 규칙 추가(`useNavigation` 직접 import 차단). `use-app-navigation.ts`·`login-screen.tsx`는 `eslint-disable-line`로 예외.

- [ ] **Step 3: lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS. 직접 `useNavigation` 쓴 곳 있으면 error로 잡힘.

- [ ] **Step 4: 수동 통합 검증 (앱 실행)**

게스트로 home의 보호 진입 버튼 탭 → Login 모달 → Google 로그인 → 모달 닫히고 Web 상세 진입. 딥링크로 보호 라우트 진입 → 모달 뜨는지(중앙 리스너).

- [ ] **Step 5: Commit**

```bash
git add src/features/home eslint.config.* .eslintrc*
git commit -m "feat(auth): migrate screens to useAppNavigation + lint enforcement"
```

---

## Self-Review (작성자 점검 완료)

- **Spec coverage:** 로그인(Task 3-6,10) / 인증상태·복원(Task 6,11) / 게이트(Task 7-8,11) / 로그아웃(Task 6) / foundation feature(Task 9 배럴) / X-Auth-Token(기존 인터셉터 재사용) — 커버됨. 웹뷰 공유·토큰 갱신은 스펙상 후속(계획 제외).
- **Placeholder:** B1(백엔드)·B2(Firebase) 의존부는 placeholder가 아니라 **선행조건으로 분리** + `⚠️` 표시. 그 외 step은 실제 코드.
- **Type consistency:** `AuthProvider.signIn(): {firebaseIdToken}` → `auth-store.signIn`이 소비, `exchangeToken(firebaseIdToken)` → `{serviceToken,user}` → `authTokenStore.set` 일관. `RootStackParamList.Login.redirect` 형태가 `useAppNavigation`·`use-auth-guard`·`login-screen`에서 동일.

## 미해소 리스크 (실행 중 확정)

- **B1 백엔드 계약**: Task 5의 엔드포인트/필드명. 확정 전 Task 5는 잠정 형태(테스트는 통과하나 실제 계약과 맞춰야).
- **B2 Firebase/네이티브**: Task 2·`env.googleWebClientId`. 콘솔 설정 필요.
- **New Arch 호환**: Task 1 Step 3에서 빌드 검증.
- **게이트 모달 시퀀스**: Task 11/12에서 실기기 검증(스펙 게이트 노트).
