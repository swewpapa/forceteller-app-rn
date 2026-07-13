import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppProviders } from './providers';
import { RootNavigator } from './navigation';
import { SplashGate } from './splash';
import { http, authTokenStore, createAuthRequestInterceptor } from '@/shared/lib';
import { useAuthStore, createSessionExpiredInterceptor } from '@/features/auth';
import { useTheme } from '@/shared/theme';

// 앱 시작 시 토큰 주입 request 인터셉터를 등록한다(모듈 로드 1회).
// http가 auth-token을 직접 import하면 순환이 되므로 app 레이어에서 연결한다.
http.interceptors.request.use(createAuthRequestInterceptor(authTokenStore));
// 401(토큰 만료) → 로컬 세션 만료(guest 전환). shared(http)가 features(auth store)를
// 모르도록 여기서 연결한다 — 위 request 인터셉터와 동일 선례.
http.interceptors.response.use(undefined, createSessionExpiredInterceptor());

// 수동 day/night 모드에서도 상태바가 따라오도록 OS 스킴이 아닌 resolvedTheme을 본다.
function ThemedStatusBar() {
  const { resolvedTheme } = useTheme();
  return (
    <StatusBar
      barStyle={resolvedTheme === 'night' ? 'light-content' : 'dark-content'}
    />
  );
}

function App() {
  // MMKV 토큰 존재 여부로 초기 auth status를 결정한다.
  // useEffect를 사용하는 이유: restore()는 store 상태를 변경하는 액션이라
  // React 18 StrictMode에서 렌더 사이클 밖 store mutation이 경고를 유발할 수 있고,
  // App 마운트 전 상태 변경은 SplashGate 등 downstream consumer에 hydration 불일치 위험이 있다.
  // authTokenStore(MMKV)는 동기 읽기이므로 async 타이밍 문제는 없다.
  useEffect(() => {
    useAuthStore.getState().restore();
  }, []);

  return (
    <AppProviders>
      <ThemedStatusBar />
      <SplashGate>
        <RootNavigator />
      </SplashGate>
    </AppProviders>
  );
}

export default App;
