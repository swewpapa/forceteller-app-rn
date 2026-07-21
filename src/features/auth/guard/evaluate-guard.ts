import type { AuthStatus } from '../stores/auth-store';
import type { RouteGuardRule } from './route-guards';

/**
 * 가드 판정(순수). 사전 가드(useAppNavigation)와 백스톱(useAuthGuard)이 공유하는 단일 평가기.
 *
 * - 'authenticated' → 통과.
 * - 'loading'(부팅 restore 전) → 판정 보류(false) — 오탐 방지. restore(하이브리드)는
 *   토큰이 유효하면 동기로 끝나고, 만료 세션만 갱신 완료까지 loading에 머문다.
 *   보류 중 진입은 백스톱이 다음 state 이벤트에서 재검사한다.
 * - 'guest' → requiresAuth가 predicate면 params로 평가, boolean이면 그대로.
 */
export function shouldRedirectToLogin(
  rule: RouteGuardRule | undefined,
  params: object | undefined,
  status: AuthStatus,
): boolean {
  if (!rule || status !== 'guest') return false;
  return typeof rule.requiresAuth === 'function' ? rule.requiresAuth(params) : rule.requiresAuth;
}
