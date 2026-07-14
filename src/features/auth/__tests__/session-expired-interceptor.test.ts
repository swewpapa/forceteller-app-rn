jest.mock('@/features/auth/stores/auth-store', () => ({
  useAuthStore: { getState: jest.fn() },
}));

import { ApiError } from '@/shared/lib/http';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { createSessionExpiredInterceptor } from '@/features/auth/api/session-expired-interceptor';

const expireSession = jest.fn();
(useAuthStore.getState as jest.Mock).mockReturnValue({ expireSession });

describe('createSessionExpiredInterceptor', () => {
  const onRejected = createSessionExpiredInterceptor();
  beforeEach(() => expireSession.mockClear());

  it('HTTP 401 → expireSession 호출 + 에러 rethrow(복구 안 함)', () => {
    const err = new ApiError('http', 401, null);
    expect(() => onRejected(err)).toThrow(err);
    expect(expireSession).toHaveBeenCalledTimes(1);
  });

  it('HTTP 401 아닌 에러(500/network/일반 Error) → 미개입 rethrow', () => {
    const cases: unknown[] = [
      new ApiError('http', 500, null),
      new ApiError('network', null, null),
      new ApiError('timeout', null, null),
      new Error('boom'),
    ];
    for (const err of cases) {
      expect(() => onRejected(err)).toThrow();
      expect(expireSession).not.toHaveBeenCalled();
    }
  });
});
