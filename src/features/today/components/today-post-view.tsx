import type { TodayLink, TodayPost } from '@/features/today/types/today-types';
import { ChatPost } from './chat-post';
import { FullImagePost } from './full-image-post';
import { GiftPost } from './gift-post';
import { IconPost } from './icon-post';
import { ThumbnailPost } from './thumbnail-post';
import { WeatherPost } from './weather-post';

export type TodayPostViewProps = {
  post: TodayPost;
  onPressLink: (link: TodayLink) => void;
};

/**
 * today post type → 표시형 컴포넌트 스위치 (premium-widget.tsx 동일 패턴).
 * 4개 표시형(full_image/thumbnail/icon/weather)을 모두 렌더한다.
 * default의 never 가드: 새 표시형이 union에 추가되면 여기서 컴파일 에러로 case 누락을
 * 강제한다.
 */
export function TodayPostView({ post, onPressLink }: TodayPostViewProps) {
  switch (post.type) {
    case 'full_image':
      return <FullImagePost post={post} onPressLink={onPressLink} />;
    case 'thumbnail':
      return <ThumbnailPost post={post} onPressLink={onPressLink} />;
    case 'icon':
      return <IconPost post={post} onPressLink={onPressLink} />;
    case 'weather':
      return <WeatherPost post={post} onPressLink={onPressLink} />;
    case 'gift':
      return <GiftPost post={post} onPressLink={onPressLink} />;
    case 'chat':
      return <ChatPost post={post} onPressLink={onPressLink} />;
    default: {
      const _exhaustive: never = post;
      return _exhaustive;
    }
  }
}
