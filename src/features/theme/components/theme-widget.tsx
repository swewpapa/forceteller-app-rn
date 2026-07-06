import type { Theme, ThemeView } from '../types/theme-types';
import { TextOnlyWidget } from './text-only-widget';

export type ThemeWidgetProps = {
  theme: Theme;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: Theme) => void;
};

/**
 * 테마 type → 위젯 렌더러 스위치 (레거시 SectionComponentRenderer 대응).
 * 미구현 타입은 렌더하지 않는다 — 후속 사이클에서 case 추가:
 * thumbnail_carousel/full_image_carousel(Image 프리미티브 선행), keyword_cloud(Chip 선행).
 * default의 never 가드: 컴포넌트 반환 타입이 undefined를 허용해 fall-through가 컴파일되므로,
 * 새 위젯 타입이 union에 추가되면 여기서 컴파일 에러로 잡아 case 누락을 강제한다.
 */
export function ThemeWidget({ theme, onPressView, onPressViewAll }: ThemeWidgetProps) {
  switch (theme.type) {
    case 'text_only':
      return (
        <TextOnlyWidget theme={theme} onPressView={onPressView} onPressViewAll={onPressViewAll} />
      );
    case 'thumbnail_carousel':
    case 'full_image_carousel':
    case 'keyword_cloud':
      return null;
    default: {
      const _exhaustive: never = theme;
      return _exhaustive;
    }
  }
}
