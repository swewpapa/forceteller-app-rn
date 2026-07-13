import { type ModeColors, type TypographyVariant } from '@/shared/theme';

export type CheckboxSize = 'md' | 'sm';

export type CheckboxStyleState = { checked: boolean; size: CheckboxSize };

export type CheckboxStyleResult = {
  boxSize: number;
  iconColor: string;
  labelVariant: TypographyVariant;
  labelColor: string;
};

const BOX_SIZE: Record<CheckboxSize, number> = { md: 20, sm: 16 }; // Figma 실측
const LABEL_VARIANT: Record<CheckboxSize, TypographyVariant> = { md: 'label-md', sm: 'label-sm' };

/**
 * 체크박스 아이콘 크기/색 + 라벨 타이포/색. 글리프(square-check/square) 선택은 컴포넌트에서.
 * checked → primary.primary(다크모드 자동 반전), unchecked → text.subtle.
 */
export function buildCheckboxStyle(
  { checked, size }: CheckboxStyleState,
  colors: ModeColors,
): CheckboxStyleResult {
  return {
    boxSize: BOX_SIZE[size],
    iconColor: checked ? colors.primary.primary : colors.text.subtle,
    labelVariant: LABEL_VARIANT[size],
    labelColor: colors.text.default,
  };
}
