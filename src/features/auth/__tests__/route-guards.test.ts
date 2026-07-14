import { ROUTE_GUARDS } from '@/features/auth/guard/route-guards';

describe('ROUTE_GUARDS.Web (path 프리픽스 배선)', () => {
  const rule = ROUTE_GUARDS.Web;
  const requires = (path: unknown): boolean => {
    if (!rule || typeof rule.requiresAuth !== 'function') throw new Error('Web predicate 미배선');
    return rule.requiresAuth(path as object | undefined);
  };

  it('계정 경로 → 보호', () => {
    expect(requires({ path: '/giftbox' })).toBe(true);
    expect(requires({ path: '/force/charge' })).toBe(true);
  });

  it('콘텐츠/미지정 경로 → 통과', () => {
    expect(requires({ path: '/dream' })).toBe(false);
    expect(requires({ path: '/item/4053' })).toBe(false);
  });

  it('path 없음 / undefined params → 통과(안전 기본값)', () => {
    expect(requires({})).toBe(false);
    expect(requires(undefined)).toBe(false);
  });
});
