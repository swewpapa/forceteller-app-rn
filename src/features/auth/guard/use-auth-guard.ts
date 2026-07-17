import { useEffect, useRef } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import { useAuthStore } from '../stores/auth-store';
import { navigateUnsafe } from '../navigation/navigate-unsafe';
import { ROUTE_GUARDS } from './route-guards';
import { shouldRedirectToLogin } from './evaluate-guard';
import { decideBackstopAction } from './backstop-policy';

/** Login이 로그인 없이 반복 dismiss될 때 이탈시킬 안전 라우트. */
const FALLBACK_ROUTE = 'Tabs';

/**
 * 딥링크/훅 밖 진입을 사후 감지해 미인증이면 Login 모달로 리다이렉트(백스톱).
 * RootNavigator에 1회 장착해 사용한다.
 *
 * - useAppNavigation(진입 전 가드)을 우회하는 경로를 잡는다. 사후 감지라 보호 화면이
 *   먼저 마운트되는 건 허용(데이터는 화면 쪽 enabled 게이트로 방어 — 스펙 참조).
 * - dismiss 감금 루프 차단: 같은 라우트 인스턴스가 미인증으로 재감지되면(Login이 로그인
 *   없이 닫힘) 재오픈 대신 FALLBACK_ROUTE로 이탈한다(decideBackstopAction).
 * - app 레이어를 import하지 않고 전역 AppRoutes.GuardableParamList를 참조한다.
 */
export function useAuthGuard(navRef: NavigationContainerRef<ReactNavigation.RootParamList>): void {
  const status = useAuthStore((s) => s.status);
  // Login을 띄운 원인 라우트의 인스턴스 key. effect 재구독(status 변화)에도 유지돼야 해서 ref.
  const pendingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = navRef.addListener('state', () => {
      const route = navRef.getCurrentRoute();
      if (!route || route.name === 'Login') return;

      const rule = ROUTE_GUARDS[route.name as keyof AppRoutes.GuardableParamList];
      const action = decideBackstopAction({
        redirect: shouldRedirectToLogin(rule, route.params, status),
        routeKey: route.key,
        pendingKey: pendingKeyRef.current,
      });

      if (action === 'login') {
        pendingKeyRef.current = route.key;
        navigateUnsafe(navRef, 'Login', {
          redirect: { screen: route.name, params: route.params },
        });
      } else if (action === 'fallback') {
        pendingKeyRef.current = null;
        navigateUnsafe(navRef, FALLBACK_ROUTE);
      } else {
        pendingKeyRef.current = null;
      }
    });

    return unsub;
  }, [status, navRef]);
}
