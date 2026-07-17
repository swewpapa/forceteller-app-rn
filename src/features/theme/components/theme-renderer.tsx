import type { Theme, ThemeKeyword, ThemeView } from '../types/theme-types';
import { FullImageCarousel } from './full-image-carousel';
import { KeywordCloud } from './keyword-cloud';
import { TextOnly } from './text-only';
import { ThumbnailCarousel } from './thumbnail-carousel';

export type ThemeRendererProps = {
  theme: Theme;
  onPressView: (view: ThemeView) => void;
  onPressViewAll?: (theme: Theme) => void;
  onPressKeyword?: (keyword: ThemeKeyword) => void;
};

/**
 * 테마 type → 순수 변형 스위치 (레거시 SectionComponentRenderer 대응).
 * 4개 변형(text_only/keyword_cloud/thumbnail_carousel/full_image_carousel)을 모두 렌더한다.
 * default의 never 가드: 컴포넌트 반환 타입이 undefined를 허용해 fall-through가 컴파일되므로,
 * 새 변형 타입이 union에 추가되면 여기서 컴파일 에러로 잡아 case 누락을 강제한다.
 */
export function ThemeRenderer({
  theme,
  onPressView,
  onPressViewAll,
  onPressKeyword,
}: ThemeRendererProps) {
  switch (theme.type) {
    case 'text_only':
      return <TextOnly theme={theme} onPressView={onPressView} onPressViewAll={onPressViewAll} />;
    case 'keyword_cloud':
      return <KeywordCloud theme={theme} onPressKeyword={onPressKeyword ?? (() => undefined)} />;
    case 'thumbnail_carousel':
      return <ThumbnailCarousel theme={theme} onPressView={onPressView} />;
    case 'full_image_carousel':
      return <FullImageCarousel theme={theme} onPressView={onPressView} />;
    default: {
      const _exhaustive: never = theme;
      return _exhaustive;
    }
  }
}
