import { decideBackstopAction } from '../guard/backstop-policy';

describe('decideBackstopAction', () => {
  it('리다이렉트 불필요 → none', () => {
    expect(decideBackstopAction({ redirect: false, routeKey: 'web-1', pendingKey: null })).toBe('none');
    expect(decideBackstopAction({ redirect: false, routeKey: 'web-1', pendingKey: 'web-1' })).toBe('none');
  });

  it('첫 감지 → login', () => {
    expect(decideBackstopAction({ redirect: true, routeKey: 'web-1', pendingKey: null })).toBe('login');
  });

  it('같은 라우트 재감지(Login이 로그인 없이 닫힘) → fallback (감금 루프 차단)', () => {
    expect(decideBackstopAction({ redirect: true, routeKey: 'web-1', pendingKey: 'web-1' })).toBe('fallback');
  });

  it('다른 보호 라우트 감지 → login (pending은 인스턴스 key 기준)', () => {
    expect(decideBackstopAction({ redirect: true, routeKey: 'web-2', pendingKey: 'web-1' })).toBe('login');
  });
});
