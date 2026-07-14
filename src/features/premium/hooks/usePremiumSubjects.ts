import { useQuery } from '@tanstack/react-query';
import { premiumApi } from '@/features/premium/api/premium-api';

/** 프리미엄 카테고리(장르/주제) 훅. 공개 데이터라 게스트/회원 공용. */
export function usePremiumSubjects() {
  return useQuery({
    queryKey: ['premium', 'subjects'],
    queryFn: () => premiumApi.getSubjects(),
  });
}
