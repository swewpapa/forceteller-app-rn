import { useQuery } from '@tanstack/react-query';
import { premiumApi } from '@/features/premium/api/premium-api';

/** 프리미엄 홈 서버드리븐 위젯 목록 훅. 재시도·staleTime은 전역 queryClient 정책. */
export function usePremiumList() {
  return useQuery({
    queryKey: ['premium', 'list'],
    queryFn: () => premiumApi.listV2(),
  });
}
