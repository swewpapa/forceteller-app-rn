export type BackstopAction = 'none' | 'login' | 'fallback';

/**
 * 백스톱(useAuthGuard) 행동 결정(순수).
 *
 * pendingKey = 직전에 Login을 띄운 원인 라우트의 인스턴스 key. 같은 key가 미인증 상태로
 * 다시 감지되면 Login이 로그인 없이 닫혀 돌아온 것 → Login 재오픈 대신 안전 라우트로
 * 이탈시켜 "모달 무한 재오픈" 감금 루프를 차단한다.
 * (사전 가드 경로의 dismiss는 보호 화면에 진입한 적이 없어 이 정책이 필요 없다.)
 */
export function decideBackstopAction(input: {
  /** 평가기(shouldRedirectToLogin) 결과. */
  redirect: boolean;
  /** getCurrentRoute().key — 라우트 인스턴스 고유. */
  routeKey: string;
  pendingKey: string | null;
}): BackstopAction {
  if (!input.redirect) return 'none';
  return input.pendingKey === input.routeKey ? 'fallback' : 'login';
}
