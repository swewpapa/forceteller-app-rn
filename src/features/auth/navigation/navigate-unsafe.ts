/**
 * RN Navigation v7의 navigate 오버로드는 RouteName이 union일 때 rest-param 추론이
 * [never, never]로 수렴해 타입 안전 호출이 불가하다(라이브러리 타입 한계).
 * any-캐스트를 이 함수 한 곳에 격리한다 — 호출부(use-app-navigation/use-auth-guard/
 * login-screen)에 캐스트를 흩뿌리지 않는다.
 */
export function navigateUnsafe(nav: { navigate: unknown }, screen: string, params?: object): void {
  (nav as { navigate: (screen: string, params?: object) => void }).navigate(screen, params);
}
