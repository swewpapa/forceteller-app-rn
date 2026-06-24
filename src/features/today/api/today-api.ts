import { http } from '@/shared/lib';
import type { TodayFortune } from '../types/today-types';

export async function fetchTodayFortune(sign: string): Promise<TodayFortune> {
  return http.get<TodayFortune>(`/today/${sign}`);
}
