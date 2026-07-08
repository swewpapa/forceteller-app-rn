import { Pressable, StyleSheet } from 'react-native';
import { AspectRatio, Column, Image, ListHeader, Row, Typography } from '@/shared/components';
import { spacing } from '@/shared/theme';
import type { Premium, PremiumItem, PremiumLink } from '../types/premium-types';

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
          {/* price 0/null → 태그 없음(Angular의 price>0 가드 계승). 단일 price만 표기(sale/원가는 도메인 미보유). */}
          {item.price ? <PriceTag price={item.price} /> : null}
        </Column>
      </Row>
    </Pressable>
  );
}

/**
 * 포스(force) 가격 표기: 골드 "F" 마크 + 천단위 콤마 가격.
 * Figma의 브랜드 포스 코인 SVG는 아직 shared 에셋/프리미티브로 없어(그 영역은 Figma상 "개편 예정"),
 * 토큰 색(text.force)으로 칠한 "F" 텍스트를 코인 자리표시자로 쓴다 — 실제 코인 컴포넌트로 손쉽게 교체 가능.
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
  thumbnail: { width: 72 },
  text: { flex: 1 },
  subtitle: { marginBottom: spacing[50] },
  price: { marginTop: spacing[100] },
});
