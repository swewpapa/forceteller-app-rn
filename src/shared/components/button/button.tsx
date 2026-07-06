import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppColors } from '@/shared/theme';
import { typographyStyles } from '../typography';
import {
  buildButtonStyle,
  type ButtonAppearance,
  type ButtonColor,
  type ButtonShape,
  type ButtonSize,
} from './button-style';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  onPress: () => void;
  color?: ButtonColor;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  shape?: ButtonShape;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 레이아웃 전용 탈출구(margin/position 등). 병합 마지막이라 여기 값이 우선. 색·사이즈 등 시각 정체성은 named prop으로. */
  style?: StyleProp<ViewStyle>;
};

/** 디자인 시스템 Button. color=on-color(solid는 bg+파생 글자, outline은 테두리+글자), leading/trailing 슬롯. */
export function Button({
  label,
  onPress,
  color = 'primary',
  appearance = 'solid',
  size = 'lg',
  shape = 'rounded',
  disabled = false,
  loading = false,
  fullWidth = false,
  leading,
  trailing,
  style,
  ...rest
}: ButtonProps) {
  const colors = useAppColors();
  const { container, textColor, typography } = buildButtonStyle(
    { color, appearance, size, shape, disabled },
    colors,
  );
  const blocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        container,
        { alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        pressed && !blocked && { opacity: 0.85 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {leading}
          <Text style={[typographyStyles[typography], { color: textColor }]}>{label}</Text>
          {trailing}
        </>
      )}
    </Pressable>
  );
}
