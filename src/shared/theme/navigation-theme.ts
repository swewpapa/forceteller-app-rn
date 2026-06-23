import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { darkColors, lightColors } from './colors';

/** React Navigation themes (header / tab bar / scene background) that match
 * our palette, so the chrome follows the same light/dark scheme as screens. */
export const navigationLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.primary,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.text,
    border: lightColors.border,
  },
};

export const navigationDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.text,
    border: darkColors.border,
  },
};
