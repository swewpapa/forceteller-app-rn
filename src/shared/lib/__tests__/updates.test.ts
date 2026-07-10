import * as Updates from 'expo-updates';
import { checkAndApplyUpdate } from '../updates';

// 루트 __mocks__/expo-updates.js가 자동 적용되지만, 의도를 명시하고 타입 안전하게 접근한다.
jest.mock('expo-updates');

const check = Updates.checkForUpdateAsync as jest.Mock;
const fetchUpdate = Updates.fetchUpdateAsync as jest.Mock;
const reload = Updates.reloadAsync as jest.Mock;

describe('checkAndApplyUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reload.mockResolvedValue(undefined);
    fetchUpdate.mockResolvedValue({ isNew: true });
  });

  it('업데이트가 있으면 fetch 후 reload하고 applied를 반환한다', async () => {
    check.mockResolvedValue({ isAvailable: true, isRollBackToEmbedded: false });

    const result = await checkAndApplyUpdate();

    expect(fetchUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(result).toBe('applied');
  });

  it('업데이트가 없으면 fetch/reload 없이 none을 반환한다', async () => {
    check.mockResolvedValue({ isAvailable: false, isRollBackToEmbedded: false });

    const result = await checkAndApplyUpdate();

    expect(fetchUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(result).toBe('none');
  });

  it('rollBackToEmbedded directive면 fetch 후 reload하고 rolled-back을 반환한다', async () => {
    check.mockResolvedValue({ isAvailable: false, isRollBackToEmbedded: true });

    const result = await checkAndApplyUpdate();

    expect(fetchUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(result).toBe('rolled-back');
  });

  it('확인/다운로드가 실패하면 조용히 error를 반환한다(앱 시작 비차단)', async () => {
    check.mockRejectedValue(new Error('network down'));

    const result = await checkAndApplyUpdate();

    expect(reload).not.toHaveBeenCalled();
    expect(result).toBe('error');
  });
});
