import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { radius, type TypographyVariant } from '@/shared/theme';
import {
  font,
  resolveColorPath,
  textColor,
  withStyleProps,
  type ColorPath,
  type Resolver,
} from '@/shared/lib/style-engine';

// ── Chip 로컬 색 변환 ─────────────────────────
// ColorPath 기반. 무채색 chip 시맨틱 토큰 신설 전까지의 우회라 chip에 콜로케이션(공유 background는 그룹키 기반).
const chipBackground: Resolver<ColorPath> = (value, theme) => ({
  backgroundColor: resolveColorPath(value, theme),
});
const chipBorderColor: Resolver<ColorPath> = (value, theme) => ({
  borderColor: resolveColorPath(value, theme),
});

// ── 아톰(비공개) ─────────────────────────────
const ChipContainer = withStyleProps(Pressable, {
  base: {
    height: 32,
    paddingHorizontal: 14, // Figma 실측(스케일 밖 — 원시 px)
    borderRadius: radius.xl, // pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent', // solid도 1px 투명 보더 → outline과 박스 크기 동일
  },
  pressedStyle: { opacity: 0.85 },
  resolvers: { background: chipBackground, borderColor: chipBorderColor },
});

const ChipTextLabel = withStyleProps(Text, {
  resolvers: { color: textColor, font },
});

// ── variant = 토큰 경로 데이터 ────────────────
type ChipAppearance = 'outline' | 'solid';
type ChipVariant = {
  containerColor?: ColorPath;
  containerBorderColor?: ColorPath;
  textLabelColor: ColorPath;
  textLabelFont: TypographyVariant;
};

const chipVariants: Record<ChipAppearance, ChipVariant> = {
  outline: { containerBorderColor: 'text.default', textLabelColor: 'text.default', textLabelFont: 'label-lg' },
  solid: { containerColor: 'text.muted', textLabelColor: 'background.surface', textLabelFont: 'body-lg' },
};

// ── 조합(공개) ───────────────────────────────
export type ChipProps = Omit<PressableProps, 'style' | 'children' | 'accessibilityRole'> & {
  label: string;
  onPress: () => void;
  appearance?: ChipAppearance;
  style?: StyleProp<ViewStyle>;
};

/** 키워드 pill. outline(기본)/solid("더보기"). 엔진 아톰 조합 첫 사례. */
export function Chip({ label, onPress, appearance = 'outline', style, ...rest }: ChipProps) {
  const v = chipVariants[appearance];
  return (
    <ChipContainer
      accessibilityRole="button"
      onPress={onPress}
      background={v.containerColor}
      borderColor={v.containerBorderColor}
      style={style}
      {...rest}
    >
      <ChipTextLabel font={v.textLabelFont} color={v.textLabelColor}>
        {label}
      </ChipTextLabel>
    </ChipContainer>
  );
}
