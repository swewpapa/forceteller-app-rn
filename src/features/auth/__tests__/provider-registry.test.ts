jest.mock('@/features/auth/providers/google-provider', () => ({
  googleProvider: { signIn: jest.fn(), signOut: jest.fn() },
}));

import { googleProvider } from '@/features/auth/providers/google-provider';
import { getAuthProvider } from '@/features/auth/providers/provider-registry';

describe('provider-registry', () => {
  it('등록된 id는 해당 provider 구현을 반환한다', () => {
    expect(getAuthProvider('google')).toBe(googleProvider);
  });

  it('미등록 id는 null — 저장소에서 복원된 임의 문자열을 안전하게 받는다', () => {
    expect(getAuthProvider('kakao')).toBeNull();
    expect(getAuthProvider('')).toBeNull();
  });
});
