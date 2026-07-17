import { Pressable } from 'react-native';
import { AspectRatio, Image } from '@/shared/components';
import type { PremiumItem } from '../types/premium-types';

export type PremiumCarouselCardProps = {
  item: PremiumItem;
  /** 카드 너비(px) — 서버 thumbnail.width. */
  width: number;
  /** 이미지 비율(w/h) — 서버 thumbnail.width / thumbnail.height. */
  ratio: number;
  onPress: () => void;
};

/**
 * carousel 카드: 세로 포스터 이미지 전용(제목 텍스트 없음 — Figma 997:7886 실측, 텍스트는 이미지에 구워짐).
 * 크기는 서버 thumbnail 치수로 결정하므로 Type6(72×112, Figma 997:10296)까지 같은 카드로 흡수된다.
 * theme thumbnail-card 선례(AspectRatio+Image) 계승 — 라벨/제목은 미노출.
 */
export function PremiumCarouselCard({ item, width, ratio, onPress }: PremiumCarouselCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ width }}>
      <AspectRatio ratio={ratio} radius="md">
        <Image source={item.thumbnailImage} accessibilityLabel={item.title} />
      </AspectRatio>
    </Pressable>
  );
}
