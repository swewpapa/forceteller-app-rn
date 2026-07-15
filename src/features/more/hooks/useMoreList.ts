import { useQuery } from '@tanstack/react-query';
import { moreApi } from '@/features/more/api/more-api';

/** 더보기 숏컷 목록 훅(서버 드리븐). 목록은 공개라 게스트/로그인 공용. */
export function useMoreList() {
  return useQuery({
    queryKey: ['more', 'list'],
    queryFn: () => moreApi.list(),
  });
}
