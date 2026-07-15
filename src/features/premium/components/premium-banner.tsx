import { Pressable, StyleSheet } from 'react-native';
import { Image } from '@/shared/components';
import { spacing } from '@/shared/theme';
import type { Premium, PremiumLink } from '@/features/premium/types/premium-types';

type BannerPremium = Extract<Premium, { type: 'banner' }>;

export type PremiumBannerProps = {
  premium: BannerPremium;
  onPressLink: (link: PremiumLink) => void;
};

const BANNER_HEIGHT = 220; // Angular premium-list-banner 실측(고정 height)

/**
 * banner 변형: 헤더 없는 통짜 배너(고정 220px). bgColor(raw hex) 배경 + cover 이미지.
 * 스크린 좌우 패딩(spacing[300])을 음수 마진으로 상쇄해 엣지투엣지(shared Carousel 패턴 계승).
 * presentational — 배너 전체 탭은 onPressLink에 위임.
 */
export function PremiumBanner({ premium, onPressLink }: PremiumBannerProps) {
  const { image, bgColor, link, title } = premium;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPressLink(link)}
      // bgColor는 서버 raw hex라 토큰 밖 — 인라인 탈출구(ListItem labelColor 선례).
      style={[styles.banner, { backgroundColor: bgColor }]}
    >
      <Image source={image} contentFit="cover" accessibilityLabel={title} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { height: BANNER_HEIGHT, marginHorizontal: -spacing[300] },
});
