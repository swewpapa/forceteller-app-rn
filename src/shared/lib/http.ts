import { env } from '@/shared/config';

export type ApiErrorKind = 'http' | 'timeout' | 'network';

/**
 * 정규화된 API 에러. HTTP 4xx/5xx, 타임아웃, 네트워크 실패를 한 타입으로 모은다.
 * response 인터셉터의 onRejected로 전달되며, 호출부는 `kind`/`status`로 분기한다.
 */
export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    /** kind === 'http'일 때만 채워진다. */
    readonly status: number | null,
    readonly body: unknown,
  ) {
    super(
      kind === 'http'
        ? `HTTP ${status}`
        : kind === 'timeout'
          ? 'Request timed out'
          : 'Network error',
    );
    this.name = 'ApiError';
  }
}

/** 요청 인터셉터가 변형하는 요청 설정. */
export type RequestConfig = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>;
type ResponseFulfilled = (response: Response) => Response | Promise<Response>;
/** 에러를 받아 복구값을 반환하거나(재요청 결과 등) 다시 throw한다. */
type ResponseRejected = (error: unknown) => unknown;

type HttpClientConfig = {
  baseURL: string;
  timeout: number;
};

type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/**
 * fetch 기반 HTTP 클라이언트 + axios 스타일 request/response 인터셉터.
 * 재시도·캐싱은 react-query에 위임한다.
 */
export function createHttpClient({ baseURL, timeout }: HttpClientConfig) {
  // eject로 제거된 슬롯은 null로 비워 인덱스(id)를 유지한다.
  const requestInterceptors: (RequestInterceptor | null)[] = [];
  const responseInterceptors: ({
    onFulfilled?: ResponseFulfilled;
    onRejected?: ResponseRejected;
  } | null)[] = [];

  const interceptors = {
    request: {
      use(fn: RequestInterceptor): number {
        return requestInterceptors.push(fn) - 1;
      },
      eject(id: number): void {
        if (id >= 0 && id < requestInterceptors.length) {
          requestInterceptors[id] = null;
        }
      },
    },
    response: {
      use(onFulfilled?: ResponseFulfilled, onRejected?: ResponseRejected): number {
        return responseInterceptors.push({ onFulfilled, onRejected }) - 1;
      },
      eject(id: number): void {
        if (id >= 0 && id < responseInterceptors.length) {
          responseInterceptors[id] = null;
        }
      },
    },
  };

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    let config: RequestConfig = {
      url: `${baseURL}${path}`,
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
      body,
      signal: options?.signal,
    };
    // request 인터셉터: 요청 전 순차 변형
    for (const ri of requestInterceptors) {
      if (ri) config = await ri(config);
    }
    console.log('[http] →', config.method, config.url); // [DEBUG] 제거 예정

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
    config.signal?.addEventListener('abort', () => controller.abort());

    try {
      let res: Response;
      try {
        res = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
          signal: controller.signal,
        });
      } catch (e) {
        if (timedOut) throw new ApiError('timeout', null, null);
        // 외부 signal 취소는 원본 에러를 전파(react-query 취소 처리)
        if (config.signal?.aborted) throw e as Error;
        throw new ApiError('network', null, e);
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new ApiError('http', res.status, errBody);
      }
      // response 인터셉터: onFulfilled 순차 적용
      for (const ri of responseInterceptors) {
        if (ri?.onFulfilled) res = await ri.onFulfilled(res);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (e) {
      // response 인터셉터: onRejected 체인. 복구하면 그 값을 반환, 아니면 다음으로 rethrow.
      let error: unknown = e;
      for (const ri of responseInterceptors) {
        if (ri?.onRejected) {
          try {
            return (await ri.onRejected(error)) as T;
          } catch (next) {
            error = next;
          }
        }
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    interceptors,
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>('GET', path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('POST', path, body, options),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PUT', path, body, options),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PATCH', path, body, options),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>('DELETE', path, undefined, options),
  };
}

/** 앱 공통 HTTP 클라이언트(fetch 기반). feature API가 이 위에 빌드한다. */
export const http = createHttpClient({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
});

export type HttpClient = ReturnType<typeof createHttpClient>;
