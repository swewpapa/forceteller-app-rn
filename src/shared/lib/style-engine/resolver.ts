import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';

/** 순수 스타일 리졸버. props=소비 prop 키(네이티브로 forward 금지 대상), resolve=순수함수(theme 받음). */
export type Resolver<P extends object> = {
  props: readonly (keyof P & string)[];
  resolve(values: Partial<P>, theme: ThemeContextValue): ViewStyle | TextStyle;
};
