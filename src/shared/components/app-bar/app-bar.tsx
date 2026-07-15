import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useAppColors } from '@/shared/theme';
import { AppBarButton } from './app-bar-button';
import { AppBarIconColorProvider } from './app-bar-context';

// 포스텔러 BI 심볼(Figma bi_symbol). shared 앱 바 chrome 전용 로고.
const LOGO = require('@/assets/forceteller-logo.png');

const BAR_HEIGHT = 56;

export type AppBarBackground = 'surface' | 'transparent';

export type AppBarProps = {
  /**
   * 배경. 'surface'(기본, 솔리드) | 'transparent'(히어로 위 오버레이).
   * transparent일 때 스크롤 배경 전환은 화면이 별도 Animated 레이어로 소유한다.
   */
  background?: AppBarBackground;
  /** leading 슬롯(기본 BI 로고). 투데이 상단은 오늘 날짜 텍스트로 오버라이드. */
  leading?: ReactNode;
  /** trailing 슬롯 — AppBarButton들 또는 커스텀 element(popover 래핑 등). 화면이 구성한다. */
  trailing?: ReactNode;
  /** 기본 leading(BI 로고) 탭. leading을 직접 주면 무시된다. */
  onPressLogo?: () => void;
  /**
   * trailing 안 FA 아이콘 색을 일괄 지정(context 전파). 기본 text.default.
   * 투데이 히어로 오버레이는 흰색 등. children(SVG)의 색은 화면이 직접 준다.
   */
  iconColor?: string;
};

/**
 * 포스텔러 앱 바(Figma "App Bar" Root, h56) — 탭 화면 전용 chrome.
 * leading/trailing 슬롯 조합. 예약 액션 대신 화면이 AppBarButton으로 구성해
 * 표준 4종(검색/무료충전/이벤트/캘린더) 밖 액션·popover도 자유롭게 얹는다.
 * 스택 상세 화면은 react-navigation 기본 헤더를 쓴다 — 이 컴포넌트는 탭에서만 소비.
 * 상단 안전영역 패딩은 ScreenContainer(솔리드) 또는 화면의 오버레이 배치(transparent)가 담당.
 */
export function AppBar({
  background = 'surface',
  leading,
  trailing,
  onPressLogo,
  iconColor,
}: AppBarProps) {
  const colors = useAppColors();
  const backgroundColor = background === 'transparent' ? 'transparent' : colors.background.surface;

  return (
    <AppBarIconColorProvider value={iconColor}>
      <View style={[styles.root, { backgroundColor }]}>
        <View style={styles.startSlot}>
          {leading ?? (
            <AppBarButton
              icon={<Image source={LOGO} style={styles.logo} resizeMode="contain" />}
              accessibilityLabel="포스텔러 홈"
              onPress={onPressLogo}
            />
          )}
        </View>
        <View style={styles.endSlot}>{trailing}</View>
      </View>
    </AppBarIconColorProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    height: BAR_HEIGHT,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  startSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 4,
  },
  logo: { width: 36, height: 36 },
});
