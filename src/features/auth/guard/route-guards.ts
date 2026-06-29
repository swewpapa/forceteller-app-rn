/**
 * 보호 라우트 선언 한 곳. 전역 ReactNavigation.RootParamList 참조(foundation feature, app import 회피).
 *
 * ⚠️ 현재 비활성({}): Firebase 네이티브 설정·국가별 config·빌드 검증 전이라 로그인이 실동작하지
 * 않는다. 지금 활성화하면 게스트가 보호 페이지에서 막히므로, 환경/국가 인프라 + 네이티브 설정
 * 완료 후 아래처럼 채워 활성화한다:
 *   Web: { requiresAuth: true },
 */
export const ROUTE_GUARDS: Partial<
  Record<keyof ReactNavigation.RootParamList, { requiresAuth: boolean }>
> = {};
