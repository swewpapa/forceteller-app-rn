import { Pressable, StyleSheet } from 'react-native';
import {
  AspectRatio,
  Column,
  Image,
  ListHeader,
  PriceTag,
  Row,
  Typography,
} from '@/shared/components';
import { spacing } from '@/shared/theme';
import type { Premium, PremiumItem, PremiumLink } from '@/features/premium/types/premium-types';

type GeneralPremium = Extract<Premium, { type: 'general' }>;

export type GeneralWidgetProps = {
  premium: GeneralPremium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * general 위젯: ListHeader + 큰 썸네일(72×100) 세로 리스트. 아이템별 subtitle/title/price.
 * Figma 997:7358(Type=Large) 실측. presentational — 탭은 onPressLink에 위임.
 */
export function GeneralWidget({ premium, onPressLink }: GeneralWidgetProps) {
  const { title, subtitle, items, moreLink } = premium;
  return (
    <Column gap="250">
      <ListHeader
        title={title}
        subtitle={subtitle ?? undefined}
        onPressViewAll={moreLink ? () => onPressLink(moreLink) : undefined}
      />
      <Column gap="200">
        {items.map((item) => (
          <GeneralItemRow key={item.id} item={item} onPress={() => onPressLink(item.link)} />
        ))}
      </Column>
    </Column>
  );
}

function GeneralItemRow({ item, onPress }: { item: PremiumItem; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Row gap="250" align="center">
        <AspectRatio ratio={72 / 100} radius="xs" style={styles.thumbnail}>
          <Image source={item.thumbnailImage} accessibilityLabel={item.title} />
        </AspectRatio>
        <Column style={styles.text}>
          {item.subtitle ? (
            <Typography variant="body-sm" color="subtle" numberOfLines={1} style={styles.subtitle}>
              {item.subtitle}
            </Typography>
          ) : null}
          <Typography variant="headline-xs" numberOfLines={2}>
            {item.title}
          </Typography>
          {/* price 0/null → 태그 없음. 서버 데이터엔 원가/할인율 없어 discount off(F {price}만). */}
          {item.price ? <PriceTag price={item.price} size="12" style={styles.price} /> : null}
        </Column>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumbnail: { width: 72 },
  text: { flex: 1 },
  subtitle: { marginBottom: spacing[50] },
  price: { marginTop: spacing[100] },
});
