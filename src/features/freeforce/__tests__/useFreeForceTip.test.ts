jest.mock('@/shared/config', () => ({ remoteConfig: { getJSON: jest.fn() } }));
jest.mock('@/features/auth', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/shared/components/popover/popover-dismiss', () => ({
  usePopoverDismissed: jest.fn(),
}));

import { remoteConfig } from '@/shared/config';
import { useAuthStore } from '@/features/auth';
import { usePopoverDismissed } from '@/shared/components/popover/popover-dismiss';
import { useFreeForceTip } from '@/features/freeforce';

type Status = 'loading' | 'guest' | 'authenticated';

const mockGetJSON = remoteConfig.getJSON as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUsePopoverDismissed = usePopoverDismissed as unknown as jest.Mock;

// @testing-library/react-native 미설치 — 훅 내부가 순수 조합(모킹된 의존)이라 일반 함수로 직접 호출한다.
function setup(params: { status: Status; appBarButtonType?: string; dismissed: boolean }) {
  const { status, appBarButtonType, dismissed } = params;
  mockUseAuthStore.mockImplementation((sel: (s: { status: Status }) => unknown) => sel({ status }));
  mockGetJSON.mockReturnValue({ appBarButtonType });
  mockUsePopoverDismissed.mockReturnValue(dismissed);
}

describe('useFreeForceTip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lottie + authenticated + !dismissed → true', () => {
    setup({ status: 'authenticated', appBarButtonType: 'lottie', dismissed: false });
    expect(useFreeForceTip()).toBe(true);
  });

  it('config non-lottie → false', () => {
    setup({ status: 'authenticated', appBarButtonType: 'default', dismissed: false });
    expect(useFreeForceTip()).toBe(false);
  });

  it('status guest → false', () => {
    setup({ status: 'guest', appBarButtonType: 'lottie', dismissed: false });
    expect(useFreeForceTip()).toBe(false);
  });

  it('dismissed → false', () => {
    setup({ status: 'authenticated', appBarButtonType: 'lottie', dismissed: true });
    expect(useFreeForceTip()).toBe(false);
  });
});
