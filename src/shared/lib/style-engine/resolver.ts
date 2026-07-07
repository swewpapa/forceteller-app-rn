import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';

/**
 * 순수 스타일 변환. prop 이름을 모른다 — 값과 theme만 받아 스타일 조각을 반환.
 * value는 항상 정의됨(composeStyles가 undefined인 prop은 호출하지 않음).
 */
export type Resolver<V> = (value: V, theme: ThemeContextValue) => ViewStyle | TextStyle;

/** prop 이름 → 변환 바인딩. 컴포넌트가 소유. */
export type ResolversMap = Record<string, Resolver<any>>;

/** 바인딩 맵에서 컴포넌트 토큰 prop 타입 유도. alias 키(p/padding)는 같은 V로 나온다. */
export type TokenPropsOf<R extends ResolversMap> = {
  [K in keyof R]?: R[K] extends Resolver<infer V> ? V : never;
};
