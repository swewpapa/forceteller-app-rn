import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppColors } from '@/shared/theme';

const SLOT_SIZE = 44;
const BADGE_SIZE = 8;

export type AppBarButtonProps = {
  /** 슬롯에 중앙 배치할 아이콘(FA·SVG 컴포넌트·이미지 등). 색/크기는 호출부가 결정. */
  children: ReactNode;
  onPress?: () => void;
  /** 우상단 red dot(Figma "New Badge") — 신규/미확인 표기. */
  badge?: boolean;
  /** 텍스트 없는 버튼이므로 접근성 라벨 필수. */
  accessibilityLabel: string;
};

/**
 * 앱 바 슬롯 버튼(Figma "Button App Bar Slot" 57:6055, 44²).
 * 44 슬롯 + 중앙 정렬 + press + 옵션 badge만 담당하는 제네릭 셸.
 * 아이콘 아트(BI·Search·Free Force·Event·Calendar…)는 상위가 children으로 주입한다
 * — 제품 전용 에셋을 shared에 묶지 않기 위함.
 */
export function AppBarButton({ children, onPress, badge, accessibilityLabel }: AppBarButtonProps) {
  const colors = useAppColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={styles.slot}
    >
      {children}
      {badge ? (
        <View
          style={[styles.badge, { backgroundColor: colors.background.alert }]}
          pointerEvents="none"
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 1,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
  },
});
