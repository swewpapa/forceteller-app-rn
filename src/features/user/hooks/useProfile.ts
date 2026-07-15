import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { userApi } from '@/features/user/api/user-api';

/**
 * 로그인 사용자 사주 프로필(생년월일시 + 출생지). 인증 상태일 때만 페칭.
 * queryKey ['user','profile'] — more/편집 등 다중 소비처가 이 캐시를 공유한다.
 */
export function useProfile() {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userApi.getProfile(),
    enabled: status === 'authenticated',
  });
}
