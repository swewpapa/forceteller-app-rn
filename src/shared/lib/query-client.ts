import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http';

/** App-wide TanStack Query client (server-state cache). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // 4xx(클라이언트 오류)는 재시도해도 결과가 같으므로 제외.
      // 5xx·timeout·network 등 일시적 오류만 최대 2회 재시도한다.
      retry: (failureCount, error) => {
        if (
          error instanceof ApiError &&
          error.kind === 'http' &&
          error.status !== null &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
