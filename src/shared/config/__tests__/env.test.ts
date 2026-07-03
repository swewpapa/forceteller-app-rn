/**
 * env.ts 매핑 회귀 테스트.
 *
 * react-native-config는 빌드 시 .env에서 값을 주입하므로 테스트에선 mock한다.
 * 전역 __mocks__/react-native-config.js는 `default: {}`(빈 객체)라 fallback 경로를
 * 검증하고, 값 주입 경로는 jest.doMock으로 override한다.
 * env.ts가 모듈 로드 시점에 Config를 읽어 상수로 고정하므로,
 * resetModules + doMock + require로 재로딩한다.
 */
describe('env', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('react-native-config 값을 그대로 매핑한다', () => {
    jest.doMock('react-native-config', () => ({
      __esModule: true,
      default: {
        API_BASE_URL: 'https://dev.api.example.com',
        WEB_BASE_URL: 'https://dev.web.example.com',
        SPLASH_CONFIG_URL: 'https://dev.cdn/splash.json',
        GOOGLE_WEB_CLIENT_ID: 'dev-client-id',
        MMKV_ENCRYPTION_KEY: 'dev-key',
      },
    }));
    const { env } = require('../env');
    expect(env.apiBaseUrl).toBe('https://dev.api.example.com');
    expect(env.webBaseUrl).toBe('https://dev.web.example.com');
    expect(env.splashConfigUrl).toBe('https://dev.cdn/splash.json');
    expect(env.googleWebClientId).toBe('dev-client-id');
    expect(env.mmkvEncryptionKey).toBe('dev-key');
  });

  it('값이 없으면 fallback을 쓴다', () => {
    jest.doMock('react-native-config', () => ({ __esModule: true, default: {} }));
    const { env } = require('../env');
    expect(env.apiBaseUrl).toBe('https://api.forceteller.com');
    expect(env.webBaseUrl).toBe('https://forceteller.com');
    expect(env.splashConfigUrl).toBe(
      'https://static.forceteller.com/images/splash/splash.json',
    );
    expect(env.googleWebClientId).toBe('');
    expect(env.mmkvEncryptionKey).toBe('forceteller-dev-key');
  });
});
