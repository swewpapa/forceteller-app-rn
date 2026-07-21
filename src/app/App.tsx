import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { http, initQueryOnlineManager, subscribeQueryFocusManager } from '@/shared/lib';
import {
  useAuthStore,
  authStorage,
  createAuthTokenInterceptor,
  createSessionExpiredInterceptor,
} from '@/features/auth';
import { useTheme } from '@/shared/theme';
import { initRemoteConfig, syncRemoteConfig } from '@/shared/config/remote-config/config-setup';
import { PopoverProvider } from '@/shared/components/popover/popover-context';
import { PopoverHost } from '@/shared/components/popover/popover-host';
import { SplashGate } from './splash';
import { RootNavigator } from './navigation';
import { AppProviders } from './providers';

// 앱 시작 시 토큰 주입 request 인터셉터를 등록한다(모듈 로드 1회).
// shared(http)가 features(auth)를 모르도록 app 레이어에서 연결한다.
http.interceptors.request.use(createAuthTokenInterceptor(authStorage));
// 401(토큰 만료) → 로컬 세션 만료(guest 전환). shared(http)가 features(auth store)를
// 모르도록 여기서 연결한다 — 위 request 인터셉터와 동일 선례.
http.interceptors.response.use(undefined, createSessionExpiredInterceptor());

// 원격 config를 캐시에서 동기 하이드레이트(렌더 전). 백그라운드 갱신은 App의 syncRemoteConfig.
initRemoteConfig();

// RN엔 브라우저 online 이벤트가 없어 NetInfo를 react-query onlineManager에 배선한다
// (재접속 시 자동 refetch). set-and-forget이라 인터셉터 선례처럼 모듈 로드 1회.
initQueryOnlineManager();

// 수동 day/night 모드에서도 상태바가 따라오도록 OS 스킴이 아닌 resolvedTheme을 본다.
function ThemedStatusBar() {
  const { resolvedTheme } = useTheme();
  return <StatusBar barStyle={resolvedTheme === 'night' ? 'light-content' : 'dark-content'} />;
}

function App() {
  // MMKV 토큰 존재 여부로 초기 auth status를 결정한다.
  // useEffect를 사용하는 이유: restore()는 store 상태를 변경하는 액션이라
  // React 18 StrictMode에서 렌더 사이클 밖 store mutation이 경고를 유발할 수 있고,
  // App 마운트 전 상태 변경은 SplashGate 등 downstream consumer에 hydration 불일치 위험이 있다.
  // authStorage(MMKV)는 동기 읽기이므로 async 타이밍 문제는 없다.
  // 원격 config 백그라운드 갱신(SWR)도 같은 부팅 이펙트에서 트리거한다 — syncRemoteConfig는
  // 훅이 아닌 일반 함수라 restore()와 나란히 호출한다. 부팅 스냅샷은 위 initRemoteConfig로 이미 동기 로드됨.
  useEffect(() => {
    useAuthStore.getState().restore();
    syncRemoteConfig();
  }, []);

  // 앱 포그라운드 복귀 → focusManager → stale 쿼리 자동 갱신 (웹 refetchOnWindowFocus 대응).
  // AppState 구독이라 해제 함수를 cleanup으로 반환한다.
  useEffect(() => subscribeQueryFocusManager(), []);

  return (
    <AppProviders>
      {/* Popover Provider/Host는 앱 루트에 둔다 — ScreenContainer를 쓰지 않는 화면
          (투데이 히어로 풀블리드 등)도 커버하기 위함. Host는 box-none이라 popover 없으면 무해. */}
      <PopoverProvider>
        <ThemedStatusBar />
        <SplashGate>
          <RootNavigator />
        </SplashGate>
        <PopoverHost />
      </PopoverProvider>
    </AppProviders>
  );
}

export default App;
