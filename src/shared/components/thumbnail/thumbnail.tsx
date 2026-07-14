import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AspectRatio } from '@/shared/components/aspect-ratio/aspect-ratio';
import { Image } from '@/shared/components/image/image';
import type { RadiusKey } from '@/shared/theme';

export type ThumbnailProps = {
  /** 이미지 uri. null이면 빈 상자(AspectRatio 배경). */
  source: string | null;
  /** 종횡비 w/h. 예: List 144/92, Full Image 240/126, Match Theme 2, Fatebook 92/128. */
  ratio: number;
  /** 모서리 라운드 토큰. 기본 'md'(Figma 대부분), Fatebook은 'xs'. */
  radius?: RadiusKey;
  /** 이미지 위 오버레이(배지 등). absolute로 겹치며, 위치·정렬은 오버레이 자신이 소유. */
  children?: ReactNode;
  accessibilityLabel?: string;
};

/**
 * 종횡비 고정 이미지 썸네일 — AspectRatio(ratio·radius·overflow clip) + Image(cover) 조합.
 * Figma 썸네일 5종(List/Full Image/Match Theme/Fatebook)을 ratio·radius·children로 표현한다.
 * Match/Locked 같은 오버레이(자물쇠 배지 등)는 도메인 화면이 children으로 주입한다.
 */
export function Thumbnail({
  source,
  ratio,
  radius = 'md',
  children,
  accessibilityLabel,
}: ThumbnailProps) {
  return (
    <AspectRatio ratio={ratio} radius={radius}>
      <Image source={source} accessibilityLabel={accessibilityLabel} />
      {children ? <View style={StyleSheet.absoluteFill}>{children}</View> : null}
    </AspectRatio>
  );
}
