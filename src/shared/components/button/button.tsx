import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius, spacing, useTheme, type TypographyVariant } from '@/shared/theme';
import {
  font,
  resolveColorPath,
  textColor,
  withStyleProps,
  type ColorPath,
  type Resolver,
} from '@/shared/lib/style-engine';

export type ButtonColor = 'primary' | 'secondary';
export type ButtonAppearance = 'solid' | 'outline';
export type ButtonSize = 'lg' | 'md' | 'sm';
export type ButtonShape = 'rounded' | 'pill';

// ── 색 데이터(ColorPath) + 상태 선택 ───────────
const COLOR_SETS: Record<
  ButtonColor,
  { main: ColorPath; on: ColorPath; mainDisabled: ColorPath; onDisabled: ColorPath }
> = {
  primary: {
    main: 'primary.primary',
    on: 'primary.onPrimary',
    mainDisabled: 'primary.primaryDisabled',
    onDisabled: 'primary.onPrimaryDisabled',
  },
  secondary: {
    main: 'secondary.secondary',
    on: 'secondary.onSecondary',
    mainDisabled: 'secondary.secondaryDisabled',
    onDisabled: 'secondary.onSecondaryDisabled',
  },
};

export type ButtonColors = { background?: ColorPath; borderColor?: ColorPath; text: ColorPath };

/** color×appearance×disabled → 컨테이너/라벨 ColorPath. solid=bg+on-color, outline=테두리+main(bg 투명). */
export function pickButtonColors(
  color: ButtonColor,
  appearance: ButtonAppearance,
  disabled: boolean,
): ButtonColors {
  const cs = COLOR_SETS[color];
  if (appearance === 'solid') {
    return { background: disabled ? cs.mainDisabled : cs.main, text: disabled ? cs.onDisabled : cs.on };
  }
  const line = disabled ? cs.mainDisabled : cs.main;
  return { borderColor: line, text: line };
}

// 사이즈 메트릭(Figma). md는 보간(h40/label-md/px16).
const SIZE: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; typography: TypographyVariant }
> = {
  lg: { height: spacing[700], paddingHorizontal: spacing[200], typography: 'label-lg' }, // 56 / 16
  md: { height: spacing[500], paddingHorizontal: spacing[200], typography: 'label-md' }, // 40 / 16
  sm: { height: spacing[400], paddingHorizontal: spacing[150], typography: 'label-md' }, // 32 / 12
};

// ── 아톰(비공개) ─────────────────────────────
const buttonBackground: Resolver<ColorPath> = (value, theme) => ({
  backgroundColor: resolveColorPath(value, theme),
});
// outline만 borderColor prop이 옴 → 그때만 1px 보더(solid는 보더 없음 = 기존 동작 보존).
const buttonBorder: Resolver<ColorPath> = (value, theme) => ({
  borderColor: resolveColorPath(value, theme),
  borderWidth: 1,
});

const ButtonContainer = withStyleProps(Pressable, {
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[100] },
  pressedStyle: { opacity: 0.85 }, // disabled/loading이면 Pressable disabled라 pressed 미발생 → 자동 억제
  resolvers: { background: buttonBackground, borderColor: buttonBorder },
});

const ButtonLabel = withStyleProps(Text, { resolvers: { color: textColor, font } });

// ── 조합(공개) ───────────────────────────────
export type ButtonProps = Omit<
  PressableProps,
  'style' | 'children' | 'accessibilityRole' | 'accessibilityState'
> & {
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
  /** 레이아웃 전용 탈출구(margin/position 등). 병합 마지막이라 여기 값이 우선. */
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
  const theme = useTheme();
  const c = pickButtonColors(color, appearance, disabled);
  const sz = SIZE[size];
  const blocked = disabled || loading;
  const dims: ViewStyle = {
    height: sz.height,
    paddingHorizontal: sz.paddingHorizontal,
    borderRadius: shape === 'pill' ? radius.xl : radius.md,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };

  return (
    <ButtonContainer
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      background={c.background}
      borderColor={c.borderColor}
      style={[dims, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={resolveColorPath(c.text, theme)} />
      ) : (
        <>
          {leading}
          <ButtonLabel font={sz.typography} color={c.text}>
            {label}
          </ButtonLabel>
          {trailing}
        </>
      )}
    </ButtonContainer>
  );
}
