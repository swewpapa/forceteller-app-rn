/** 원격 config 스냅샷: key → 타입 강제변환된 값. */
export type RemoteConfig = Record<string, unknown>;

// raw: 서버 응답(GET /api/config/:provider) 그대로. remote-config 내부 전용.
type RawConfigParam = { key?: string; type?: string; value?: unknown };
export type ConfigResponse = { status: number; data: { parameters?: RawConfigParam[] } };

// type별 강제변환. 미지 type / 변환 불가면 undefined(드롭).
function coerce(type: string | undefined, value: unknown): unknown {
  switch ((type ?? '').toUpperCase()) {
    case 'BOOLEAN':
      return typeof value === 'boolean' ? value : value === 'true';
    case 'STRING':
      return value == null ? '' : String(value);
    case 'NUMBER': {
      const n = Number(value);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'JSON':
      // 객체/배열 그대로. null/원시값이면 드롭(JSON 파라미터 계약 위반).
      return value != null && typeof value === 'object' ? value : undefined;
    default:
      return undefined; // 미지 type — forward compat 위해 드롭
  }
}

/** raw parameters[] → 도메인 config 맵. key 없음 / 미지 type / 변환 실패는 드롭. */
export function normalizeConfig(data: ConfigResponse['data']): RemoteConfig {
  const out: RemoteConfig = {};
  for (const p of data.parameters ?? []) {
    if (!p.key) continue;
    const v = coerce(p.type, p.value);
    if (v === undefined) continue;
    out[p.key] = v;
  }
  return out;
}

let snapshot: RemoteConfig = {};

/**
 * 원격 config 동기 접근 싱글턴. 부팅 시 캐시로 apply되고, 갱신 시 재apply된다.
 * 게터는 타입 가드 후 기본값 폴백 — 서버가 키를 빼거나 타입이 바뀌어도 안전.
 */
export const remoteConfig = {
  apply(config: RemoteConfig): void {
    snapshot = config;
  },
  raw(): RemoteConfig {
    return snapshot;
  },
  getBool(key: string, fallback = false): boolean {
    const v = snapshot[key];
    return typeof v === 'boolean' ? v : fallback;
  },
  getString(key: string, fallback = ''): string {
    const v = snapshot[key];
    return typeof v === 'string' ? v : fallback;
  },
  getNumber(key: string, fallback = 0): number {
    const v = snapshot[key];
    return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
  },
  getJSON<T>(key: string, fallback: T): T {
    const v = snapshot[key];
    return v != null && typeof v === 'object' ? (v as T) : fallback;
  },
};
