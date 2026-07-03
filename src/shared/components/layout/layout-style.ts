import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import {
  radius,
  spacing,
  type ModeColors,
  type RadiusKey,
  type SpacingKey,
} from '@/shared/theme';

/** 문자열 = spacing 토큰 키(예: '300' → 24px), 숫자 = 원시 px(의도적 이탈 — 호출부에서 가시적). */
export type SpaceValue = SpacingKey | number;

/**
 * CSS padding shorthand의 배열 번역.
 * 스칼라=전 방향, [Y, X], [top, X, bottom], [top, right, bottom, left](시계방향).
 */
export type PaddingValue =
  | SpaceValue
  | readonly [SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue]
  | readonly [SpaceValue, SpaceValue, SpaceValue, SpaceValue];

export type BackgroundKey = keyof ModeColors['background'];

/** Box·Row·Column 공통 props. */
export type SharedLayoutProps = Omit<ViewProps, 'style' | 'children'> & {
  padding?: PaddingValue;
  /** padding의 alias. 동시 지정 시 padding(풀네임)이 우선. */
  p?: PaddingValue;
  background?: BackgroundKey;
  radius?: RadiusKey;
  /**
   * 토큰 비관할 레이아웃 전용 탈출구(flex/width/position 등). 토큰 관할 속성
   * (padding/gap/radius/background)은 props로만 쓴다. 병합 순서상 항상 마지막.
   */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export type FlowProps = SharedLayoutProps & {
  gap?: SpaceValue;
  /** 주축 정렬(분배) → justifyContent */
  justify?: ViewStyle['justifyContent'];
  /** 교차축 정렬 → alignItems */
  align?: ViewStyle['alignItems'];
};

/** buildLayoutStyle이 소비하는 토큰 props 부분집합. */
export type LayoutTokenProps = {
  padding?: PaddingValue;
  p?: PaddingValue;
  background?: BackgroundKey;
  radius?: RadiusKey;
  gap?: SpaceValue;
};

function resolveSpace(value: SpaceValue): number {
  return typeof value === 'string' ? spacing[value] : value;
}

/** [top, right, bottom, left]로 정규화 — RN 내부 shorthand 해석에 의존하지 않는다. */
function resolvePadding(value: PaddingValue): [number, number, number, number] {
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

/** 토큰 props → ViewStyle. 미지정 prop은 키 자체를 방출하지 않는다. */
export function buildLayoutStyle(props: LayoutTokenProps, colors: ModeColors): ViewStyle {
  const out: ViewStyle = {};
  const paddingInput = props.padding ?? props.p;
  if (paddingInput !== undefined) {
    const [top, right, bottom, left] = resolvePadding(paddingInput);
    out.paddingTop = top;
    out.paddingRight = right;
    out.paddingBottom = bottom;
    out.paddingLeft = left;
  }
  if (props.gap !== undefined) {
    out.gap = resolveSpace(props.gap);
  }
  if (props.background !== undefined) {
    out.backgroundColor = colors.background[props.background];
  }
  if (props.radius !== undefined) {
    out.borderRadius = radius[props.radius];
  }
  return out;
}
