import Config from 'react-native-config';

/**
 * Build-time environment, surfaced via react-native-config (.env files).
 * Native builds inject these values; fallbacks keep JS-only dev runnable.
 */
export const env = {
  apiBaseUrl: Config.API_BASE_URL ?? 'https://api.forceteller.com',
} as const;
