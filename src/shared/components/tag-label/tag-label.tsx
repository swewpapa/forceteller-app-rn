import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, typographyStyles, useTheme } from '@/shared/theme';
import { resolveColorPath } from '@/shared/lib/style-engine';
import {
  resolveTagLabelVariant,
  type TagLabelVariant,
  type TagLabelVariantKey,
} from './tag-label-style';

export type TagLabelProps = {
  label: string;
  /** 빌트인 키('default'|'highlighted') 또는 커스텀 {background,text} 주입(확장). */
  variant?: TagLabelVariantKey | TagLabelVariant;
  /** 레이아웃 전용 탈출구(margin 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 정적 status 뱃지(비인터랙션). variant로 색 페어 지정 — 커스텀 주입으로 확장 가능. */
export function TagLabel({ label, variant = 'default', style }: TagLabelProps) {
  const theme = useTheme();
  const v = resolveTagLabelVariant(variant);

  return (
    <View
      style={[styles.container, { backgroundColor: resolveColorPath(v.background, theme) }, style]}
    >
      <Text style={[typographyStyles['body-sm'], { color: resolveColorPath(v.text, theme) }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start', // 콘텐츠 hug — 부모 폭으로 늘어나지 않게
    paddingHorizontal: spacing[50], // 4 (Figma 실측)
    paddingVertical: 2, // Figma 실측(스케일 밖 원시 px)
    borderRadius: radius.xs, // 2
  },
});
