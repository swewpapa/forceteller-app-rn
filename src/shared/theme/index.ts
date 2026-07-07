import { spacing } from './generated/spacing';
import { radius } from './generated/radius';

export { ThemeProvider } from './theme-provider';
export type { ThemeContextValue } from './theme-provider';
export { useTheme, useAppColors } from './use-theme';
export type { ModeColors } from './generated/mode-colors';
export type { ThemeMode, ResolvedTheme } from './resolve-theme';
export { navigationDayTheme, navigationNightTheme } from './navigation-theme';
export { spacing, radius };
export { typographyStyles, type TypographyVariant } from './generated/typography';

/** spacing 토큰 키의 문자열 리터럴 유니언('50' | '100' | … | '1000'). 숫자 키를 템플릿 리터럴로 문자열화. */
export type SpacingKey = `${keyof typeof spacing}`;
export type RadiusKey = keyof typeof radius;
