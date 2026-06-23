import { revalidateSplash } from '../revalidate-splash';
import * as api from '../splash-api';

jest.mock('../splash-api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('revalidateSplash', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns new meta when id changed and prefetch succeeds', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u', id: 'new' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn().mockResolvedValue(true);

    const meta = await revalidateSplash({ configUrl: 'c', currentId: 'old', prefetch });

    expect(prefetch).toHaveBeenCalledWith('u');
    expect(meta).toEqual({ appliedUrl: 'u', appliedId: 'new' });
  });

  it('skips prefetch and returns null when id unchanged', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u', id: 'same' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn();

    const meta = await revalidateSplash({ configUrl: 'c', currentId: 'same', prefetch });

    expect(prefetch).not.toHaveBeenCalled();
    expect(meta).toBeNull();
  });

  it('returns null when prefetch fails', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u', id: 'new' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn().mockResolvedValue(false);

    expect(await revalidateSplash({ configUrl: 'c', currentId: null, prefetch })).toBeNull();
  });

  it('returns null when config fetch fails', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue(null);

    expect(
      await revalidateSplash({ configUrl: 'c', currentId: null, prefetch: jest.fn() }),
    ).toBeNull();
  });

  it('falls back to url as id when id is absent', async () => {
    mockedApi.fetchSplashConfig.mockResolvedValue({ ios: 'u', android: 'u' });
    mockedApi.pickImageUrl.mockReturnValue('u');
    const prefetch = jest.fn().mockResolvedValue(true);

    const meta = await revalidateSplash({ configUrl: 'c', currentId: null, prefetch });

    expect(meta).toEqual({ appliedUrl: 'u', appliedId: 'u' });
  });
});
