import type { ColorPath } from '@/shared/style-engine';

/**
 * status 뱃지 색 페어. background/text 모두 ColorPath라 accent 등 임의 토큰 주입 가능.
 * (Button/TagChip의 닫힌 enum과 달리 tag-label은 status 색 공간이 열려 있어 확장형.)
 */
export type TagLabelVariant = { background: ColorPath; text: ColorPath };

/** 빌트인 프리셋(Figma Tag Label). 확장은 컴포넌트에 객체 주입으로. */
export const tagLabelVariants = {
  default: { background: 'background.inset', text: 'text.muted' },
  highlighted: { background: 'background.highlight', text: 'text.default' },
} satisfies Record<string, TagLabelVariant>;

export type TagLabelVariantKey = keyof typeof tagLabelVariants;

/** 키면 프리셋 조회, 객체면 그대로 통과(커스텀 주입). */
export function resolveTagLabelVariant(
  variant: TagLabelVariantKey | TagLabelVariant,
): TagLabelVariant {
  return typeof variant === 'string' ? tagLabelVariants[variant] : variant;
}
