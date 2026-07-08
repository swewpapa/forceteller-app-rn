import { CarouselFrame } from './carousel-frame';
import { FullImageCard } from './full-image-card';
import type { Theme, ThemeView } from '../types/theme-types';

type FullImageCarouselTheme = Extract<Theme, { type: 'full_image_carousel' }>;

export type FullImageCarouselWidgetProps = {
  theme: FullImageCarouselTheme;
  onPressView: (view: ThemeView) => void;
};

/** full_image_carousel 위젯: CarouselFrame + FullImageCard(240px). */
export function FullImageCarouselWidget({
  theme,
  onPressView,
}: FullImageCarouselWidgetProps) {
  return (
    <CarouselFrame
      title={theme.title}
      subtitle={theme.subtitle ?? undefined}
      data={theme.views}
      keyExtractor={v => String(v.viewId)}
      renderCard={v => <FullImageCard view={v} onPress={() => onPressView(v)} />}
    />
  );
}
