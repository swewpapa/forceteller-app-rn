/**
 * 보호 라우트 선언 한 곳.
 * 전역 ReactNavigation.RootParamList를 참조해 app import를 피한다 (foundation feature 규칙).
 * navigation-types.ts의 전역 등록 선언이 이 타입을 채운다.
 */
export const ROUTE_GUARDS: Partial<
  Record<keyof ReactNavigation.RootParamList, { requiresAuth: boolean }>
> = {
  Web: { requiresAuth: true },
};
