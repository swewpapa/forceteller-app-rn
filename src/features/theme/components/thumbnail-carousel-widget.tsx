import { Carousel } from '@/shared/components';
import { ThumbnailCard } from './thumbnail-card';
import type { Theme, ThemeView } from '../types/theme-types';

type ThumbnailCarouselTheme = Extract<Theme, { type: 'thumbnail_carousel' }>;

export type ThumbnailCarouselWidgetProps = {
  theme: ThumbnailCarouselTheme;
  onPressView: (view: ThemeView) => void;
};

/** thumbnail_carousel 위젯: Carousel + ThumbnailCard(144px). */
export function ThumbnailCarouselWidget({
  theme,
  onPressView,
}: ThumbnailCarouselWidgetProps) {
  return (
    <Carousel
      title={theme.title}
      subtitle={theme.subtitle ?? undefined}
      data={theme.views}
      keyExtractor={v => String(v.viewId)}
      renderCard={v => <ThumbnailCard view={v} onPress={() => onPressView(v)} />}
    />
  );
}
