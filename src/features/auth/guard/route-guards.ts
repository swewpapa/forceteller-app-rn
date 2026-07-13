import { webPathRequiresAuth } from './web-guard';

/** 가드 규칙. boolean 또는 라우트 params로 판단하는 predicate(Web 부분 보호 등). */
export type RouteGuardRule = {
  requiresAuth: boolean | ((params: object | undefined) => boolean);
};

/**
 * 보호 라우트 선언 한 곳(SSOT). 키 = 전역 AppRoutes.GuardableParamList(스택 + 탭 leaf).
 *
 * Web은 단일 WebView 호스트라 라우트 이름이 아니라 path 프리픽스로 부분 보호한다
 * (GUARDED_WEB_PATH_PREFIXES = 계정 전용 페이지). WebRouteParams를 import하지 않는 이유:
 * features 간 직접 import 금지 — params를 구조적 타입으로 판단.
 * 다른 라우트가 필요해지면 여기에 { requiresAuth: true }로 추가한다.
 */
export const ROUTE_GUARDS: Partial<
  Record<keyof AppRoutes.GuardableParamList, RouteGuardRule>
> = {
  Web: {
    requiresAuth: (params) => webPathRequiresAuth((params as { path?: string })?.path ?? ''),
  },
};
