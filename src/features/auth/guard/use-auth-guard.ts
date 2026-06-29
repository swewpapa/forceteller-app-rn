import { useEffect } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import { useAuthStore } from '../stores/auth-store';
import { ROUTE_GUARDS } from './route-guards';

/**
 * 딥링크/훅 밖 진입을 사후 감지해 미인증이면 Login 모달로 리다이렉트.
 * RootNavigator에 1회 장착해 사용한다.
 *
 * - useAppNavigation(진입 전 가드)을 우회하는 딥링크 등을 백스톱으로 잡는다.
 * - app 레이어를 import하지 않고 전역 ReactNavigation.RootParamList를 참조한다.
 */
export function useAuthGuard(
  navRef: NavigationContainerRef<ReactNavigation.RootParamList>,
): void {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    const unsub = navRef.addListener('state', () => {
      const route = navRef.getCurrentRoute();
      if (!route) return;

      const routeName = route.name as keyof ReactNavigation.RootParamList;
      if (
        status !== 'authenticated' &&
        ROUTE_GUARDS[routeName]?.requiresAuth
      ) {
        // navigate의 타입은 RootParamList가 ParamListBase를 만족하지 않아
        // 정적 오버로드 추론이 [never, never]로 수렴한다.
        // Task 7과 동일하게 navRef를 any로 캐스트해 호출한다.
         
        (navRef as any).navigate('Login', {
          redirect: { screen: route.name, params: route.params },
        });
      }
    });

    return unsub;
  }, [status, navRef]);
}
