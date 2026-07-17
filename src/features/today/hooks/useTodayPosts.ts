import { useQuery } from '@tanstack/react-query';
import { todayApi } from '../api/today-api';

/** today 탭 서버드리븐 포스트 피드 훅. 재시도·staleTime은 전역 queryClient 정책. */
export function useTodayPosts() {
  return useQuery({
    queryKey: ['today', 'posts'],
    queryFn: () => todayApi.listPosts(),
  });
}
