export type LikesSize = 'small' | 'large';

/** 천단위 콤마(9999 → "9,999"). 좋아요 카운트는 음이 아닌 정수라 음수는 0으로 클램프. */
export function formatLikeCount(count: number): string {
  return String(Math.max(0, Math.trunc(count))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
