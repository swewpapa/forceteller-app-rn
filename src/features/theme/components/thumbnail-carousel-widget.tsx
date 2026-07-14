import { Carousel } from '@/shared/components';
import type { Theme, ThemeView } from '@/features/theme/types/theme-types';
import { ThumbnailCard } from './thumbnail-card';

type ThumbnailCarouselTheme = Extract<Theme, { type: 'thumbnail_carousel' }>;

export type ThumbnailCarouselWidgetProps = {
  theme: ThumbnailCarouselTheme;
  onPressView: (view: ThemeView) => void;
};

/** thumbnail_carousel 위젯: Carousel + ThumbnailCard(144px). */
export function ThumbnailCarouselWidget({ theme, onPressView }: ThumbnailCarouselWidgetProps) {
  return (
    <Carousel
      title={theme.title}
      subtitle={theme.subtitle ?? undefined}
      data={theme.views}
      keyExtractor={(v) => String(v.viewId)}
      renderCard={(v) => <ThumbnailCard view={v} onPress={() => onPressView(v)} />}
    />
  );
}
