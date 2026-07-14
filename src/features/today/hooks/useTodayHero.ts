import { useQuery } from '@tanstack/react-query';
import { todayApi } from '@/features/today/api/today-api';

/** 투데이 상단 히어로 훅(서버드리븐). 인증 상태에 따라 서버가 게스트/회원 문구를 내려준다. */
export function useTodayHero() {
  return useQuery({
    queryKey: ['today', 'hero'],
    queryFn: () => todayApi.getHero(),
  });
}
