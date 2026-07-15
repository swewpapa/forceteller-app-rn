import type { ViewStyle } from 'react-native';
import { spacing as spacingScale, type SpacingKey } from '@/shared/theme';
import type { Resolver } from '@/shared/style-engine/resolver';

/** 문자열 = spacing 토큰 키('300'→24px), 숫자 = 원시 px(의도적 이탈 — 호출부 가시). */
export type SpaceValue = SpacingKey | number;

/** CSS shorthand: 스칼라=전방향, [Y,X], [top,X,bottom], [t,r,b,l](시계). */
export type PaddingValue =
  | SpaceValue
  | readonly [SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue, SpaceValue];

function resolveSpace(value: SpaceValue): number {
  return typeof value === 'string' ? spacingScale[value] : value;
}

/** [top,right,bottom,left]로 정규화 — RN shorthand 해석에 의존 안 함. */
function resolveEdges(value: PaddingValue): [number, number, number, number] {
  if (typeof value === 'string' || typeof value === 'number') {
    const all = resolveSpace(value);
    return [all, all, all, all];
  }
  if (value.length === 2) {
    const [y, x] = value;
    return [resolveSpace(y), resolveSpace(x), resolveSpace(y), resolveSpace(x)];
  }
  if (value.length === 3) {
    const [top, x, bottom] = value;
    return [resolveSpace(top), resolveSpace(x), resolveSpace(bottom), resolveSpace(x)];
  }
  const [top, right, bottom, left] = value;
  return [resolveSpace(top), resolveSpace(right), resolveSpace(bottom), resolveSpace(left)];
}

/** shorthand → paddingTop/Right/Bottom/Left(4변 명시). */
export const padding: Resolver<PaddingValue> = (value): ViewStyle => {
  const [t, r, b, l] = resolveEdges(value);
  return { paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l };
};

/** shorthand → marginTop/Right/Bottom/Left(4변 명시). */
export const margin: Resolver<PaddingValue> = (value): ViewStyle => {
  const [t, r, b, l] = resolveEdges(value);
  return { marginTop: t, marginRight: r, marginBottom: b, marginLeft: l };
};
