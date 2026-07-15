import type { Theme, ThemeKeyword, ThemeView } from '@/features/theme/types/theme-types';
import { FullImageCarouselWidget } from './full-image-carousel-widget';
import { KeywordCloudWidget } from './keyword-cloud-widget';
import { TextOnlyWidget } from './text-only-widget';
import { ThumbnailCarouselWidget } from './thumbnail-carousel-widget';

export type ThemeWidgetProps = {
  theme: Theme;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: Theme) => void;
  onPressKeyword?: (keyword: ThemeKeyword) => void;
};

/**
 * 테마 type → 위젯 렌더러 스위치 (레거시 SectionComponentRenderer 대응).
 * 4개 위젯 타입(text_only/keyword_cloud/thumbnail_carousel/full_image_carousel)을 모두 렌더한다.
 * default의 never 가드: 컴포넌트 반환 타입이 undefined를 허용해 fall-through가 컴파일되므로,
 * 새 위젯 타입이 union에 추가되면 여기서 컴파일 에러로 잡아 case 누락을 강제한다.
 */
export function ThemeWidget({
  theme,
  onPressView,
  onPressViewAll,
  onPressKeyword,
}: ThemeWidgetProps) {
  switch (theme.type) {
    case 'text_only':
      return (
        <TextOnlyWidget theme={theme} onPressView={onPressView} onPressViewAll={onPressViewAll} />
      );
    case 'keyword_cloud':
      return (
        <KeywordCloudWidget theme={theme} onPressKeyword={onPressKeyword ?? (() => undefined)} />
      );
    case 'thumbnail_carousel':
      return <ThumbnailCarouselWidget theme={theme} onPressView={onPressView} />;
    case 'full_image_carousel':
      return <FullImageCarouselWidget theme={theme} onPressView={onPressView} />;
    default: {
      const _exhaustive: never = theme;
      return _exhaustive;
    }
  }
}
