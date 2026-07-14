import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { spacing, typographyStyles, useTheme, type TypographyVariant } from '@/shared/theme';
import { resolveColorPath, type ColorPath } from '@/shared/style-engine';

export type ActionButtonProps = {
  icon: IconDefinition;
  label: string;
  /** 있으면 인터랙션, 없으면 정적. */
  onPress?: () => void;
  /** 아이콘·라벨 색(ColorPath). 기본 text.subtle. */
  color?: ColorPath;
  /** 아이콘 px. 기본 16(Figma). Likes 등 확장에서 override. */
  iconSize?: number;
  /** 라벨 타이포. 기본 label-md. */
  labelVariant?: TypographyVariant;
  /** 아이콘↔라벨 gap px. 기본 spacing[100](8). */
  gap?: number;
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/**
 * 가로 아이콘+라벨 액션(copy/share 등). Figma Action Button(239-3925) — 무료 운세 본문 하단.
 * iconSize/labelVariant/gap은 기본값이 Figma Action Button이며, Likes 등 동류 컴포넌트가 override로 재사용.
 */
export function ActionButton({
  icon,
  label,
  onPress,
  color = 'text.subtle',
  iconSize = 16,
  labelVariant = 'label-md',
  gap = spacing[100],
  style,
}: ActionButtonProps) {
  const theme = useTheme();
  const c = resolveColorPath(color, theme);
  const content = (
    <>
      <FontAwesomeIcon icon={icon} size={iconSize} color={c} />
      <Text style={[typographyStyles[labelVariant], { color: c }]}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, { gap }, style]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { gap }, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.6 },
});
