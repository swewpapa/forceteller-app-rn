import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationDarkTheme, navigationLightTheme } from '@/shared/theme';
import { WebScreen } from '@/features/web';
import { TabsNavigator } from './tabs-navigator';
import type { RootStackParamList } from './navigation-types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * 루트 스택: 네이티브 탭(Tabs) 위에 WebView 상세 화면(Web)을 얹는다.
 * 탭에서 navigate('Web', { path })로 상세 페이지에 진입한다.
 */
export function RootNavigator() {
  const scheme = useColorScheme();

  return (
    <NavigationContainer
      theme={scheme === 'dark' ? navigationDarkTheme : navigationLightTheme}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
