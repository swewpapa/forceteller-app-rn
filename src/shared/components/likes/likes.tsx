import type { StyleProp, ViewStyle } from 'react-native';
import { faHeart as faHeartSolid } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { faHeart as faHeartLight } from '@fortawesome/pro-light-svg-icons/faHeart';
import { ActionButton } from '../action-button';
import { buildLikesVisual, formatLikeCount, type LikesSize } from './likes-style';

export type LikesProps = {
  count: number;
  liked?: boolean;
  size?: LikesSize;
  /** 있으면 인터랙션(좋아요 토글 등), 없으면 표시 전용. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** 좋아요 하트+카운트 — ActionButton 조합. liked면 채운 하트+secondary색. Figma Likes(5-1313). */
export function Likes({ count, liked = false, size = 'small', onPress, style }: LikesProps) {
  const { iconSize, labelVariant, gap, color } = buildLikesVisual(size, liked);
  return (
    <ActionButton
      icon={liked ? faHeartSolid : faHeartLight}
      label={formatLikeCount(count)}
      onPress={onPress}
      color={color}
      iconSize={iconSize}
      labelVariant={labelVariant}
      gap={gap}
      style={style}
    />
  );
}
