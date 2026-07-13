import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSquareCheck } from '@fortawesome/pro-solid-svg-icons/faSquareCheck';
import { faSquare } from '@fortawesome/pro-light-svg-icons/faSquare';
import { spacing, typographyStyles, useAppColors } from '@/shared/theme';
import { buildCheckboxStyle, type CheckboxSize } from './checkbox-style';

export type CheckboxProps = {
  checked: boolean;
  /** 있으면 인터랙션(탭→onChange(!checked)), 없으면 정적 표시. */
  onChange?: (next: boolean) => void;
  /** 없으면 체크 아이콘만 렌더. */
  label?: string;
  size?: CheckboxSize;
  /** 체크박스 위치(라벨 기준). 라벨 있을 때만 유효. */
  checkboxPosition?: 'left' | 'right';
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 체크박스. label 없으면 아이콘만, onChange 없으면 정적. Figma Checkbox Icon/Item(136-524/133-52). */
export function Checkbox({
  checked,
  onChange,
  label,
  size = 'md',
  checkboxPosition = 'left',
  style,
}: CheckboxProps) {
  const colors = useAppColors();
  const { boxSize, iconColor, labelVariant, labelColor } = buildCheckboxStyle({ checked, size }, colors);
  const hasLabel = label != null && label.length > 0;

  const icon = (
    <FontAwesomeIcon icon={checked ? faSquareCheck : faSquare} size={boxSize} color={iconColor} />
  );
  const content = hasLabel ? (
    <>
      {checkboxPosition === 'left' && icon}
      <Text style={[typographyStyles[labelVariant], { color: labelColor }]}>{label}</Text>
      {checkboxPosition === 'right' && icon}
    </>
  ) : (
    icon
  );

  if (!onChange) {
    return <View style={[hasLabel && styles.row, style]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [hasLabel && styles.row, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[100] }, // gap 8
  pressed: { opacity: 0.6 },
});
