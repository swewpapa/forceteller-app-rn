import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Column, Typography } from '@/shared/components';

const ICON_SIZE = 30;

export type Shortcut = {
  key: string;
  label: string;
  /** 원격 SVG 아이콘 URL(서버 제공, /api/more/list). */
  iconUrl: string;
  /** 비활성(회색): 아직 열리지 않은 메뉴. */
  disabled?: boolean;
  onPress?: () => void;
};

export type ShortcutGridProps = {
  items: Shortcut[];
  style?: StyleProp<ViewStyle>;
};

function ShortcutItem({ label, iconUrl, disabled, onPress }: Omit<Shortcut, 'key'>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.item}
    >
      <Column align="center" gap="150" style={disabled ? styles.disabled : undefined}>
        {/* 원격 SVG 그대로 렌더(서버 fill 고정). night 모드 테마 적응은 후속 과제. */}
        <SvgUri uri={iconUrl} width={ICON_SIZE} height={ICON_SIZE} />
        <Typography variant="label-sm" color="subtle">
          {label}
        </Typography>
      </Column>
    </Pressable>
  );
}

/**
 * 4열 숏컷 그리드. 아이템(라벨·아이콘·목적지)은 서버(/api/more/list)에서 오고,
 * 목적지 라우팅은 각 항목 onPress로 주입한다(게스트→로그인 / 로그인→링크 네비).
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
