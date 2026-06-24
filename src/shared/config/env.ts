import Config from 'react-native-config';

/**
 * Build-time environment, surfaced via react-native-config (.env files).
 * Native builds inject these values; fallbacks keep JS-only dev runnable.
 */
export const env = {
  apiBaseUrl: Config.API_BASE_URL ?? 'https://api.forceteller.com',
  splashConfigUrl:
    Config.SPLASH_CONFIG_URL ??
    'https://static.forceteller.com/images/splash/splash.json',
  // SPA 베이스 URL — 상세/하위 페이지를 WebView로 띄울 때 사용. 배포 URL로 교체하세요.
  webBaseUrl: Config.WEB_BASE_URL ?? 'https://forceteller.com',
  // MMKV 암호화 키(토큰 저장용). .env로 주입하고, 없으면 dev fallback.
  mmkvEncryptionKey: Config.MMKV_ENCRYPTION_KEY ?? 'forceteller-dev-key',
} as const;
