import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSquareCheck } from '@fortawesome/pro-solid-svg-icons/faSquareCheck';
import { faSquare } from '@fortawesome/pro-light-svg-icons/faSquare';
import { spacing, useAppColors, type TypographyVariant } from '@/shared/theme';
import { Typography } from '@/shared/components/typography';

export type CheckboxSize = 'md' | 'sm';

// 아이콘 박스 px + 라벨 타이포(Figma 실측). checked/unchecked 색은 컴포넌트에서 토큰 직접 선택.
const SIZE: Record<CheckboxSize, { box: number; label: TypographyVariant }> = {
  md: { box: 20, label: 'label-md' },
  sm: { box: 16, label: 'label-sm' },
};

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

/** 체크박스. label 없으면 아이콘만, onChange 없으면 정적. 단일 FA 글리프. Figma Checkbox(136-524/133-52). */
export function Checkbox({
  checked,
  onChange,
  label,
  size = 'md',
  checkboxPosition = 'left',
  style,
}: CheckboxProps) {
  const colors = useAppColors();
  const { box, label: labelVariant } = SIZE[size];
  const hasLabel = label != null && label.length > 0;

  const icon = (
    <FontAwesomeIcon
      icon={checked ? faSquareCheck : faSquare}
      size={box}
      color={checked ? colors.primary.primary : colors.text.subtle}
    />
  );
  const content = hasLabel ? (
    <>
      {checkboxPosition === 'left' && icon}
      <Typography variant={labelVariant} color="default">
        {label}
      </Typography>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[100] }, // gap 8
  pressed: { opacity: 0.6 },
});
