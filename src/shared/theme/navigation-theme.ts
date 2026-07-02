import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { dayColors, nightColors } from './generated/colors';

/**
 * React Navigation 테마(헤더/씬 배경)를 시맨틱 컬러에 맞춘다.
 * 씬/헤더 배경은 화면 기본 배경 역할이라 background.surface(기존 white 시각 유지).
 */
export const navigationDayTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: dayColors.primary.primary,
    background: dayColors.background.surface,
    card: dayColors.background.surface,
    text: dayColors.text.default,
    border: dayColors.stroke.default,
  },
};

export const navigationNightTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: nightColors.primary.primary,
    background: nightColors.background.surface,
    card: nightColors.background.surface,
    text: nightColors.text.default,
    border: nightColors.stroke.default,
  },
};
