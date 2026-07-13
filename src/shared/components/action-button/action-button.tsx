import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { spacing, typographyStyles, useTheme } from '@/shared/theme';
import { resolveColorPath, type ColorPath } from '@/shared/lib/style-engine';

export type ActionButtonProps = {
  icon: IconDefinition;
  label: string;
  /** 있으면 인터랙션, 없으면 정적. */
  onPress?: () => void;
  /** 아이콘·라벨 색(ColorPath). 기본 text.subtle. */
  color?: ColorPath;
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 가로 아이콘+라벨 액션(copy/share 등). Figma Action Button(239-3925) — 무료 운세 본문 하단. */
export function ActionButton({ icon, label, onPress, color = 'text.subtle', style }: ActionButtonProps) {
  const theme = useTheme();
  const c = resolveColorPath(color, theme);
  const content = (
    <>
      <FontAwesomeIcon icon={icon} size={16} color={c} />
      <Text style={[typographyStyles['label-md'], { color: c }]}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[100] }, // gap 8 (Figma)
  pressed: { opacity: 0.6 },
});
