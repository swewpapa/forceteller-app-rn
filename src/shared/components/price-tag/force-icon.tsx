import { Path, Svg } from 'react-native-svg';

/**
 * PriceTag 전용 SVG 마크. Figma Component Library(391:771)의 SVG 소스를 그대로 인라인.
 * (에셋이 임시 scratchpad에만 있어 파일 import 불가 → path 문자열을 소스에 고정.)
 *
 * 색은 소비처(PriceTag)가 토큰/inversed로 결정해 `color`로 주입한다 — 이 컴포넌트는 순수 표현.
 */

// 포스(가격)·포스(자산) 공용 "F" 글리프. 12·14는 viewBox가 달라 획 비율 유지를 위해 path를 분리한다.
const FORCE_PATH_12 =
  'M0 5.93333C0 2.6 2.73333 0 6.06667 0C9.4 0 12 2.73333 12 6.06667C11.9333 9.4 9.26667 12 5.93333 12C2.6 11.9333 0 9.26667 0 5.93333ZM5.46667 4.4H8.46667V3.2H4V9.2H5.46667V6.86667H8.2V5.66667H5.46667V4.4Z';
const FORCE_PATH_14 =
  'M0 6.92222C0 3.03333 3.18889 0 7.07778 0C10.9667 0 14 3.18889 14 7.07778C13.9222 10.9667 10.8111 14 6.92222 14C3.03333 13.9222 0 10.8111 0 6.92222ZM6.37778 5.13333H9.87778V3.73333H4.66667V10.7333H6.37778V8.01111H9.56667V6.61111H6.37778V5.13333Z';
// 보너스포스 "B" 글리프(Figma상 14 전용).
const BONUS_PATH_14 =
  'M7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C3.54352e-07 3.13401 3.13401 3.54341e-07 7 0ZM4.29297 3.42188V10.4219H8.38672C9.76125 10.4217 10.4434 9.54035 10.4434 8.52246C10.4433 7.641 9.85542 6.92793 9.11035 6.8125C9.77152 6.66557 10.3066 6.07712 10.3066 5.20605C10.3065 4.32466 9.64565 3.42204 8.26074 3.42188H4.29297ZM7.91406 7.62012C8.35481 7.62013 8.60642 7.92445 8.60645 8.28125C8.60645 8.65905 8.34433 8.92187 7.91406 8.92188H6.09863V7.62012H7.91406ZM7.85059 4.92285C8.2179 4.92285 8.4707 5.17516 8.4707 5.52148C8.47055 5.86766 8.21779 6.12988 7.85059 6.12988H6.09863V4.92285H7.85059Z';
// 버블 꼬리 삼각형(viewBox 12x8). Figma는 rotate-180로 아래를 향함 → 회전은 소비처에서 래핑.
const TAIL_PATH = 'M12 0L9.7181 8H0L12 0Z';

export type ForceGlyph = 'price' | 'asset' | 'bonus';

export type ForceIconProps = {
  /** price·asset → "F", bonus → "B". */
  glyph: ForceGlyph;
  /** 12 | 14 (px). price는 12·14, asset·bonus는 14. */
  size: number;
  /** 이미 해석된 색(hex). PriceTag가 토큰/inversed로 결정. */
  color: string;
};

/** 포스/보너스 마크. fill-rule은 Figma 소스 유지(F=evenodd, B=nonzero 기본). */
export function ForceIcon({ glyph, size, color }: ForceIconProps) {
  if (glyph === 'bonus') {
    return (
      <Svg width={size} height={size} viewBox="0 0 14 14">
        <Path d={BONUS_PATH_14} fill={color} />
      </Svg>
    );
  }
  const is12 = size <= 12;
  return (
    <Svg width={size} height={size} viewBox={is12 ? '0 0 12 12' : '0 0 14 14'}>
      <Path
        d={is12 ? FORCE_PATH_12 : FORCE_PATH_14}
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  );
}

export type BubbleTailProps = { color: string };

/** 버블 꼬리(12x8). 위를 향한 삼각형 — PriceTag에서 rotate-180로 아래를 향하게 배치. */
export function BubbleTail({ color }: BubbleTailProps) {
  return (
    <Svg width={12} height={8} viewBox="0 0 12 8">
      <Path d={TAIL_PATH} fill={color} />
    </Svg>
  );
}
