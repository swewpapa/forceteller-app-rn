import { useQuery } from '@tanstack/react-query';
import { fetchTodayFortune } from '../api/today-api';

/** Server-state hook for today's fortune. */
export function useToday(sign: string) {
  return useQuery({
    queryKey: ['today', sign],
    queryFn: () => fetchTodayFortune(sign),
  });
}
