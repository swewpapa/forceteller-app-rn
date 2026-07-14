import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native'; // eslint-disable-line no-restricted-imports
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { ROUTE_GUARDS } from '@/features/auth/guard/route-guards';
import { shouldRedirectToLogin } from '@/features/auth/guard/evaluate-guard';
import { navigateUnsafe } from './navigate-unsafe';

// ReactNavigation.RootParamList는 전역 선언이라 index signature가 없어
// ParamListBase constraint(Record<string, object|undefined>)를 바로 만족하지 않는다.
// 교차 타입으로 constraint를 충족시키되 실제 라우트 정보는 유지한다.
type Nav = NativeStackNavigationProp<
  ReactNavigation.RootParamList & Record<string, object | undefined>
>;

/**
 * 앱 전역 네비게이션 훅. 진입 시 인증 가드를 적용한다.
 *
 * - 인증 필요 라우트(ROUTE_GUARDS)에 비인증 상태로 접근 시 Login으로 redirect.
 * - 다른 feature는 useNavigation 대신 이 훅을 사용한다.
 * - app 레이어를 import하지 않고 전역 ReactNavigation.RootParamList를 참조한다.
 */
export function useAppNavigation() {
  const nav = useNavigation<Nav>();
  const status = useAuthStore((s) => s.status);

  return useMemo(() => {
    const guarded = (screen: keyof ReactNavigation.RootParamList, params?: object): void => {
      if (shouldRedirectToLogin(ROUTE_GUARDS[screen], params, status)) {
        nav.navigate('Login', {
          redirect: { screen, params: params as Record<string, unknown> | undefined },
        });
        return;
      }
      navigateUnsafe(nav, screen, params);
    };

    return {
      navigate: guarded,
      push: guarded,
      replace: guarded,
      goBack: () => nav.goBack(),
    };
  }, [nav, status]);
}
