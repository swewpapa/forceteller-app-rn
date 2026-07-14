import { useMemo, useRef, type ComponentType } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';
import { composeStyles } from './compose-styles';
import type { ResolversMap, TokenPropsOf } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

type WithStyleOptions<R extends ResolversMap> = {
  base?: AnyStyle;
  /**
   * Pressable 계열 base 전용. 설정 시 style이 함수형(`({pressed}) => ...`)으로 전달되므로,
   * 함수형 style을 호출하지 않는 base(Text/View 등)에 쓰면 스타일이 조용히 사라진다.
   * 타입 레벨 가드(별도 팩토리)는 로드맵.
   */
  pressedStyle?: ViewStyle;
  resolvers: R;
};

function depsEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/** deps shallow-compare memo. 소비 키는 팩토리 시점 고정이라 deps 길이 불변 — 렌더 간 비교 안전. */
function useStableValue<T>(compute: () => T, deps: readonly unknown[]): T {
  const ref = useRef<{ deps: readonly unknown[]; value: T } | null>(null);
  if (ref.current === null || !depsEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: compute() };
  }
  return ref.current.value;
}

/** 베이스 컴포넌트에 토큰 인지 스타일 prop 부여. TokenProps는 resolvers 맵에서 추론. */
export function withStyleProps<
  R extends ResolversMap,
  BaseProps extends { style?: StyleProp<any> },
>(Component: ComponentType<BaseProps>, { base, pressedStyle, resolvers }: WithStyleOptions<R>) {
  const orderedKeys = Object.keys(resolvers);
  const consumed = new Set(orderedKeys);

  function StyledComponent(
    props: TokenPropsOf<R> & Omit<BaseProps, 'style'> & { style?: StyleProp<AnyStyle> },
  ) {
    const theme = useTheme();
    const record = props as Record<string, unknown>;

    // 토큰 값 불변 + 같은 theme(모드)이면 composed identity 유지 → 스타일 재계산/재-diff 스킵.
    // 한계: 인라인 배열 shorthand(padding={['100', 14]})는 렌더마다 새 identity라 memo 미스(현행과 동일 비용).
    const composed = useStableValue(
      () => composeStyles(record, base, resolvers, theme),
      [theme, ...orderedKeys.map((key) => record[key])],
    );

    const forward: Record<string, unknown> = {};
    for (const key in props) {
      if (!consumed.has(key)) forward[key] = record[key];
    }
    const { style, ...rest } = forward as { style?: StyleProp<AnyStyle> } & Record<string, unknown>;

    const styleValue = useMemo(
      () =>
        pressedStyle
          ? ({ pressed }: { pressed: boolean }) => [composed, pressed && pressedStyle, style]
          : [composed, style],
      [composed, style],
    );

    return <Component {...(rest as BaseProps)} style={styleValue as StyleProp<AnyStyle>} />;
  }

  StyledComponent.displayName = `withStyleProps(${
    Component.displayName ?? Component.name ?? 'Component'
  })`;
  return StyledComponent;
}
