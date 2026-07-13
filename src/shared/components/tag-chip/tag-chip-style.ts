import type { ViewStyle } from 'react-native';
import { radius, spacing, type ModeColors } from '@/shared/theme';

export type TagChipStyleState = { selected: boolean };
export type TagChipStyle = { container: ViewStyle; textColor: string };

/**
 * 선택 토글 칩(rect) 정적 스타일. selected → solid(primary), 미선택 → 중립 outline.
 * 폰트는 컴포넌트가 label-md 고정 적용. pressed는 컴포넌트에서.
 */
export function buildTagChipStyle(
  { selected }: TagChipStyleState,
  colors: ModeColors,
): TagChipStyle {
  const container: ViewStyle = {
    height: spacing[350], // 28
    paddingHorizontal: spacing[100], // 8
    borderRadius: radius.md, // 8
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent', // solid도 1px 투명 보더 → outline과 박스 크기 동일(Chip 선례)
  };

  let textColor: string;
  if (selected) {
    container.backgroundColor = colors.primary.primary;
    textColor = colors.primary.onPrimary;
  } else {
    container.backgroundColor = 'transparent';
    container.borderColor = colors.stroke.default;
    textColor = colors.text.subtle;
  }

  return { container, textColor };
}
