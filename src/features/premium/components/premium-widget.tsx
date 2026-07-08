import { BannerWidget } from './banner-widget';
import { ButtonWidget } from './button-widget';
import { CarouselWidget } from './carousel-widget';
import { GeneralWidget } from './general-widget';
import { RankWidget } from './rank-widget';
import { TagWidget } from './tag-widget';
import type { Premium, PremiumLink } from '../types/premium-types';

export type PremiumWidgetProps = {
  premium: Premium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * premium type → 위젯 렌더러 스위치 (레거시 premium-list 컴포넌트 대응).
 * 6개 위젯 타입(rank/general/banner/carousel/button/tag)을 모두 렌더한다.
 * default의 never 가드: 새 위젯 타입이 union에 추가되면 여기서 컴파일 에러로 case 누락을
 * 강제한다(theme-widget.tsx 동일 패턴).
 */
export function PremiumWidget({ premium, onPressLink }: PremiumWidgetProps) {
  switch (premium.type) {
    case 'rank':
      return <RankWidget premium={premium} onPressLink={onPressLink} />;
    case 'general':
      return <GeneralWidget premium={premium} onPressLink={onPressLink} />;
    case 'banner':
      return <BannerWidget premium={premium} onPressLink={onPressLink} />;
    case 'carousel':
      return <CarouselWidget premium={premium} onPressLink={onPressLink} />;
    case 'button':
      return <ButtonWidget premium={premium} onPressLink={onPressLink} />;
    case 'tag':
      return <TagWidget premium={premium} onPressLink={onPressLink} />;
    default: {
      const _exhaustive: never = premium;
      return _exhaustive;
    }
  }
}
