import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';

/**
 * 순수 스타일 리졸버. props=소비 prop 키(네이티브로 forward 금지 대상), resolve=순수함수(theme 받음).
 * resolve의 `values`는 이 리졸버의 선언된 props가 항상 전부 키로 존재하되 값은 undefined일 수 있다
 * (composeStyles가 `values[p] = props[p]`로 전 키를 채움). 각 resolve는 undefined를 견뎌야 한다(Partial<P>).
 */
export type Resolver<P extends object> = {
  props: readonly (keyof P & string)[];
  resolve(values: Partial<P>, theme: ThemeContextValue): ViewStyle | TextStyle;
};
