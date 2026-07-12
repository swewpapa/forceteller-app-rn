import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todayApi } from '../api/today-api';
import type { TodayApiLink, TodayPost } from '../types/today-types';

/**
 * 포스트 아이템/버튼의 api 액션 실행 → 성공 시 해당 포스트를 재조회(getPost)해 피드 캐시에서 교체.
 * gift 클레임·chat 카드선택 등 공통 인터랙션(Martin 확정: 액션 → GET post/{id} → 포스트 교체).
 * pending/error는 컴포넌트가 소비(버튼 로딩/비활성).
 */
export function useTodayAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      action,
      payload,
    }: {
      postId: number;
      action: TodayApiLink;
      payload?: Record<string, unknown>;
    }) => {
      await todayApi.runAction(action, payload);
      return todayApi.getPost(postId);
    },
    onSuccess: (updated) => {
      if (!updated) return;
      queryClient.setQueryData<TodayPost[]>(['today', 'posts'], (prev) =>
        prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev,
      );
    },
  });
}
