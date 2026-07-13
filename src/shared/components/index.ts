// shared/components 공개 배럴 — 카테고리 순서 고정(새 컴포넌트는 해당 그룹 끝에 추가).

// ── 화면 셸 ─────────────────────────────────
export { ScreenContainer } from './screen-container';
export { PlaceholderScreen } from './placeholder-screen';

// ── 레이아웃 ────────────────────────────────
export { Box, Row, Column, type BoxProps, type RowProps, type ColumnProps } from './layout';
export { AspectRatio, type AspectRatioProps } from './aspect-ratio/aspect-ratio';

// ── 타이포 ──────────────────────────────────
export { Typography, type TypographyProps } from './typography';

// ── 미디어 ──────────────────────────────────
export { Image, type ImageProps } from './image/image';
export { Carousel, type CarouselProps } from './carousel/carousel';

// ── 입력·폼 ─────────────────────────────────
export {
  Button,
  type ButtonProps,
  type ButtonAppearance,
  type ButtonColor,
  type ButtonShape,
  type ButtonSize,
} from './button';
export { TextField, type TextFieldProps } from './text-field';
export { Field, type FieldProps } from './field';
export { FormTextField, type FormTextFieldProps } from './form';
export { Checkbox, type CheckboxProps, type CheckboxSize } from './checkbox';

// ── 표시 ────────────────────────────────────
export { ListHeader, type ListHeaderProps } from './list-header';
export { ListItem, type ListItemProps } from './list-item';
export { Chip, type ChipProps } from './chip';
export { TagChip, type TagChipProps } from './tag-chip';
export {
  TagLabel,
  type TagLabelProps,
  type TagLabelVariant,
  type TagLabelVariantKey,
} from './tag-label';
export { LinkText, type LinkTextProps } from './link-text';
export { ActionButton, type ActionButtonProps } from './action-button';
export { Likes, type LikesProps, type LikesSize } from './likes';
export { PriceTag, type PriceTagProps } from './price-tag';
export { ForceIcon, type ForceGlyph } from './price-tag/force-icon';
