import { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { AppProviders } from './providers';
import { RootNavigator } from './navigation';
import { SplashGate } from './splash';
import { http, authTokenStore, createAuthRequestInterceptor } from '@/shared/lib';
import { useAuthStore } from '@/features/auth';

// 앱 시작 시 토큰 주입 request 인터셉터를 등록한다(모듈 로드 1회).
// http가 auth-token을 직접 import하면 순환이 되므로 app 레이어에서 연결한다.
http.interceptors.request.use(createAuthRequestInterceptor(authTokenStore));

function App() {
  const isDarkMode = useColorScheme() === 'dark';

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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SplashGate>
        <RootNavigator />
      </SplashGate>
    </AppProviders>
  );
}

export default App;
