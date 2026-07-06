import type { ThemeView, ThemeWidget } from '../types/theme-types';
import { TextOnlyWidget } from './text-only-widget';

export type ThemeWidgetRendererProps = {
  widget: ThemeWidget;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (widget: ThemeWidget) => void;
};

/**
 * 위젯 type → 렌더러 스위치 (레거시 SectionComponentRenderer 대응).
 * 미구현 타입은 렌더하지 않는다 — 후속 사이클에서 case 추가:
 * thumbnail_carousel/full_image_carousel(Image 프리미티브 선행), keyword_cloud(Chip 선행).
 */
export function ThemeWidgetRenderer({ widget, onPressView, onPressViewAll }: ThemeWidgetRendererProps) {
  switch (widget.type) {
    case 'text_only':
      return (
        <TextOnlyWidget widget={widget} onPressView={onPressView} onPressViewAll={onPressViewAll} />
      );
    case 'thumbnail_carousel':
    case 'full_image_carousel':
    case 'keyword_cloud':
      return null;
  }
}
