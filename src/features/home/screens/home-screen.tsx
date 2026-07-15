import { ScrollView } from 'react-native';
import { useAppNavigation } from '@/features/auth';
import { useFreeForceTip } from '@/features/freeforce';
import { ThemeWidget, type ThemeView } from '@/features/theme';
import {
  AppBar,
  AppBarCalendarButton,
  AppBarFreeForceButton,
  AppBarSearchButton,
  Column,
  Popover,
  ScreenContainer,
} from '@/shared/components';

/** 홈 탭(RN). 테마 위젯 3개 리전(recommend_top/middle/bottom). */
const THEME_CODES = ['recommend_top', 'recommend_middle', 'recommend_bottom'] as const;

export function HomeScreen() {
  const navigation = useAppNavigation();
  const showFreeForceTip = useFreeForceTip();

  const handlePressView = (view: ThemeView) => {
    // tag_filter 링크는 keyword_cloud 사이클에서 처리 (text_only에는 url만 관측됨)
    if (view.link.type === 'url') {
      navigation.navigate('Web', { path: view.link.value, title: view.title });
    }
  };

  return (
    <ScreenContainer>
      {/* 홈 헤더: BI + 검색/무료충전/캘린더 (Figma 20:508 기준 — event 없음). 세그먼트 컨트롤은 후속. */}
      <AppBar
        trailing={
          <>
            <AppBarSearchButton onPress={() => {}} />
            <Popover id="freeforce" visible={showFreeForceTip} message="무료 포스 받기">
              <AppBarFreeForceButton
                onPress={() => navigation.navigate('Web', { path: '/freeforce' })}
              />
            </Popover>
            <AppBarCalendarButton onPress={() => navigation.navigate('Web', { path: '/cal' })} />
          </>
        }
      />
      <ScrollView>
        <Column padding="300" gap="300">
          {THEME_CODES.map((code) => (
            <ThemeWidget key={code} code={code} onPressView={handlePressView} />
          ))}
        </Column>
      </ScrollView>
    </ScreenContainer>
  );
}
