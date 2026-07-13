/** 가드 규칙. boolean 또는 라우트 params로 판단하는 predicate(Web 부분 보호 등). */
export type RouteGuardRule = {
  requiresAuth: boolean | ((params: object | undefined) => boolean);
};

/**
 * 보호 라우트 선언 한 곳(SSOT). 키 = 전역 AppRoutes.GuardableParamList(스택 + 탭 leaf).
 *
 * ⚠️ 현재 비활성({}): 보호 대상 페이지 목록이 제품 결정 전(Phase B). 메커니즘(predicate·401·
 * dismiss 정책)은 Phase A로 준비 완료 — 목록 확정 시 아래처럼 채워 활성화한다:
 *   Web: { requiresAuth: (p) => webPathRequiresAuth((p as { path?: string })?.path ?? '') },
 * (WebRouteParams를 import하지 않는 이유: features 간 직접 import 금지 — 구조적 타입으로 판단)
 */
export const ROUTE_GUARDS: Partial<
  Record<keyof AppRoutes.GuardableParamList, RouteGuardRule>
> = {};
