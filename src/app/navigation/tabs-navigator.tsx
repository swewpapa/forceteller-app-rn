import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/features/home';
import { TodayScreen } from '@/features/today';
import { PremiumScreen } from '@/features/premium';
import { MoreScreen } from '@/features/more';
import { TabBar } from './tab-bar';
import type { RootTabParamList } from './navigation-types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

/** 네이티브 하단 탭. 각 탭의 메인 화면은 RN으로 렌더한다. */
export function TabsNavigator() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
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
  );
}
