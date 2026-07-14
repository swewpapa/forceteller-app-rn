import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';
import type { ResolversMap } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

/**
 * base → 바인딩 선언 순 병합(뒤가 앞을 덮음). 순수함수.
 * props[key]가 undefined면 그 변환은 호출하지 않는다 — "미지정 무방출" 계약을 중앙 강제.
 * 신선한 accumulator에 각 변환 출력을 복사한다 — 변환 반환 객체를 절대 변형하지 않음
 * (font가 공유 typography 토큰 참조를 반환하므로).
 */
export function composeStyles(
  props: Record<string, unknown>,
  base: AnyStyle | undefined,
  resolvers: ResolversMap,
  theme: ThemeContextValue,
): AnyStyle {
  const style: AnyStyle = { ...(base ?? {}) };
  for (const key of Object.keys(resolvers)) {
    const value = props[key];
    if (value !== undefined) Object.assign(style, resolvers[key](value, theme));
  }
  return style;
}
