import { isValidElement, type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useAppColors } from '@/shared/theme';
import { useAppBarIconColor } from './app-bar-context';

const SLOT_SIZE = 44;
const BADGE_SIZE = 8;
const DEFAULT_ICON_SIZE = 20;

export type AppBarButtonProps = {
  /**
   * FA IconDefinition(색=AppBar iconColor·기본 text.default, 크기 iconSize) 또는
   * 이미 만든 element(SVG 등 — 크기·색은 element가 소유). isValidElement로 분기.
   */
  icon: IconDefinition | ReactElement;
  /** FA icon일 때 크기(px). 기본 20. element면 무시. */
  iconSize?: number;
  onPress?: () => void;
  /** 우상단 red dot(Figma "New Badge") — 신규/미확인 표기. */
  badge?: boolean;
  /** 텍스트 없는 버튼이므로 접근성 라벨 필수. */
  accessibilityLabel: string;
};

/**
 * 앱 바 슬롯 버튼(Figma "Button App Bar Slot" 57:6055, 44²).
 * 44 슬롯 + 중앙 정렬 + press + 옵션 badge. FA는 icon def로(색·크기 자동),
 * 브랜드 SVG/커스텀은 element로 icon에 담는다. 표준 4종은 app-bar-actions의 named 버튼 사용.
 */
export function AppBarButton({
  icon,
  iconSize = DEFAULT_ICON_SIZE,
  onPress,
  badge,
  accessibilityLabel,
}: AppBarButtonProps) {
  const colors = useAppColors();
  const iconColor = useAppBarIconColor() ?? colors.text.default;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={styles.slot}
    >
      {isValidElement(icon) ? (
        icon
      ) : (
        <FontAwesomeIcon icon={icon} size={iconSize} color={iconColor} />
      )}
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
