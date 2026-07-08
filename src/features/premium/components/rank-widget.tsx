import { Pressable, StyleSheet, Text } from 'react-native';
import { AspectRatio, Column, Image, ListHeader, Row, Typography } from '@/shared/components';
import { spacing, typographyStyles, useAppColors } from '@/shared/theme';
import type { Premium, PremiumItem, PremiumLink } from '../types/premium-types';

type RankPremium = Extract<Premium, { type: 'rank' }>;

export type RankWidgetProps = {
  premium: RankPremium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * rank 위젯: ListHeader + 순위 번호 + 작은 썸네일(50×70) 세로 리스트.
 * Figma 997:7360(Type=Rank) 실측. presentational — 탭은 onPressLink에 위임.
 */
export function RankWidget({ premium, onPressLink }: RankWidgetProps) {
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
          <Text style={[typographyStyles['headline-xs'], styles.rank, { color: colors.text.muted }]}>
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
            {/* price 0/null → 태그 없음. Angular rank는 hidePrice=true로 가격을 숨겼으나,
                RN 도메인 모델은 rank도 price 보유(주석 "general/rank만 non-null")라 데이터 주도로 표기(Figma도 표기). */}
            {item.price ? <PriceTag price={item.price} /> : null}
          </Column>
        </Row>
      </Row>
    </Pressable>
  );
}

/**
 * 포스(force) 가격 표기: 골드 "F" 마크 + 천단위 콤마 가격.
 * 브랜드 포스 코인 SVG는 아직 shared 에셋/프리미티브로 없어(Figma상 "개편 예정") 토큰 색(text.force)의
 * "F" 텍스트를 코인 자리표시자로 사용 — 실제 코인 컴포넌트로 손쉽게 교체 가능.
 */
function PriceTag({ price }: { price: number }) {
  return (
    <Row gap="50" align="center" style={styles.price}>
      <Typography variant="label-sm" color="force">
        F
      </Typography>
      <Typography variant="label-sm">{formatPrice(price)}</Typography>
    </Row>
  );
}

/** 천 단위 콤마 — Hermes Intl 의존 없이 결정적으로 포맷(toLocaleString 회피). */
function formatPrice(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const styles = StyleSheet.create({
  thumbnail: { width: 50 },
  body: { flex: 1 },
  rank: { width: 16, fontStyle: 'italic' },
  text: { flex: 1 },
  subtitle: { marginBottom: spacing[50] },
  price: { marginTop: spacing[100] },
});
