import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user-api';
import { useAuthStore } from '../stores/auth-store';

/**
 * 로그인 사용자 기본 정보(me). 인증 상태일 때만 페칭(토큰 없으면 미조회).
 * queryKey ['user','me'] — 로그인/로그아웃 시 auth-store가 전체 무효화하면 함께 갱신된다.
 */
export function useMe() {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => userApi.getMe(),
    enabled: status === 'authenticated',
  });
}
