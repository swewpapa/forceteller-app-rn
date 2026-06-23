import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/features/home';
import { TodayScreen } from '@/features/today';
import { PremiumScreen } from '@/features/premium';
import { MoreScreen } from '@/features/more';
import { navigationDarkTheme, navigationLightTheme } from '@/shared/theme';
import { AppTabBar } from './app-tab-bar';
import type { RootTabParamList } from './navigation-types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <AppTabBar {...props} />;

export function RootNavigator() {
  const scheme = useColorScheme();

  return (
    <NavigationContainer
      theme={scheme === 'dark' ? navigationDarkTheme : navigationLightTheme}
    >
      <Tab.Navigator tabBar={renderTabBar}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '홈' }}
        />
        <Tab.Screen
          name="Today"
          component={TodayScreen}
          options={{ title: '투데이' }}
        />
        <Tab.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ title: '프리미엄' }}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{ title: '더 보기' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
