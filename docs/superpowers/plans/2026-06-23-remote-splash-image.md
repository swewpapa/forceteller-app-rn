# Remote Splash Image (SWR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 주의 (사용자 규칙 `git-commit-explicit-only`):** 아래 각 Task의 commit step은 **권장 분리 단위**일 뿐이다. 실제 `git commit`은 사용자가 명시적으로 요청할 때만 실행한다. `git push`는 절대 자동 실행하지 않는다.

**Goal:** 앱 부팅 시 remote(S3/CloudFront) 스플래시 이미지를 SWR(캐시 우선 + 백그라운드 갱신)로 표시한다.

**Architecture:** 네이티브 스플래시(react-native-bootsplash)가 떠 있는 동안 JS 오버레이(`SplashGate`)가 MMKV에 저장된 직전 이미지를 expo-image 디스크 캐시에서 즉시 표시하고, 백그라운드로 `splash.json`을 받아 변경 시 다음 실행용으로 prefetch·저장한다. 네트워크는 부팅을 막지 않는다.

**Tech Stack:** React Native 0.86 (New Arch), TypeScript, react-native-bootsplash, expo-image(+expo-modules-core), react-native-mmkv, Jest.

**Spec:** [docs/superpowers/specs/2026-06-23-remote-splash-image-design.md](../specs/2026-06-23-remote-splash-image-design.md)

---

## File Structure

```
src/app/splash/
  splash-types.ts                         # SplashConfig, SplashMeta 타입
  splash-storage.ts                       # MMKV 메타 read/write (KVStore DI)
  splash-api.ts                           # splash.json fetch + pickImageUrl
  revalidate-splash.ts                    # SWR 순수 로직 (테스트 핵심)
  use-remote-splash.ts                    # 얇은 훅 (캐시 초기값 + revalidate 호출)
  splash-gate.tsx                         # bootsplash 제어 + expo-image 오버레이
  index.ts                                # SplashGate 배럴
  __tests__/splash-storage.test.ts
  __tests__/splash-api.test.ts
  __tests__/revalidate-splash.test.ts
src/shared/config/env.ts                  # (수정) splashConfigUrl 추가
src/assets/splash-fallback.png            # (추가) 번들 폴백 이미지
src/app/App.tsx                           # (수정) SplashGate로 RootNavigator 래핑
```

**책임 경계:** 순수 로직(`storage`/`api`/`revalidate`)과 React 통합(`use-remote-splash`/`splash-gate`)을 분리한다. SWR 결정 로직은 `revalidate-splash.ts`에 모아 DI로 테스트한다(네이티브 모킹 회피).

---

## Task 1: 라이브러리 설치 & RN 0.86 호환 검증

**Files:**
- Modify: `package.json`, `ios/Podfile.lock` (pod install 결과)

> ⚠️ 선결과제(스펙 §10). RN 0.86은 최신이라 각 패키지의 New Arch/0.86 지원 버전을 **설치 전 확인**한다.

- [ ] **Step 1: 각 패키지의 RN 0.86 / New Architecture 지원 확인**

확인 방법 (각각):
```bash
npm view react-native-bootsplash peerDependencies
npm view expo peerDependencies
npm view expo-image peerDependencies
npm view react-native-mmkv
```
- 각 README의 New Architecture 지원 명시 확인.
- `expo-image`는 `expo`(expo-modules-core) 버전에 묶이므로, RN 0.86과 호환되는 expo SDK가 있는지 먼저 확인. 없으면 **중단하고 스펙 D4를 재검토**(이 경우 캐싱은 react-native-blob-util + 직접 파일저장으로 폴백).

- [ ] **Step 2: bootsplash + mmkv 설치**

```bash
pnpm add react-native-bootsplash react-native-mmkv
```

- [ ] **Step 3: expo 모듈 인프라 + expo-image 설치**

```bash
npx install-expo-modules@latest
pnpm add expo-image
```
출처: docs.expo.dev/bare/installing-expo-modules — bare RN에 expo 모듈 도입(전체 Expo 전환 아님).

- [ ] **Step 4: iOS pod 설치**

```bash
cd ios && pod install && cd ..
```

- [ ] **Step 5: 네이티브 빌드로 호환 검증**

```bash
pnpm run android   # 성공 확인 후 종료
pnpm run ios       # 성공 확인 후 종료
```
Expected: 두 플랫폼 모두 빌드·실행 성공(기능 추가 전, 회귀 없음 확인).

- [ ] **Step 6: Commit** (사용자 요청 시)

```bash
git add package.json pnpm-lock.yaml ios/Podfile.lock
git commit -m "chore: add bootsplash, expo-image, mmkv (RN 0.86 verified)"
```

---

## Task 2: bootsplash 네이티브 스플래시 설정

**Files:**
- Create: `src/assets/splash-fallback.png`
- Modify: 네이티브 스플래시 리소스 (bootsplash CLI 생성), `capacitor` 없음 — RN 네이티브 설정은 CLI가 처리

- [ ] **Step 1: 폴백 이미지 확보**

기존 `forceteller-app`의 번들 스플래시에서 추출하거나 디자이너에게 요청:
- 소스: `/Users/martin/Workspace/un7qi3inc/forceteller-app/android/app/src/kr/res/drawable*/splash.png`
- `src/assets/splash-fallback.png`로 저장.

- [ ] **Step 2: bootsplash 에셋·네이티브 설정 생성**

```bash
npx react-native-bootsplash generate src/assets/splash-fallback.png --background=191919
```
출처: react-native-bootsplash README. 생성된 `assets/bootsplash/manifest.json` 및 네이티브 설정 확인.
> 공식 문서대로 iOS(Storyboard)·Android 설정이 자동 반영되는지 확인. 수동 단계가 필요하면 README의 "Manual" 섹션을 따른다.

- [ ] **Step 3: 기본 자동 hide 비활성 확인**

react-native-bootsplash는 기본적으로 **수동 hide**다(자동 hide 아님). 앱이 `BootSplash.hide()`를 호출하기 전까지 유지되는지 확인(Task 9에서 호출).

- [ ] **Step 4: 빌드 후 네이티브 스플래시 표시 확인**

```bash
pnpm run ios
```
Expected: 앱 실행 시 `#191919` 배경 + 폴백 이미지 스플래시가 표시되고, (아직 hide 호출 없으므로) 사라지지 않거나 RN 기본 타이밍에 사라짐.

- [ ] **Step 5: Commit** (사용자 요청 시)

```bash
git add src/assets android ios
git commit -m "feat(splash): native bootsplash with bundled fallback"
```

---

## Task 3: env에 splashConfigUrl 추가

**Files:**
- Modify: `src/shared/config/env.ts`

- [ ] **Step 1: env 확장**

`src/shared/config/env.ts`를 아래로 교체:
```ts
import Config from 'react-native-config';

/**
 * Build-time environment, surfaced via react-native-config (.env files).
 * Native builds inject these values; fallbacks keep JS-only dev runnable.
 */
export const env = {
  apiBaseUrl: Config.API_BASE_URL ?? 'https://api.forceteller.com',
  splashConfigUrl:
    Config.SPLASH_CONFIG_URL ??
    'https://static.forceteller.com/images/splash/splash.json',
} as const;
```

- [ ] **Step 2: 타입체크**

```bash
pnpm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit** (사용자 요청 시)

```bash
git add src/shared/config/env.ts
git commit -m "feat(splash): add splashConfigUrl to env"
```

---

## Task 4: splash-types

**Files:**
- Create: `src/app/splash/splash-types.ts`

- [ ] **Step 1: 타입 정의**

`src/app/splash/splash-types.ts`:
```ts
/** Remote splash 설정 (static.forceteller.com/.../splash.json 응답). */
export type SplashConfig = {
  ios?: string;
  android?: string;
  id?: string;
};

/** 로컬에 저장하는 "현재 적용된 이미지" 메타. */
export type SplashMeta = {
  appliedUrl: string;
  appliedId: string;
};
```

- [ ] **Step 2: 타입체크**

```bash
pnpm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit** (사용자 요청 시)

```bash
git add src/app/splash/splash-types.ts
git commit -m "feat(splash): add splash types"
```

---

## Task 5: splash-storage (MMKV, DI) + 테스트

**Files:**
- Create: `src/app/splash/splash-storage.ts`
- Test: `src/app/splash/__tests__/splash-storage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/splash/__tests__/splash-storage.test.ts`:
```ts
import { createSplashStorage, type KVStore } from '../splash-storage';

function fakeStore(): KVStore {
  const map = new Map<string, string>();
  return {
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
  };
}

describe('splash-storage', () => {
  it('returns null when nothing stored', () => {
    expect(createSplashStorage(fakeStore()).read()).toBeNull();
  });

  it('writes then reads meta', () => {
    const s = createSplashStorage(fakeStore());
    s.write({ appliedUrl: 'https://x/img.png', appliedId: 'abc' });
    expect(s.read()).toEqual({ appliedUrl: 'https://x/img.png', appliedId: 'abc' });
  });

  it('returns null when only one key present', () => {
    const store = fakeStore();
    store.set('splash.appliedUrl', 'https://x/img.png');
    expect(createSplashStorage(store).read()).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test -- splash-storage
```
Expected: FAIL — "Cannot find module '../splash-storage'".

- [ ] **Step 3: 최소 구현**

`src/app/splash/splash-storage.ts`:
```ts
import type { SplashMeta } from './splash-types';

/** MMKV의 부분 인터페이스 — 테스트에서 fake 주입 가능하게 DI. */
export type KVStore = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
};

const KEY_URL = 'splash.appliedUrl';
const KEY_ID = 'splash.appliedId';

export function createSplashStorage(store: KVStore) {
  return {
    read(): SplashMeta | null {
      const appliedUrl = store.getString(KEY_URL);
      const appliedId = store.getString(KEY_ID);
      if (!appliedUrl || !appliedId) return null;
      return { appliedUrl, appliedId };
    },
    write(meta: SplashMeta): void {
      store.set(KEY_URL, meta.appliedUrl);
      store.set(KEY_ID, meta.appliedId);
    },
  };
}

export type SplashStorage = ReturnType<typeof createSplashStorage>;
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test -- splash-storage
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit** (사용자 요청 시)

```bash
git add src/app/splash/splash-storage.ts src/app/splash/__tests__/splash-storage.test.ts
git commit -m "feat(splash): MMKV-backed splash meta storage with DI"
```

---

## Task 6: splash-api (fetch + pickImageUrl) + 테스트

**Files:**
- Create: `src/app/splash/splash-api.ts`
- Test: `src/app/splash/__tests__/splash-api.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/splash/__tests__/splash-api.test.ts`:
```ts
import { Platform } from 'react-native';
import { fetchSplashConfig, pickImageUrl } from '../splash-api';

describe('pickImageUrl', () => {
  it('picks ios url on ios', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(pickImageUrl({ ios: 'a', android: 'b' })).toBe('a');
  });

  it('picks android url on android', () => {
    (Platform as { OS: string }).OS = 'android';
    expect(pickImageUrl({ ios: 'a', android: 'b' })).toBe('b');
  });

  it('returns null when platform key missing', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(pickImageUrl({ android: 'b' })).toBeNull();
  });
});

describe('fetchSplashConfig', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns parsed config on ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ios: 'a', android: 'b', id: '1' }),
    }) as unknown as typeof fetch;
    expect(await fetchSplashConfig('https://x')).toEqual({ ios: 'a', android: 'b', id: '1' });
  });

  it('returns null on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    expect(await fetchSplashConfig('https://x')).toBeNull();
  });

  it('returns null on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('net')) as unknown as typeof fetch;
    expect(await fetchSplashConfig('https://x')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test -- splash-api
```
Expected: FAIL — module not found.

- [ ] **Step 3: 최소 구현**

`src/app/splash/splash-api.ts`:
```ts
import { Platform } from 'react-native';
import type { SplashConfig } from './splash-types';

/** splash.json을 받아온다. 실패/타임아웃이면 null (부팅을 막지 않음). */
export async function fetchSplashConfig(
  url: string,
  timeoutMs = 3000,
): Promise<SplashConfig | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as SplashConfig;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 현재 플랫폼에 해당하는 이미지 URL을 고른다. */
export function pickImageUrl(config: SplashConfig): string | null {
  const url = Platform.OS === 'ios' ? config.ios : config.android;
  return url ?? null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test -- splash-api
```
Expected: PASS (6 tests).

- [ ] **Step 5: Commit** (사용자 요청 시)

```bash
git add src/app/splash/splash-api.ts src/app/splash/__tests__/splash-api.test.ts
git commit -m "feat(splash): splash.json fetch and platform image picker"
```

---

## Task 7: revalidate-splash (SWR 순수 로직) + 테스트

**Files:**
- Create: `src/app/splash/revalidate-splash.ts`
- Test: `src/app/splash/__tests__/revalidate-splash.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/splash/__tests__/revalidate-splash.test.ts`:
```ts
import { revalidateSplash } from '../revalidate-splash';
import * as api from '../splash-api';

jest.mock('../splash-api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('revalidateSplash', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns new meta when id changed and prefetch succeeds', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u', id: 'new' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn().mockResolvedValue(true);

    const meta = await revalidateSplash({ configUrl: 'c', currentId: 'old', prefetch });

    expect(prefetch).toHaveBeenCalledWith('u');
    expect(meta).toEqual({ appliedUrl: 'u', appliedId: 'new' });
  });

  it('skips prefetch and returns null when id unchanged', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u', id: 'same' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn();

    const meta = await revalidateSplash({ configUrl: 'c', currentId: 'same', prefetch });

    expect(prefetch).not.toHaveBeenCalled();
    expect(meta).toBeNull();
  });

  it('returns null when prefetch fails', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u', id: 'new' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn().mockResolvedValue(false);

    expect(await revalidateSplash({ configUrl: 'c', currentId: null, prefetch })).toBeNull();
  });

  it('returns null when config fetch fails', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue(null);

    expect(
      await revalidateSplash({ configUrl: 'c', currentId: null, prefetch: jest.fn() }),
    ).toBeNull();
  });

  it('falls back to url as id when id is absent', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn().mockResolvedValue(true);

    const meta = await revalidateSplash({ configUrl: 'c', currentId: null, prefetch });

    expect(meta).toEqual({ appliedUrl: 'u', appliedId: 'u' });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test -- revalidate-splash
```
Expected: FAIL — module not found.

- [ ] **Step 3: 최소 구현**

`src/app/splash/revalidate-splash.ts`:
```ts
import { fetchSplashConfig, pickImageUrl } from './splash-api';
import type { SplashMeta } from './splash-types';

/**
 * SWR 갱신 로직(순수). 새 이미지가 있고 prefetch에 성공하면 다음 실행용 메타를 반환,
 * 그 외(변경 없음/실패)에는 null. 어떤 경우에도 throw하지 않는다.
 */
export async function revalidateSplash(deps: {
  configUrl: string;
  currentId: string | null;
  prefetch: (url: string) => Promise<boolean>;
}): Promise<SplashMeta | null> {
  const config = await fetchSplashConfig(deps.configUrl);
  if (!config) return null;

  const url = pickImageUrl(config);
  if (!url) return null;

  const id = config.id ?? url;
  if (deps.currentId === id) return null;

  const ok = await deps.prefetch(url);
  if (!ok) return null;

  return { appliedUrl: url, appliedId: id };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test -- revalidate-splash
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit** (사용자 요청 시)

```bash
git add src/app/splash/revalidate-splash.ts src/app/splash/__tests__/revalidate-splash.test.ts
git commit -m "feat(splash): SWR revalidation logic"
```

---

## Task 8: use-remote-splash 훅

**Files:**
- Create: `src/app/splash/use-remote-splash.ts`

> 얇은 훅(상태 1개 + effect 1개). 로직은 Task 7에서 검증됨. 별도 단위테스트 없이 Task 11 수동검증으로 커버.

- [ ] **Step 1: 구현**

`src/app/splash/use-remote-splash.ts`:
```ts
import { useEffect, useState } from 'react';
import { revalidateSplash } from './revalidate-splash';
import type { SplashStorage } from './splash-storage';

/**
 * 초기 렌더에 캐시된 이미지 URL을 즉시 반환하고(SWR의 "stale"),
 * 마운트 시 백그라운드로 갱신해 성공하면 다음 실행용 메타를 저장한다("revalidate").
 */
export function useRemoteSplash(deps: {
  configUrl: string;
  storage: SplashStorage;
  prefetch: (url: string) => Promise<boolean>;
}) {
  const { configUrl, storage, prefetch } = deps;
  const [imageUrl] = useState<string | null>(() => storage.read()?.appliedUrl ?? null);

  useEffect(() => {
    let cancelled = false;
    revalidateSplash({
      configUrl,
      currentId: storage.read()?.appliedId ?? null,
      prefetch,
    }).then((meta) => {
      if (meta && !cancelled) storage.write(meta);
    });
    return () => {
      cancelled = true;
    };
    // 마운트 1회만 실행 (deps는 모듈 싱글턴).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { imageUrl };
}
```

- [ ] **Step 2: 타입체크**

```bash
pnpm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit** (사용자 요청 시)

```bash
git add src/app/splash/use-remote-splash.ts
git commit -m "feat(splash): useRemoteSplash hook"
```

---

## Task 9: splash-gate 컴포넌트

**Files:**
- Create: `src/app/splash/splash-gate.tsx`, `src/app/splash/index.ts`

> ⚠️ `Image.prefetch`의 반환 타입이 `Promise<boolean>`인지 구현 시 expo-image 공식 타입으로 확인. 다르면 `prefetch` 래퍼에서 boolean으로 정규화한다.

- [ ] **Step 1: SplashGate 구현**

`src/app/splash/splash-gate.tsx`:
```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import BootSplash from 'react-native-bootsplash';
import { MMKV } from 'react-native-mmkv';
import { env } from '@/shared/config';
import { createSplashStorage } from './splash-storage';
import { useRemoteSplash } from './use-remote-splash';

const storage = createSplashStorage(new MMKV({ id: 'splash' }));
const prefetch = (url: string): Promise<boolean> =>
  Image.prefetch(url, { cachePolicy: 'disk' });

const MIN_VISIBLE_MS = 1000;
const FADE_MS = 300;
const fallback = require('@/assets/splash-fallback.png');

export function SplashGate({ children }: { children: ReactNode }) {
  const { imageUrl } = useRemoteSplash({
    configUrl: env.splashConfigUrl,
    storage,
    prefetch,
  });
  const [mounted, setMounted] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    BootSplash.hide({ fade: true });
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }, MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <View style={styles.root}>
      {children}
      {mounted && (
        <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
          <Image
            source={imageUrl ? { uri: imageUrl } : fallback}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="disk"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#191919' },
});
```

- [ ] **Step 2: 배럴 export**

`src/app/splash/index.ts`:
```ts
export { SplashGate } from './splash-gate';
```

- [ ] **Step 3: 타입체크**

```bash
pnpm run typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit** (사용자 요청 시)

```bash
git add src/app/splash/splash-gate.tsx src/app/splash/index.ts
git commit -m "feat(splash): SplashGate overlay component"
```

---

## Task 10: App.tsx 통합

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: SplashGate로 RootNavigator 래핑**

`src/app/App.tsx`를 아래로 교체:
```tsx
import { StatusBar, useColorScheme } from 'react-native';
import { AppProviders } from './providers';
import { RootNavigator } from './navigation';
import { SplashGate } from './splash';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AppProviders>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SplashGate>
        <RootNavigator />
      </SplashGate>
    </AppProviders>
  );
}

export default App;
```

- [ ] **Step 2: 타입체크 + 전체 테스트 + lint**

```bash
pnpm run typecheck && pnpm test && pnpm run lint
```
Expected: 모두 PASS.

- [ ] **Step 3: Commit** (사용자 요청 시)

```bash
git add src/app/App.tsx
git commit -m "feat(splash): mount SplashGate in App"
```

---

## Task 11: 수동 검증 (시뮬레이터/실기기)

**Files:** 없음 (실행 검증)

- [ ] **Step 1: 첫 실행 (캐시 없음)**

앱 데이터 삭제 후 실행:
```bash
pnpm run ios
```
Expected: `#191919` 배경 + **번들 폴백** 표시 → ~1초 후 페이드아웃 → 메인. (백그라운드로 splash.json fetch·prefetch 진행)

- [ ] **Step 2: 재실행 (캐시 반영)**

앱을 완전 종료 후 재실행.
Expected: 직전에 prefetch된 **remote 이미지가 즉시** 표시(디스크 캐시 hit).

- [ ] **Step 3: 오프라인**

비행기 모드로 전환 후 재실행.
Expected: 캐시 이미지(또는 첫 실행이면 번들)가 표시되고 스플래시가 정상적으로 사라짐. 멈춤/에러 없음.

- [ ] **Step 4: 이미지 변경 반영 확인**

`splash.json`의 `id`가 바뀐 상황을 시뮬레이트(스테이징 URL 또는 mock). 한 번 실행(백그라운드 prefetch) → 재실행 시 새 이미지가 반영되는지 확인.

- [ ] **Step 5: 회귀 확인**

기존 4개 탭(home/today/premium/more) 정상 동작 확인.

---

## Self-Review

**1. Spec coverage**
- §3 D1(JS 오버레이)=Task 9·10 / D2(SWR)=Task 7·8 / D3(bootsplash)=Task 2·9 / D4(expo-image)=Task 1·9 / D5(MMKV)=Task 5·9 ✓
- §4 FSD 배치(`src/app/splash/`)=Task 4~9 ✓
- §5 부팅 시퀀스=Task 9(SplashGate) ✓
- §6 데이터모델=Task 4 ✓
- §7 폴백(비차단)=Task 6·7(throw 없음, null 반환) + Task 11 Step 3 ✓
- §8 타이밍(1000/300/3000ms)=Task 9·6 상수 ✓
- §9 테스트=Task 5·6·7 ✓
- §10 선결과제=Task 1(호환), Task 9(prefetch 반환 타입), Task 2/11(실제 스키마 검증) ✓
- §11 비범위(로케일 분기/게이팅)=플랜에 미포함 ✓

**2. Placeholder scan:** 코드 step은 전부 실제 코드. 네이티브 설정(Task 1·2)은 "확인 절차+검증 명령"으로 구체화(추측 버전 박지 않음). 통과.

**3. Type consistency:** `SplashConfig`/`SplashMeta`(Task 4) → `splash-storage`/`splash-api`/`revalidate-splash`/`use-remote-splash`에서 동일 사용. `createSplashStorage`/`SplashStorage`, `fetchSplashConfig`/`pickImageUrl`, `revalidateSplash` 시그니처 일치. `prefetch: (url) => Promise<boolean>` 전 구간 동일. 통과.
