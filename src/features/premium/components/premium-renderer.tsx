import type { Premium, PremiumLink } from '../types/premium-types';
import { PremiumBanner } from './premium-banner';
import { PremiumButton } from './premium-button';
import { PremiumCarousel } from './premium-carousel';
import { PremiumGeneral } from './premium-general';
import { PremiumRank } from './premium-rank';
import { PremiumTag } from './premium-tag';

export type PremiumRendererProps = {
  premium: Premium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * premium type → 순수 변형 스위치 (레거시 premium-list 컴포넌트 대응).
 * 6개 변형(rank/general/banner/carousel/button/tag)을 모두 렌더한다.
 * default의 never 가드: 새 변형 타입이 union에 추가되면 여기서 컴파일 에러로 case 누락을
 * 강제한다(theme-widget.tsx 동일 패턴).
 */
export function PremiumRenderer({ premium, onPressLink }: PremiumRendererProps) {
  switch (premium.type) {
    case 'rank':
      return <PremiumRank premium={premium} onPressLink={onPressLink} />;
    case 'general':
      return <PremiumGeneral premium={premium} onPressLink={onPressLink} />;
    case 'banner':
      return <PremiumBanner premium={premium} onPressLink={onPressLink} />;
    case 'carousel':
      return <PremiumCarousel premium={premium} onPressLink={onPressLink} />;
    case 'button':
      return <PremiumButton premium={premium} onPressLink={onPressLink} />;
    case 'tag':
      return <PremiumTag premium={premium} onPressLink={onPressLink} />;
    default: {
      const _exhaustive: never = premium;
      return _exhaustive;
    }
  }
}
