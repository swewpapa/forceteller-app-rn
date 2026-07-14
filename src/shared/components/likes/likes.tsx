import type { StyleProp, ViewStyle } from 'react-native';
import { faHeart as faHeartSolid } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { faHeart as faHeartLight } from '@fortawesome/pro-light-svg-icons/faHeart';
import { spacing, type TypographyVariant } from '@/shared/theme';
import { ActionButton } from '@/shared/components/action-button';
import { formatLikeCount, type LikesSize } from './likes-style';

// size별 아이콘 px + 라벨 타이포(Figma 실측). gap은 두 사이즈 공통 4.
const SIZE: Record<LikesSize, { iconSize: number; labelVariant: TypographyVariant }> = {
  small: { iconSize: 12, labelVariant: 'body-sm' }, // 12/400
  large: { iconSize: 16, labelVariant: 'label-md' }, // 14/500
};

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
  const { iconSize, labelVariant } = SIZE[size];
  return (
    <ActionButton
      icon={liked ? faHeartSolid : faHeartLight}
      label={formatLikeCount(count)}
      onPress={onPress}
      color={liked ? 'secondary.secondary' : 'text.subtle'}
      iconSize={iconSize}
      labelVariant={labelVariant}
      gap={spacing[50]}
      style={style}
    />
  );
}
