import type { ViewStyle } from 'react-native';
import type { Resolver } from '../resolver';

/** flex 정렬 통과(토큰 아님). justify=주축 분배, align=교차축 정렬. */
export type FlowProps = {
  justify?: ViewStyle['justifyContent'];
  align?: ViewStyle['alignItems'];
};

export const flow: Resolver<FlowProps> = {
  props: ['justify', 'align'],
  resolve(values, _theme): ViewStyle {
    const out: ViewStyle = {};
    if (values.justify !== undefined) out.justifyContent = values.justify;
    if (values.align !== undefined) out.alignItems = values.align;
    return out;
  },
};
