import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Column,
  ForceIcon,
  Row,
  Typography,
  type ForceGlyph,
} from '@/shared/components';
import { radius, useAppColors } from '@/shared/theme';

export type ForceCardProps = {
  force: number;
  bonusForce: number;
  onChargePress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function ForceStat({
  label,
  glyph,
  value,
  color,
}: {
  label: string;
  glyph: ForceGlyph;
  value: number;
  color: string;
}) {
  return (
    <Column gap="100">
      <Typography variant="body-sm" color="muted">
        {label}
      </Typography>
      <Row align="center" gap="50">
        <ForceIcon glyph={glyph} size={16} color={color} />
        <Typography variant="label-lg">{value.toLocaleString()}</Typography>
      </Row>
    </Column>
  );
}

/** 내 포스 / 내 보너스포스 잔액 + 충전 진입 카드. */
export function ForceCard({ force, bonusForce, onChargePress, style }: ForceCardProps) {
  const colors = useAppColors();
  return (
    <Row align="center" style={[styles.card, { borderColor: colors.stroke.subtle }, style]}>
      <Row align="center" gap="500" style={styles.stats}>
        <ForceStat label="내 포스" glyph="asset" value={force} color={colors.text.force} />
        <ForceStat
          label="내 보너스포스"
          glyph="bonus"
          value={bonusForce}
          color={colors.text.force}
        />
      </Row>
      <View style={[styles.vDivider, { backgroundColor: colors.stroke.subtle }]} />
      <Pressable accessibilityRole="button" onPress={onChargePress} style={styles.charge}>
        <Typography variant="label-md">충전</Typography>
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  card: { height: 80, borderWidth: 1, borderRadius: radius.md, paddingLeft: 20 },
  stats: { flex: 1 },
  vDivider: { width: 1, alignSelf: 'stretch' },
  charge: { width: 81, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
});
