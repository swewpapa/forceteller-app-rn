import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppColors } from '@/shared/theme';

const BAR_HEIGHT = 56;

export type AppBarBackground = 'surface' | 'transparent';

export type AppBarProps = {
  /** Start Slot(좌) — 보통 브랜드 BI. */
  leading?: ReactNode;
  /** End Slot(우, 우측 정렬) — 액션 버튼 그룹. */
  trailing?: ReactNode;
  /**
   * 배경. 'surface'(기본, 솔리드) | 'transparent'(히어로 위 오버레이).
   * transparent일 때 스크롤 배경 전환은 화면이 별도 Animated 레이어로 소유한다.
   */
  background?: AppBarBackground;
  /** 컨테이너 스타일 — 오버레이 절대배치·상단 inset 등 화면이 주입. */
  style?: StyleProp<ViewStyle>;
};

/**
 * 앱 상단 바 Root(Figma "App Bar" type=Root, h56).
 * 좌: Start Slot(leading) / 우: End Slot(trailing, 우측 정렬, pr4).
 * 순수 셸 — 배경 변형만 알고, 스크롤 반응(투데이)은 화면이 소유한다.
 * 상단 안전영역 패딩은 ScreenContainer(솔리드) 또는 화면의 오버레이 배치(transparent)가 담당.
 * (Sub 타입 = 뒤로가기 + 타이틀 = 스택 상세 화면용, 후속 작업.)
 */
export function AppBar({ leading, trailing, background = 'surface', style }: AppBarProps) {
  const colors = useAppColors();
  const backgroundColor =
    background === 'transparent' ? 'transparent' : colors.background.surface;

  return (
    <View style={[styles.root, { backgroundColor }, style]}>
      <View style={styles.startSlot}>{leading}</View>
      <View style={styles.endSlot}>{trailing}</View>
    </View>
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
});
