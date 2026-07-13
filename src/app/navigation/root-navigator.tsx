import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationDayTheme, navigationNightTheme, useTheme } from '@/shared/theme';
import { WebScreen } from '@/features/web';
import { LoginScreen, useAuthGuard } from '@/features/auth';
import { DsGalleryScreen } from '../dev/ds-gallery-screen';
import { TabsNavigator } from './tabs-navigator';
import type { RootStackParamList } from './navigation-types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * 루트 스택: 네이티브 탭(Tabs) + WebView 상세(Web) + 로그인 모달(Login).
 * - useAuthGuard: 가드 대상 라우트 진입 시 미인증이면 Login 모달로 리다이렉트.
 * - navRef.addListener('state')는 NavigationContainer ref assign 후 연결되므로
 *   첫 initial route 이벤트는 guard를 통과할 수 있으나(백스톱 특성상 허용),
 *   이후 모든 navigation 이벤트를 잡는다.
 */
export function RootNavigator() {
  const { resolvedTheme } = useTheme();
  const navRef = useNavigationContainerRef<RootStackParamList>();
  useAuthGuard(navRef);

  return (
    <NavigationContainer
      ref={navRef}
      theme={resolvedTheme === 'night' ? navigationNightTheme : navigationDayTheme}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen
          name="Web"
          component={WebScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route.params.title ?? '',
          })}
        />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: true, title: '로그인' }}
          />
        </Stack.Group>
        {/* dev 전용: DS 컴포넌트 카탈로그(More 탭 long-press 진입). prod 번들엔 미등록. */}
        {__DEV__ && (
          <Stack.Screen
            name="DsGallery"
            component={DsGalleryScreen}
            options={{ headerShown: true, title: 'DS Gallery' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
