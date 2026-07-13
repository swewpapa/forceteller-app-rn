import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { typographyStyles, useAppColors } from '@/shared/theme';
import { buildTagChipStyle } from './tag-chip-style';

export type TagChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 선택 토글 칩(rect). selected로 solid(primary)/중립 outline 전환. Figma Tag Chip(2-762). */
export function TagChip({ label, selected, onPress, style }: TagChipProps) {
  const colors = useAppColors();
  const { container, textColor } = buildTagChipStyle({ selected }, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [container, pressed && styles.pressed, style]}
    >
      <Text style={[typographyStyles['label-md'], { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({ pressed: { opacity: 0.85 } });
