import { shouldRedirectToLogin } from '../guard/evaluate-guard';

describe('shouldRedirectToLogin', () => {
  it('규칙 없음 → false', () => {
    expect(shouldRedirectToLogin(undefined, undefined, 'guest')).toBe(false);
  });

  it('authenticated → 항상 false', () => {
    expect(shouldRedirectToLogin({ requiresAuth: true }, undefined, 'authenticated')).toBe(false);
  });

  it('loading(부팅) → 판정 보류 false (백스톱이 다음 이벤트에 재검사)', () => {
    expect(shouldRedirectToLogin({ requiresAuth: true }, undefined, 'loading')).toBe(false);
  });

  it('guest + requiresAuth=true → true, false → false', () => {
    expect(shouldRedirectToLogin({ requiresAuth: true }, undefined, 'guest')).toBe(true);
    expect(shouldRedirectToLogin({ requiresAuth: false }, undefined, 'guest')).toBe(false);
  });

  it('guest + predicate → params로 평가', () => {
    const rule = { requiresAuth: (p: object | undefined) => (p as { path?: string })?.path === '/my' };
    expect(shouldRedirectToLogin(rule, { path: '/my' }, 'guest')).toBe(true);
    expect(shouldRedirectToLogin(rule, { path: '/fortune' }, 'guest')).toBe(false);
    expect(shouldRedirectToLogin(rule, undefined, 'guest')).toBe(false);
  });
});
