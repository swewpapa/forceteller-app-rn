import { spacing, type TypographyVariant } from '@/shared/theme';
import type { ColorPath } from '@/shared/lib/style-engine';

export type LikesSize = 'small' | 'large';

export type LikesVisual = {
  iconSize: number;
  labelVariant: TypographyVariant;
  gap: number;
  color: ColorPath;
};

const SIZE: Record<LikesSize, { iconSize: number; labelVariant: TypographyVariant }> = {
  small: { iconSize: 12, labelVariant: 'body-sm' }, // 12/400 (Figma 실측)
  large: { iconSize: 16, labelVariant: 'label-md' }, // 14/500
};

/** ActionButton에 넘길 시각 설정. liked → secondary 강조, 아니면 text.subtle. gap은 항상 4. */
export function buildLikesVisual(size: LikesSize, liked: boolean): LikesVisual {
  return {
    ...SIZE[size],
    gap: spacing[50], // 4
    color: liked ? 'secondary.secondary' : 'text.subtle',
  };
}

/** 천단위 콤마(9999 → "9,999"). 좋아요 카운트는 음이 아닌 정수라 음수는 0으로 클램프. */
export function formatLikeCount(count: number): string {
  return String(Math.max(0, Math.trunc(count))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
