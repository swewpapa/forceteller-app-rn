import { Platform } from 'react-native';
import { fetchSplashConfig, pickImageUrl } from '@/app/splash/splash-api';

describe('pickImageUrl', () => {
  it('picks ios url on ios', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(pickImageUrl({ ios: 'a', android: 'b' })).toBe('a');
  });

  it('picks android url on android', () => {
    (Platform as { OS: string }).OS = 'android';
    expect(pickImageUrl({ ios: 'a', android: 'b' })).toBe('b');
  });

  it('returns null when platform key missing', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(pickImageUrl({ android: 'b' })).toBeNull();
  });
});

describe('fetchSplashConfig', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns parsed config on ok', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ios: 'a', android: 'b', id: '1' }),
    }) as unknown as typeof fetch;
    expect(await fetchSplashConfig('https://x')).toEqual({ ios: 'a', android: 'b', id: '1' });
  });

  it('returns null on non-ok response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    expect(await fetchSplashConfig('https://x')).toBeNull();
  });

  it('returns null on network error', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('net')) as unknown as typeof fetch;
    expect(await fetchSplashConfig('https://x')).toBeNull();
  });
});
