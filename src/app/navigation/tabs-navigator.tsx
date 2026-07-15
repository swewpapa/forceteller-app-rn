import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
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
      <Tab.Screen name="Today" component={TodayScreen} options={{ title: '투데이' }} />
      <Tab.Screen name="Premium" component={PremiumScreen} options={{ title: '프리미엄' }} />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ title: '더 보기' }}
        // dev 전용: More 탭 long-press → DS 갤러리(커스텀 TabBar가 tabLongPress를 발신하는 계약 활용).
        // 탭 네비의 navigate 타입엔 루트 스택 라우트가 없어 구조적 캐스트(런타임은 상위로 버블링).
        listeners={({ navigation }) => ({
          tabLongPress: () => {
            if (__DEV__)
              (navigation as { navigate: (screen: string) => void }).navigate('DsGallery');
          },
        })}
      />
    </Tab.Navigator>
  );
}
