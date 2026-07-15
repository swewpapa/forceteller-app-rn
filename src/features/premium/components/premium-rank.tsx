import { Pressable, StyleSheet, Text } from 'react-native';
import {
  AspectRatio,
  Column,
  Image,
  ListHeader,
  PriceTag,
  Row,
  Typography,
} from '@/shared/components';
import { spacing, typographyStyles, useAppColors } from '@/shared/theme';
import type { Premium, PremiumItem, PremiumLink } from '@/features/premium/types/premium-types';

type RankPremium = Extract<Premium, { type: 'rank' }>;

export type PremiumRankProps = {
  premium: RankPremium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * rank 변형: ListHeader + 순위 번호 + 작은 썸네일(50×70) 세로 리스트.
 * Figma 997:7360(Type=Rank) 실측. presentational — 탭은 onPressLink에 위임.
 */
export function PremiumRank({ premium, onPressLink }: PremiumRankProps) {
  const { title, subtitle, items, moreLink } = premium;
  return (
    <Column gap="250">
      <ListHeader
        title={title}
        subtitle={subtitle ?? undefined}
        onPressViewAll={moreLink ? () => onPressLink(moreLink) : undefined}
      />
      <Column gap="200">
        {items.map((item, index) => (
          <RankItemRow
            key={item.id}
            rank={index + 1}
            item={item}
            onPress={() => onPressLink(item.link)}
          />
        ))}
      </Column>
    </Column>
  );
}

function RankItemRow({
  rank,
  item,
  onPress,
}: {
  rank: number;
  item: PremiumItem;
  onPress: () => void;
}) {
  const colors = useAppColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Row gap="250" align="center">
        <AspectRatio ratio={50 / 70} radius="xs" style={styles.thumbnail}>
          <Image source={item.thumbnailImage} accessibilityLabel={item.title} />
        </AspectRatio>
        <Row gap="150" align="center" style={styles.body}>
          {/* 순위 번호: Figma는 Roboto Medium Italic이나 Roboto는 앱 등록 폰트가 아니라(GoogleSignIn Pod 내부에만 존재)
              디자인 시스템 폰트에 italic만 적용. 색 text/muted. */}
          <Text
            style={[typographyStyles['headline-xs'], styles.rank, { color: colors.text.muted }]}
          >
            {rank}
          </Text>
          <Column style={styles.text}>
            {item.subtitle ? (
              <Typography
                variant="body-sm"
                color="subtle"
                numberOfLines={1}
                style={styles.subtitle}
              >
                {item.subtitle}
              </Typography>
            ) : null}
            <Typography variant="headline-xs" numberOfLines={2}>
              {item.title}
            </Typography>
            {/* rank도 price 노출(Martin 확정, Figma 기준). Angular는 hidePrice=true였으나 최신 디자인은 표기.
                price 0/null이면 태그 없음. 서버 데이터엔 원가/할인율 없어 discount는 off(F {price}만). */}
            {item.price ? <PriceTag price={item.price} size="12" style={styles.price} /> : null}
          </Column>
        </Row>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumbnail: { width: 50 },
  body: { flex: 1 },
  rank: { width: 16, fontStyle: 'italic' },
  text: { flex: 1 },
  subtitle: { marginBottom: spacing[50] },
  price: { marginTop: spacing[100] },
});
