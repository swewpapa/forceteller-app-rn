import { Carousel } from '@/shared/components';
import type { Premium, PremiumLink } from '@/features/premium/types/premium-types';
import { PremiumCarouselCard } from './premium-carousel-card';

type CarouselPremium = Extract<Premium, { type: 'carousel' }>;

export type CarouselWidgetProps = {
  premium: CarouselPremium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * carousel 위젯: shared Carousel + 세로 포스터 카드(이미지 전용).
 * 카드 크기를 서버 premium.thumbnail로 결정해 Figma Carousel(997:7886, 180×200)과
 * Type6(997:10296, 72×112)를 이 위젯 하나로 흡수한다(별도 Type6 렌더러 없음).
 * moreLink가 있으면 헤더 "모두 보기"를 노출한다. presentational — 탭은 onPressLink에 위임.
 */
export function CarouselWidget({ premium, onPressLink }: CarouselWidgetProps) {
  const { title, subtitle, items, thumbnail, moreLink } = premium;
  const ratio = thumbnail.width / thumbnail.height;
  return (
    <Carousel
      title={title}
      subtitle={subtitle ?? undefined}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderCard={(item) => (
        <PremiumCarouselCard
          item={item}
          width={thumbnail.width}
          ratio={ratio}
          onPress={() => onPressLink(item.link)}
        />
      )}
      onPressViewAll={moreLink ? () => onPressLink(moreLink) : undefined}
    />
  );
}
