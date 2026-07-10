import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Column, Typography } from '@/shared/components';
import { useAppColors } from '@/shared/theme';

export type Shortcut = {
  key: string;
  label: string;
  icon: IconDefinition;
  /** 비활성(회색): 아직 열리지 않은 메뉴. */
  disabled?: boolean;
  onPress?: () => void;
};

export type ShortcutGridProps = {
  items: Shortcut[];
  style?: StyleProp<ViewStyle>;
};

function ShortcutItem({ label, icon, disabled, onPress }: Omit<Shortcut, 'key'>) {
  const colors = useAppColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.item}
    >
      <Column align="center" gap="150" style={disabled ? styles.disabled : undefined}>
        <FontAwesomeIcon icon={icon} size={24} color={colors.text.default} />
        <Typography variant="label-sm" color="subtle">
          {label}
        </Typography>
      </Column>
    </Pressable>
  );
}

/**
 * 4열 숏컷 그리드. 목적지 라우팅은 각 항목 onPress로 주입한다(현재 대부분 플레이스홀더).
 * FA Pro 아이콘은 Figma 실제 에셋의 근사치 — 추후 정확한 아이콘으로 교체 가능.
 */
export function ShortcutGrid({ items, style }: ShortcutGridProps) {
  return (
    <View style={[styles.grid, style]}>
      {items.map(({ key, ...item }) => (
        <ShortcutItem key={key} {...item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 },
  item: { width: '25%', alignItems: 'center', paddingVertical: 4 },
  disabled: { opacity: 0.3 },
});
