import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { radius, spacing, useAppColors } from '@/shared/theme';
import { BubbleTail, ForceIcon } from './force-icon';

export type PriceTagType = 'price' | 'asset' | 'bonus';
export type PriceTagSize = '12' | '14' | '14v';

export type PriceTagProps = Omit<ViewProps, 'style' | 'children'> & {
  /** 최종가. number로 받아 내부에서 천단위 콤마 포맷(호출부 포맷 중복 제거). */
  price: number;
  /** 포스(가격) | 포스(자산) | 보너스포스. */
  type?: PriceTagType;
  /** 12·14 가로형 | 14v 세로형(원가 위 / 최종가 아래). */
  size?: PriceTagSize;
  /** 원가(취소선) 표기 토글. type='price'에서만 유효. */
  discount?: boolean;
  /** 원가(취소선으로 표기될 값). discount=true + 값이 있을 때만 렌더. */
  discounted?: number;
  /** 할인율 표기 문자열(예: '50%'). inlineTag/bubble에 사용. */
  percentage?: string;
  /** 어두운 표면 위 배치(on-dark). 글자=흰색, 포스(가격) 마크=밝은 골드로 고정. */
  inversed?: boolean;
  /** 최종가 옆 인라인 % 태그. type='price' 가로형(12·14)에서만. */
  inlineTag?: boolean;
  /** 최종가 위로 뜨는 % 말풍선(꼬리 포함). type='price' 가로형(12·14)에서만. */
  bubble?: boolean;
  /** 레이아웃 전용 탈출구(margin/position 등). 병합 마지막이라 여기 값이 우선. */
  style?: StyleProp<ViewStyle>;
};

const FONT_FAMILY = 'Noto Sans KR';
const WHITE = '#ffffff';
// inversed 포스(가격) 골드 — on-dark(어두운 배경 + 흰 글자) 고정값. text.force는 day=#c38800(어두운 골드)라
// 어두운 배경에 묻히므로, inversed엔 토큰 대신 밝은 골드 #db9f15를 고정한다(비-inversed는 text.force 토큰 사용).
// (text.forceInversed 토큰은 day #db9f15지만 night에 #c38800으로 스왑되어 '항상 on-dark' 용도엔 부적합.)
const GOLD_INVERSED = '#db9f15';
const BUBBLE_RADIUS = 4; // Figma radius/sm — radius 토큰에 sm(4)이 없어 원시 px.

/** 천 단위 콤마(Hermes Intl 비의존 결정적 포맷). */
function formatThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 인라인 태그/버블의 % 텍스트 스타일(Bold, 흰색). 스케일 밖 값이라 raw TextStyle. */
function saleTagTextStyle(is12: boolean, letterSpacing: number): TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontWeight: 700,
    fontSize: is12 ? 10 : 12,
    lineHeight: is12 ? 12 : 16,
    color: WHITE,
    letterSpacing,
  };
}

/**
 * 디자인 시스템 PriceTag(Figma 391:771 전체 variant).
 * 포스(가격)은 discount/inlineTag/bubble을 지원, 포스(자산)·보너스포스는 마크+최종가만.
 * 색·치수는 theme 토큰 우선(비-inversed 골드=text.force), 토큰에 없는 값만 원시 px/hex.
 */
export function PriceTag({
  price,
  type = 'price',
  size = '12',
  discount = false,
  discounted,
  percentage,
  inversed = false,
  inlineTag = false,
  bubble = false,
  style,
  ...rest
}: PriceTagProps) {
  const colors = useAppColors();

  const isPrice = type === 'price';
  const is12 = size === '12';
  const isVertical = size === '14v';
  const iconSize = is12 ? 12 : 14;

  // 비-inversed는 테마를 따르는 토큰, inversed는 on-dark 고정값.
  const contentColor = inversed ? WHITE : colors.text.default;
  const iconColor = isPrice ? (inversed ? GOLD_INVERSED : colors.text.force) : contentColor;
  const alertColor = colors.background.alert;

  const priceTextStyle: TextStyle = {
    fontFamily: FONT_FAMILY,
    fontWeight: isPrice ? 700 : 500, // 포스(가격)=Bold, 포스(자산)·보너스=Medium
    fontSize: is12 ? 12 : 14,
    lineHeight: is12 ? 12 : 14,
    color: contentColor,
  };
  const discountedTextStyle: TextStyle = {
    fontFamily: FONT_FAMILY,
    fontWeight: 400,
    fontSize: is12 ? 10 : 12,
    lineHeight: is12 ? 10 : 12,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  };

  const showDiscount = discount && discounted != null;
  const showInlineTag = isPrice && !isVertical && inlineTag && !!percentage;
  const showBubble = isPrice && !isVertical && bubble && !!percentage;

  const icon = <ForceIcon glyph={type} size={iconSize} color={iconColor} />;
  const priceText = <Text style={priceTextStyle}>{formatThousands(price)}</Text>;
  const discountedText = showDiscount ? (
    <Text style={discountedTextStyle}>{formatThousands(discounted)}</Text>
  ) : null;

  // 14v: 세로 스택([원가] 위 / 최종가 아래). 아이콘은 하단(items-end) 정렬.
  if (isPrice && isVertical) {
    return (
      <View style={[styles.verticalContainer, style]} {...rest}>
        {icon}
        <View style={styles.verticalStack}>
          {discountedText}
          <View style={styles.priceWrap}>{priceText}</View>
        </View>
      </View>
    );
  }

  // 포스(자산)·보너스포스: 마크 + 최종가(Medium)만.
  if (!isPrice) {
    return (
      <View style={[styles.rowContainer, style]} {...rest}>
        {icon}
        {priceText}
      </View>
    );
  }

  // 포스(가격) 12·14: 마크 [원가] 최종가(+버블) [인라인 태그]
  return (
    <View style={[styles.rowContainer, style]} {...rest}>
      {icon}
      {discountedText}
      <View style={styles.priceWrap}>
        {priceText}
        {showBubble ? (
          <View style={styles.bubbleAnchor} pointerEvents="none">
            <View style={[styles.bubblePill, { backgroundColor: alertColor }]}>
              <Text style={saleTagTextStyle(is12, 0)}>{percentage}</Text>
            </View>
            <View style={styles.tailRotate}>
              <BubbleTail color={alertColor} />
            </View>
          </View>
        ) : null}
      </View>
      {showInlineTag ? (
        <View style={[styles.inlineTag, { backgroundColor: alertColor }]}>
          <Text style={saleTagTextStyle(is12, is12 ? -0.2 : 0)}>{percentage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[50], // 4
    height: 16,
  },
  verticalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[50], // 4
  },
  verticalStack: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  priceWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineTag: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderRadius: radius.xs, // 2
  },
  // 최종가 위로 뜨는 말풍선. left/right 0 + alignItems center로 최종가 중앙 정렬, bottom 100%로 위에 배치.
  bubbleAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    alignItems: 'center',
  },
  bubblePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[50], // 4
    paddingVertical: 2,
    borderRadius: BUBBLE_RADIUS,
  },
  tailRotate: {
    transform: [{ rotate: '180deg' }],
  },
});
