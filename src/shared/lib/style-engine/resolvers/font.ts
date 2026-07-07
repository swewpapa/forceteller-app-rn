import type { TextStyle } from 'react-native';
import type { TypographyVariant } from '@/shared/theme';
import type { Resolver } from '../resolver';

export type FontProps = { font?: TypographyVariant };

/** font=타입스케일 한 묶음(스케일 규율 유지). Text 슬롯 기본. */
export const font: Resolver<FontProps> = {
  props: ['font'],
  resolve(values, theme): TextStyle {
    return values.font ? theme.typography[values.font] : {};
  },
};
