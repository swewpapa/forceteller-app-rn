import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, type TypographyVariant } from '@/shared/theme';
import {
  font,
  resolveColorPath,
  textColor,
  withStyleProps,
  type ColorPath,
  type Resolver,
} from '@/shared/lib/style-engine';
import {
  resolveTagLabelVariant,
  type TagLabelVariant,
  type TagLabelVariantKey,
} from './tag-label-style';

const tagLabelBackground: Resolver<ColorPath> = (value, theme) => ({
  backgroundColor: resolveColorPath(value, theme),
});

// ── 아톰(비공개) ─────────────────────────────
const TagLabelContainer = withStyleProps(View, {
  base: {
    alignSelf: 'flex-start', // 콘텐츠 hug
    paddingHorizontal: spacing[50], // 4 (Figma 실측)
    paddingVertical: 2, // Figma 실측(스케일 밖 원시 px)
    borderRadius: radius.xs, // 2
  },
  resolvers: { background: tagLabelBackground },
});

const TagLabelText = withStyleProps(Text, {
  resolvers: { color: textColor, font },
});

const LABEL_FONT: TypographyVariant = 'body-sm';

export type TagLabelProps = {
  label: string;
  /** 빌트인 키('default'|'highlighted') 또는 커스텀 {background,text} 주입(확장). */
  variant?: TagLabelVariantKey | TagLabelVariant;
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 정적 status 뱃지(비인터랙션). variant로 색 페어 지정 — 커스텀 주입으로 확장 가능. */
export function TagLabel({ label, variant = 'default', style }: TagLabelProps) {
  const v = resolveTagLabelVariant(variant);
  return (
    <TagLabelContainer background={v.background} style={style}>
      <TagLabelText font={LABEL_FONT} color={v.text}>
        {label}
      </TagLabelText>
    </TagLabelContainer>
  );
}
