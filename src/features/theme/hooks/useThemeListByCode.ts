import { useQuery } from '@tanstack/react-query';
import { themeApi } from '@/features/theme/api/theme-api';

/** 위젯 컨텍스트 서버 상태 훅. 재시도·staleTime은 전역 queryClient 정책. */
export function useThemeListByCode(code: string) {
  return useQuery({
    queryKey: ['theme', 'list', code],
    queryFn: () => themeApi.listByCode(code),
  });
}
