import type { WebRouteParams } from '@/features/web';

/** Bottom-tab routes. Stack/param types per feature get added as they land. */
export type RootTabParamList = {
  Home: undefined;
  Today: undefined;
  Premium: undefined;
  More: undefined;
};

/**
 * Root stack: 네이티브 탭(Tabs) + WebView 상세 화면(Web).
 * 탭 메인은 RN, 거기서 진입하는 상세/하위 페이지는 단일 WebView(SPA)가 담당한다.
 * 'Web' params 계약은 화면을 소유한 features/web에서 가져온다(app→features).
 */
export type RootStackParamList = {
  Tabs: undefined;
  Web: WebRouteParams;
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
}
