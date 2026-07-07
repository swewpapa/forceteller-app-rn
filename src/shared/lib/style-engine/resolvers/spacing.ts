import type { ViewStyle } from 'react-native';
import { spacing as spacingScale, type SpacingKey } from '@/shared/theme';
import type { Resolver } from '../resolver';

/** 문자열 = spacing 토큰 키('300'→24px), 숫자 = 원시 px(의도적 이탈 — 호출부 가시). */
export type SpaceValue = SpacingKey | number;

/** CSS padding shorthand의 배열 번역: 스칼라=전방향, [Y,X], [top,X,bottom], [t,r,b,l](시계). */
export type PaddingValue =
  | SpaceValue
  | readonly [SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue, SpaceValue];

export type SpacingProps = {
  padding?: PaddingValue;
  /** padding alias. 동시 지정 시 padding 우선. */
  p?: PaddingValue;
  margin?: PaddingValue;
  /** margin alias. 동시 지정 시 margin 우선. */
  m?: PaddingValue;
};

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

/** padding/margin shorthand → 4변 명시. 미지정 prop은 키 미방출. */
export const spacing: Resolver<SpacingProps> = {
  props: ['padding', 'p', 'margin', 'm'],
  resolve(values, _theme): ViewStyle {
    const out: ViewStyle = {};
    const pad = values.padding ?? values.p;
    if (pad !== undefined) {
      const [t, r, b, l] = resolveEdges(pad);
      out.paddingTop = t;
      out.paddingRight = r;
      out.paddingBottom = b;
      out.paddingLeft = l;
    }
    const mar = values.margin ?? values.m;
    if (mar !== undefined) {
      const [t, r, b, l] = resolveEdges(mar);
      out.marginTop = t;
      out.marginRight = r;
      out.marginBottom = b;
      out.marginLeft = l;
    }
    return out;
  },
};
