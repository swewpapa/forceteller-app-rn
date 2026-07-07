import { useQuery } from '@tanstack/react-query';
import { todayApi } from '../api/today-api';

/** Server-state hook for today's fortune (sign 기준 조회). */
export function useTodayBySign(sign: string) {
  return useQuery({
    queryKey: ['today', sign],
    queryFn: () => todayApi.getBySign(sign),
  });
}
