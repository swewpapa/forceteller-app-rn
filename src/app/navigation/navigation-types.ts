import type { WebRouteParams } from '@/features/web';

/** Bottom-tab routes. Stack/param types per feature get added as they land. */
export type RootTabParamList = {
  Home: undefined;
  Today: undefined;
  Premium: undefined;
  More: undefined;
};

/**
 * Root stack: 네이티브 탭(Tabs) + WebView 상세 화면(Web) + 로그인 화면(Login).
 * 탭 메인은 RN, 거기서 진입하는 상세/하위 페이지는 단일 WebView(SPA)가 담당한다.
 * 'Web' params 계약은 화면을 소유한 features/web에서 가져온다(app→features).
 */
export type RootStackParamList = {
  Tabs: undefined;
  Web: WebRouteParams;
  Login: {
    redirect?: {
      screen: keyof RootStackParamList;
      params?: Record<string, unknown>;
    };
  };
  /** DS 갤러리 — dev 빌드에서만 등록되는 상설 컴포넌트 카탈로그(진입: More 탭 long-press). */
  DsGallery: undefined;
};

/**
 * 전역 라우트 타입 등록(React Navigation 공식 패턴).
 * 이 선언 덕분에 features 레이어가 app을 import하지 않고도
 * useNavigation()/navigate가 타입 안전해진다.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }

  namespace AppRoutes {
    /**
     * 가드 선언 가능한 전체 라우트 키 공간(스택 + 탭 leaf).
     * 백스톱의 getCurrentRoute()는 leaf 라우트('Home' 등)를 반환하므로
     * ROUTE_GUARDS 키가 스택만 알면 탭을 가드로 선언할 수 없다 — 여기서 합집합을 노출한다.
     * (ReactNavigation 네임스페이스는 라이브러리 소유라 커스텀 인터페이스는 별도 네임스페이스에.)
     */
    interface GuardableParamList extends RootStackParamList, RootTabParamList {}
  }
}
