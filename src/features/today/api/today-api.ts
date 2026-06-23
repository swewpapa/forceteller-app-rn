import { apiClient } from '@/shared/lib';
import type { TodayFortune } from '../types/today-types';

export async function fetchTodayFortune(sign: string): Promise<TodayFortune> {
  const { data } = await apiClient.get<TodayFortune>(`/today/${sign}`);
  return data;
}
