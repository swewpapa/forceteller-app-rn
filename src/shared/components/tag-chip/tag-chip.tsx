import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, type TypographyVariant } from '@/shared/theme';
import {
  font,
  resolveColorPath,
  textColor,
  withStyleProps,
  type ColorPath,
  type Resolver,
} from '@/shared/style-engine';

// ── 로컬 색 리졸버(Chip 선례와 동일 결) ─────────
const tagChipBackground: Resolver<ColorPath> = (value, theme) => ({
  backgroundColor: resolveColorPath(value, theme),
});
const tagChipBorderColor: Resolver<ColorPath> = (value, theme) => ({
  borderColor: resolveColorPath(value, theme),
});

// ── 아톰(비공개) ─────────────────────────────
const TagChipContainer = withStyleProps(Pressable, {
  base: {
    height: spacing[350], // 28
    paddingHorizontal: spacing[100], // 8
    borderRadius: radius.md, // 8 (pill 아님)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent', // solid도 1px 투명 보더 → outline과 박스 크기 동일
  },
  pressedStyle: { opacity: 0.85 },
  resolvers: { background: tagChipBackground, borderColor: tagChipBorderColor },
});

const TagChipLabel = withStyleProps(Text, {
  resolvers: { color: textColor, font },
});

// ── variant = 토큰 경로 데이터 ────────────────
type TagChipVariant = {
  containerColor?: ColorPath;
  containerBorderColor?: ColorPath;
  textLabelColor: ColorPath;
};

const tagChipVariants: Record<'selected' | 'unselected', TagChipVariant> = {
  selected: { containerColor: 'primary.primary', textLabelColor: 'primary.onPrimary' },
  unselected: { containerBorderColor: 'stroke.default', textLabelColor: 'text.subtle' },
};

const LABEL_FONT: TypographyVariant = 'label-md';

// ── 조합(공개) ───────────────────────────────
export type TagChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 선택 토글 칩(rect). selected로 solid(primary)/중립 outline 전환. Figma Tag Chip(2-762). */
export function TagChip({ label, selected, onPress, style }: TagChipProps) {
  const v = selected ? tagChipVariants.selected : tagChipVariants.unselected;
  return (
    <TagChipContainer
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      background={v.containerColor}
      borderColor={v.containerBorderColor}
      style={style}
    >
      <TagChipLabel font={LABEL_FONT} color={v.textLabelColor}>
        {label}
      </TagChipLabel>
    </TagChipContainer>
  );
}
