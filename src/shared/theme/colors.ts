/**
 * Placeholder light/dark palettes. Production tokens are owned by
 * forceteller-storybook and will be wired in during the port phase.
 *
 * Tab bar tokens come from the design system (Figma Component Library):
 * light = exact design values; dark = derived until dark tokens are provided.
 */
export type AppColors = {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textMuted: string;
  border: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
};

export const lightColors: AppColors = {
  background: '#FFFFFF',
  surface: '#F4F2FA',
  primary: '#7C5CFF',
  text: '#1A1530',
  textMuted: '#6B6486',
  border: '#E5E1F0',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E8E8E8',
  tabBarActive: '#191919',
  tabBarInactive: '#ADADAD',
};

export const darkColors: AppColors = {
  background: '#0E0B1F',
  surface: '#1A1530',
  primary: '#9B86FF',
  text: '#FFFFFF',
  textMuted: '#A89FC9',
  border: '#2A2444',
  tabBarBackground: '#14101F',
  tabBarBorder: '#2A2444',
  tabBarActive: '#FFFFFF',
  tabBarInactive: '#8B82A8',
};
