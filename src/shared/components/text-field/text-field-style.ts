import type { ViewStyle } from 'react-native';
import { radius, spacing, type ModeColors } from '@/shared/theme';

export type TextFieldStyleState = {
  error: boolean;
  focused: boolean;
  disabled: boolean;
};

export type TextFieldStyle = {
  container: ViewStyle;
  inputColor: string;
  placeholderColor: string;
};

/** 상태(error/focused/disabled) → 컨테이너 스타일 + 입력색 + placeholder색. 우선순위 disabled > error > focused > default. */
export function buildTextFieldStyle(state: TextFieldStyleState, colors: ModeColors): TextFieldStyle {
  const { error, focused, disabled } = state;

  const borderColor = error
    ? colors.stroke.alert
    : focused
      ? colors.primary.primary
      : colors.stroke.default;

  const container: ViewStyle = {
    height: spacing[600], // 48
    paddingHorizontal: spacing[200], // 16
    borderRadius: radius.md, // 8
    borderWidth: 1,
    // disabled는 error/focused 테두리보다 우선(회색으로 고정)
    borderColor: disabled ? colors.stroke.default : borderColor,
    backgroundColor: disabled ? colors.background.inset : colors.background.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[100], // 8
  };

  return {
    container,
    inputColor: disabled ? colors.text.muted : colors.text.default,
    placeholderColor: colors.text.muted,
  };
}
