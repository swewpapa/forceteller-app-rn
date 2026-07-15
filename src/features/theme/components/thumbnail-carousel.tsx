import { Carousel } from '@/shared/components';
import type { Theme, ThemeView } from '@/features/theme/types/theme-types';
import { ThumbnailCard } from './thumbnail-card';

type ThumbnailCarouselTheme = Extract<Theme, { type: 'thumbnail_carousel' }>;

export type ThumbnailCarouselProps = {
  theme: ThumbnailCarouselTheme;
  onPressView: (view: ThemeView) => void;
};

/** thumbnail_carousel 변형: Carousel + ThumbnailCard(144px). */
export function ThumbnailCarousel({ theme, onPressView }: ThumbnailCarouselProps) {
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
