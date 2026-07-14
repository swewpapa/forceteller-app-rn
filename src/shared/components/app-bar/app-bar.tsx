import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-light-svg-icons/faMagnifyingGlass';
import { faCalendarDays } from '@fortawesome/pro-light-svg-icons/faCalendarDays';
import { useAppColors } from '@/shared/theme';
// 앱 바 커스텀 아이콘(Figma 57:6055 Free Force/Event) — svg-transformer, currentColor 테마 대응.
import FreeForceIcon from '@/assets/icons/appbar-free-force.svg';
import EventIcon from '@/assets/icons/appbar-event.svg';
import { AppBarButton } from './app-bar-button';

// 포스텔러 BI 심볼(Figma bi_symbol). shared 앱 바 chrome 전용 로고.
const LOGO = require('@/assets/forceteller-logo.png');

const BAR_HEIGHT = 56;

export type AppBarBackground = 'surface' | 'transparent';

export type AppBarAction = 'search' | 'freeForce' | 'event' | 'calendar';

const DEFAULT_ACTIONS: AppBarAction[] = ['search', 'freeForce', 'event', 'calendar'];

const ACTION_LABEL: Record<AppBarAction, string> = {
  search: '검색',
  freeForce: '무료 충전',
  event: '이벤트',
  calendar: '운세 캘린더',
};

// Figma newBadge: Search=false, Free Force=없음, Event/Calendar=true.
const ACTION_BADGE: Record<AppBarAction, boolean> = {
  search: false,
  freeForce: false,
  event: true,
  calendar: true,
};

export type AppBarProps = {
  /**
   * 배경. 'surface'(기본, 솔리드) | 'transparent'(히어로 위 오버레이).
   * transparent일 때 스크롤 배경 전환은 화면이 별도 Animated 레이어로 소유한다.
   */
  background?: AppBarBackground;
  /** 노출 액션(순서 유지). 기본 4종. 홈은 event 제외 등 화면별로 조정. */
  actions?: AppBarAction[];
  /** 액션 탭 — 목적지 네비게이션은 화면이 소유(가드가 게스트 리다이렉트 처리). */
  onPressAction?: (action: AppBarAction) => void;
  /** BI 로고 탭(옵션). */
  onPressLogo?: () => void;
  /** 액션 아이콘 색(기본 text/default). 히어로 위 오버레이(투데이 상단)는 흰색 등. */
  iconColor?: string;
  /** leading 슬롯 오버라이드(기본 BI 로고). 투데이 상단은 오늘 날짜 텍스트. */
  leading?: ReactNode;
};

/**
 * 포스텔러 앱 바(Figma "App Bar" Root, h56) — 탭 화면 전용 chrome.
 * BI 로고 + 표준 액션(검색/무료충전/이벤트/캘린더), Event·Calendar에 New Badge.
 * iconColor·leading 오버라이드로 투데이의 투명 상단 바(흰 아이콘 + 날짜)까지 커버.
 * 스택 상세 화면은 react-navigation 기본 헤더를 쓴다 — 이 컴포넌트는 탭에서만 소비.
 * 상단 안전영역 패딩은 ScreenContainer(솔리드) 또는 화면의 오버레이 배치(transparent)가 담당.
 */
export function AppBar({
  background = 'surface',
  actions = DEFAULT_ACTIONS,
  onPressAction,
  onPressLogo,
  iconColor,
  leading,
}: AppBarProps) {
  const colors = useAppColors();
  const resolvedIconColor = iconColor ?? colors.text.default;
  const backgroundColor = background === 'transparent' ? 'transparent' : colors.background.surface;

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <View style={styles.startSlot}>
        {leading ?? (
          <AppBarButton accessibilityLabel="포스텔러 홈" onPress={onPressLogo}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </AppBarButton>
        )}
      </View>
      <View style={styles.endSlot}>
        {actions.map((action) => (
          <AppBarButton
            key={action}
            badge={ACTION_BADGE[action]}
            accessibilityLabel={ACTION_LABEL[action]}
            onPress={onPressAction ? () => onPressAction(action) : undefined}
          >
            {renderActionIcon(action, resolvedIconColor)}
          </AppBarButton>
        ))}
      </View>
    </View>
  );
}

function renderActionIcon(action: AppBarAction, color: string) {
  switch (action) {
    case 'search':
      return <FontAwesomeIcon icon={faMagnifyingGlass} size={20} color={color} />;
    case 'freeForce':
      return <FreeForceIcon width={44} height={44} color={color} />;
    case 'event':
      return <EventIcon width={27} height={26} color={color} />;
    case 'calendar':
      return <FontAwesomeIcon icon={faCalendarDays} size={20} color={color} />;
  }
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
