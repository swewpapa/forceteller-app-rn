import { StatusBar, useColorScheme } from 'react-native';
import { AppProviders } from './providers';
import { RootNavigator } from './navigation';
import { SplashGate } from './splash';
import { http, authTokenStore, createAuthRequestInterceptor } from '@/shared/lib';

// 앱 시작 시 토큰 주입 request 인터셉터를 등록한다(모듈 로드 1회).
// http가 auth-token을 직접 import하면 순환이 되므로 app 레이어에서 연결한다.
http.interceptors.request.use(createAuthRequestInterceptor(authTokenStore));

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
