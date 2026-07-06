import { Pressable, StyleSheet, Text } from 'react-native';
import { spacing, useAppColors } from '@/shared/theme';
import { typographyStyles } from '../typography';

export type ListItemProps = {
  /** 좌측 라벨(카테고리 등). */
  label?: string;
  /**
   * 라벨 색 — 서버 드리븐 hex를 그대로 받는 탈출구.
   * 규약 3계층 정책(시각 정체성=named prop)의 명시적 예외: 색의 출처가 토큰이 아니라 서버 데이터.
   */
  labelColor?: string;
  title: string;
  onPress?: () => void;
};

/** 라벨 + 제목 텍스트 행 (하단 보더). Typography color가 토큰 한정이라 Button 선례대로 <Text>+typographyStyles 직접 조합. */
export function ListItem({ label, labelColor, title, onPress }: ListItemProps) {
  const colors = useAppColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.stroke.subtle }]}
    >
      {label ? (
        <Text style={[typographyStyles['label-sm'], { color: labelColor ?? colors.text.subtle }]}>
          {label}
        </Text>
      ) : null}
      <Text
        numberOfLines={1}
        style={[typographyStyles['label-lg'], styles.title, { color: colors.text.default }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[200],
    paddingVertical: spacing[150],
    borderBottomWidth: 1,
  },
  title: { flex: 1 },
});
