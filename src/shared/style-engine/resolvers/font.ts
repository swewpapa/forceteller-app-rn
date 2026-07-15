import type { TextStyle } from 'react-native';
import type { TypographyVariant } from '@/shared/theme';
import type { Resolver } from '@/shared/style-engine/resolver';

/** 타입스케일 variant → 스타일 묶음. 공유 토큰 참조 반환(composeStyles가 복사하므로 안전). */
export const font: Resolver<TypographyVariant> = (value, theme): TextStyle =>
  theme.typography[value];
