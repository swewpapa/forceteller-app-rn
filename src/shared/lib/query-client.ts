import { QueryClient } from '@tanstack/react-query';

/** App-wide TanStack Query client (server-state cache). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60 * 1000,
    },
  },
});
