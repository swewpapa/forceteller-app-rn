import type { ComponentType } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';
import { collectResolverProps, composeStyles } from './compose-styles';
import type { Resolver } from './resolver';

type AnyStyle = ViewStyle | TextStyle;

type WithStyleOptions = {
  base?: AnyStyle;
  pressedStyle?: ViewStyle; // Pressable 계열 전용
  resolvers: Resolver<any>[];
};

/** 베이스 컴포넌트에 토큰 인지 스타일 prop 부여. TokenProps는 명시적 제네릭(리졸버와 일치시킴). */
export function withStyleProps<
  TokenProps extends object,
  BaseProps extends { style?: StyleProp<any> },
>(Component: ComponentType<BaseProps>, { base, pressedStyle, resolvers }: WithStyleOptions) {
  const consumed = collectResolverProps(resolvers);

  return function StyledComponent(
    props: TokenProps & Omit<BaseProps, 'style'> & { style?: StyleProp<AnyStyle> },
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
  };
}
