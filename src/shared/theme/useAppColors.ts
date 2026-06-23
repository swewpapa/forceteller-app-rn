import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type AppColors } from './colors';

/** Returns the active palette based on the OS color scheme. */
export function useAppColors(): AppColors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}
