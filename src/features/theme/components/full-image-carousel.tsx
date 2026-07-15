import { Carousel } from '@/shared/components';
import type { Theme, ThemeView } from '@/features/theme/types/theme-types';
import { FullImageCard } from './full-image-card';

type FullImageCarouselTheme = Extract<Theme, { type: 'full_image_carousel' }>;

export type FullImageCarouselProps = {
  theme: FullImageCarouselTheme;
  onPressView: (view: ThemeView) => void;
};

/** full_image_carousel 변형: Carousel + FullImageCard(240px). */
export function FullImageCarousel({ theme, onPressView }: FullImageCarouselProps) {
  return (
    <Carousel
      title={theme.title}
      subtitle={theme.subtitle ?? undefined}
      data={theme.views}
      keyExtractor={(v) => String(v.viewId)}
      renderCard={(v) => <FullImageCard view={v} onPress={() => onPressView(v)} />}
    />
  );
}
