import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Row, Typography } from '@/shared/components';
import { radius, useAppColors } from '@/shared/theme';

// TODO(token): 크림/웜 하이라이트 배경 토큰 부재(background.highlight는 kkarinaBlue 계열).
// Figma hex(#fff5c4) 직접 사용 → 추후 토큰(background.highlightWarm 등) 신설 후 교체.
const SAJU_BG = '#fff5c4';

export type SajuPillProps = {
  birth: string;
  zodiacAnimal: string;
  zodiacSign: string;
  style?: StyleProp<ViewStyle>;
};

/** 사주 요약 pill — 생년월일·時 | 띠 | 별자리 (크림 배경). */
export function SajuPill({ birth, zodiacAnimal, zodiacSign, style }: SajuPillProps) {
  const colors = useAppColors();
  return (
    <Row align="center" gap="150" style={[styles.pill, { backgroundColor: SAJU_BG }, style]}>
      <Typography variant="body-md" color="subtle" numberOfLines={1} style={styles.birth}>
        {birth}
      </Typography>
      <View style={[styles.divider, { backgroundColor: colors.stroke.default }]} />
      <Typography variant="body-md" color="subtle">
        {zodiacAnimal}
      </Typography>
      <View style={[styles.divider, { backgroundColor: colors.stroke.default }]} />
      <Typography variant="body-md" color="subtle">
        {zodiacSign}
      </Typography>
    </Row>
  );
}

const styles = StyleSheet.create({
  pill: { height: 36, borderRadius: radius.md, paddingHorizontal: 16 },
  birth: { flex: 1 },
  divider: { width: 1, height: 12 },
});
