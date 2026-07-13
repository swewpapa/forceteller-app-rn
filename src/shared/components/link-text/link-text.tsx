import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/pro-light-svg-icons/faArrowRight';
import { spacing, useAppColors } from '@/shared/theme';
import { Typography } from '../typography';

export type LinkTextProps = {
  label: string;
  onPress: () => void;
  /** true면 강조색(text.link), false면 보조색(text.subtle). */
  colored?: boolean;
  /** trailing 화살표 표기(Figma 기본 노출). */
  showArrow?: boolean;
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 텍스트 링크(라벨 + trailing 화살표). colored로 강조/보조 색 전환. */
export function LinkText({ label, onPress, colored = false, showArrow = true, style }: LinkTextProps) {
  const colors = useAppColors();
  const tone = colored ? 'link' : 'subtle';

  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      <Typography variant="label-md" color={tone}>
        {label}
      </Typography>
      {showArrow && <FontAwesomeIcon icon={faArrowRight} size={14} color={colors.text[tone]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[50] },
  pressed: { opacity: 0.6 },
});
