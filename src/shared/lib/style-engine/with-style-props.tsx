import type { ComponentType } from 'react';
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

/** 베이스 컴포넌트에 토큰 인지 스타일 prop 부여. TokenProps는 resolvers 맵에서 추론. */
export function withStyleProps<
  R extends ResolversMap,
  BaseProps extends { style?: StyleProp<any> },
>(Component: ComponentType<BaseProps>, { base, pressedStyle, resolvers }: WithStyleOptions<R>) {
  const consumed = new Set(Object.keys(resolvers));

  function StyledComponent(
    props: TokenPropsOf<R> & Omit<BaseProps, 'style'> & { style?: StyleProp<AnyStyle> },
  ) {
    const theme = useTheme();
    const composed = composeStyles(props as Record<string, unknown>, base, resolvers, theme);

    const forward: Record<string, unknown> = {};
    for (const key in props) {
      if (!consumed.has(key)) forward[key] = (props as Record<string, unknown>)[key];
    }
    const { style, ...rest } = forward as { style?: StyleProp<AnyStyle> } & Record<string, unknown>;

    const styleValue = pressedStyle
      ? ({ pressed }: { pressed: boolean }) => [composed, pressed && pressedStyle, style]
      : [composed, style];

    return <Component {...(rest as BaseProps)} style={styleValue as StyleProp<AnyStyle>} />;
  }

  StyledComponent.displayName = `withStyleProps(${Component.displayName ?? Component.name ?? 'Component'})`;
  return StyledComponent;
}
