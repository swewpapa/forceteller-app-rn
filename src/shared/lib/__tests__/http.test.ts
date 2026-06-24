import { createHttpClient, ApiError } from '../http';

afterEach(() => jest.restoreAllMocks());

describe('createHttpClient', () => {
  const client = createHttpClient({ baseURL: 'https://api.test', timeout: 1000 });

  it('GET 성공 시 JSON 본문을 반환한다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    }) as unknown as typeof fetch;
    expect(await client.get('/x')).toEqual({ id: 1 });
  });

  it('4xx 응답은 ApiError(kind=http, status, body)로 throw한다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'not found' }),
    }) as unknown as typeof fetch;
    await expect(client.get('/x')).rejects.toMatchObject({
      kind: 'http',
      status: 404,
      body: { message: 'not found' },
    });
  });

  it('5xx 응답도 ApiError(kind=http)로 throw한다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => null,
    }) as unknown as typeof fetch;
    await expect(client.get('/x')).rejects.toMatchObject({ kind: 'http', status: 503 });
  });

  it('네트워크 실패는 ApiError(kind=network)로 throw한다', async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;
    await expect(client.get('/x')).rejects.toMatchObject({ kind: 'network' });
  });

  it('204 No Content는 undefined를 반환한다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    }) as unknown as typeof fetch;
    expect(await client.get('/x')).toBeUndefined();
  });

  it('POST는 body를 JSON 직렬화하고 Content-Type을 붙인다', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await client.post('/x', { a: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/x',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ a: 1 }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('timeout이 지나면 ApiError(kind=timeout)로 throw한다', async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockImplementation(
      (_url: string, opts: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    ) as unknown as typeof fetch;
    const promise = client.get('/slow');
    jest.advanceTimersByTime(1000);
    await expect(promise).rejects.toMatchObject({ kind: 'timeout' });
    jest.useRealTimers();
  });

  it('ApiError는 Error의 인스턴스다', () => {
    const err = new ApiError('http', 500, null);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
  });
});

describe('interceptors', () => {
  it('request 인터셉터가 config(headers)를 변형한다', async () => {
    const client = createHttpClient({ baseURL: 'https://api.test', timeout: 1000 });
    client.interceptors.request.use((config) => {
      config.headers['X-Auth-Token'] = 'abc';
      return config;
    });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await client.get('/x');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/x',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Auth-Token': 'abc' }),
      }),
    );
  });

  it('response onFulfilled가 정상 응답 흐름에서 호출된다', async () => {
    const client = createHttpClient({ baseURL: 'https://api.test', timeout: 1000 });
    const onFulfilled = jest.fn((res: Response) => res);
    client.interceptors.response.use(onFulfilled);
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: 1 }),
    }) as unknown as typeof fetch;
    await client.get('/x');
    expect(onFulfilled).toHaveBeenCalledTimes(1);
  });

  it('response onRejected가 에러를 복구하면 그 값을 반환한다', async () => {
    const client = createHttpClient({ baseURL: 'https://api.test', timeout: 1000 });
    client.interceptors.response.use(undefined, (error) => {
      if (error instanceof ApiError && error.status === 401) {
        return { recovered: true };
      }
      throw error;
    });
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => null,
    }) as unknown as typeof fetch;
    expect(await client.get('/x')).toEqual({ recovered: true });
  });

  it('eject한 request 인터셉터는 적용되지 않는다', async () => {
    const client = createHttpClient({ baseURL: 'https://api.test', timeout: 1000 });
    const id = client.interceptors.request.use((config) => {
      config.headers['X-Test'] = '1';
      return config;
    });
    client.interceptors.request.eject(id);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await client.get('/x');
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('X-Test');
  });
});
