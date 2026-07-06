import type { ViewStyle } from 'react-native';
import { radius, spacing, type ModeColors } from '@/shared/theme';
import type { TypographyVariant } from '../typography';

export type ButtonColor = 'primary' | 'secondary';
export type ButtonAppearance = 'solid' | 'outline';
export type ButtonSize = 'lg' | 'md' | 'sm';
export type ButtonShape = 'rounded' | 'pill';

export type ButtonStyleState = {
  color: ButtonColor;
  appearance: ButtonAppearance;
  size: ButtonSize;
  shape: ButtonShape;
  disabled: boolean;
};

export type ButtonStyle = {
  container: ViewStyle;
  textColor: string;
  typography: TypographyVariant;
};

const GAP = spacing[100]; // 8

// 사이즈 메트릭(Figma). md는 체계적 Figma 소스 없이 보간(h40/label-md/px16) — 스펙 참고.
const SIZE: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; typography: TypographyVariant }
> = {
  lg: { height: spacing[700], paddingHorizontal: spacing[200], typography: 'label-lg' }, // 56 / 16
  md: { height: spacing[500], paddingHorizontal: spacing[200], typography: 'label-md' }, // 40 / 16
  sm: { height: spacing[400], paddingHorizontal: spacing[150], typography: 'label-md' }, // 32 / 12
};

// color 그룹의 on-color 짝을 명시적으로 추출(키에 색 이름이 박혀 있어 동적 접근 대신 분기).
function colorSet(color: ButtonColor, colors: ModeColors) {
  if (color === 'primary') {
    const g = colors.primary;
    return { main: g.primary, on: g.onPrimary, mainDisabled: g.primaryDisabled, onDisabled: g.onPrimaryDisabled };
  }
  const g = colors.secondary;
  return { main: g.secondary, on: g.onSecondary, mainDisabled: g.secondaryDisabled, onDisabled: g.onSecondaryDisabled };
}

/** 정적 상태(색/사이즈/shape) → 컨테이너 스타일 + 라벨 색 + 타이포. pressed/loading/fullWidth는 컴포넌트에서. */
export function buildButtonStyle(state: ButtonStyleState, colors: ModeColors): ButtonStyle {
  const { color, appearance, size, shape, disabled } = state;
  const sz = SIZE[size];
  const cs = colorSet(color, colors);

  const container: ViewStyle = {
    height: sz.height,
    paddingHorizontal: sz.paddingHorizontal,
    borderRadius: shape === 'pill' ? radius.xl : radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
  };

  let textColor: string;
  if (appearance === 'solid') {
    container.backgroundColor = disabled ? cs.mainDisabled : cs.main;
    textColor = disabled ? cs.onDisabled : cs.on;
  } else {
    // outline: color-aware, 배경 항상 투명
    container.backgroundColor = 'transparent';
    container.borderWidth = 1;
    container.borderColor = disabled ? cs.mainDisabled : cs.main;
    textColor = disabled ? cs.mainDisabled : cs.main;
  }

  return { container, textColor, typography: sz.typography };
}
