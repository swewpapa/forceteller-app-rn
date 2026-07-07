import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeContextValue } from '@/shared/theme';
import type { Resolver } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

/** 리졸버들이 소비하는 prop 키 집합(팩토리가 forward 필터링에 사용). */
export function collectResolverProps(resolvers: Resolver<any>[]): Set<string> {
  const set = new Set<string>();
  for (const r of resolvers) for (const p of r.props) set.add(p);
  return set;
}

/**
 * base → 각 리졸버 순으로 병합(뒤가 앞을 덮음). 순수함수.
 * 신선한 accumulator에 각 리졸버 출력을 복사한다 — 리졸버 반환 객체를 절대 변형하지 않음
 * (font 리졸버는 공유 typography 토큰 참조를 반환하므로).
 * style 탈출구/pressed는 팩토리가 별도 처리.
 */
export function composeStyles(
  props: Record<string, unknown>,
  base: AnyStyle | undefined,
  resolvers: Resolver<any>[],
  theme: ThemeContextValue,
): AnyStyle {
  const style: AnyStyle = { ...(base ?? {}) };
  for (const r of resolvers) {
    const values: Record<string, unknown> = {};
    for (const p of r.props) values[p] = props[p];
    Object.assign(style, r.resolve(values, theme));
  }
  return style;
}
