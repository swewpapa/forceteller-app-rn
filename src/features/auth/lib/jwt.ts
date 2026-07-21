/**
 * JWT payload 디코드 + 갱신 판정 순수 함수.
 * 레거시 forceteller-app `core/providers/auth/lib/jwt.ts`의 시맨틱을 따른다:
 * 만료(`exp` 경과) 또는 발급(`iat`) 후 24시간 경과 시 갱신 대상.
 * atob 등 런타임 전역에 의존하지 않도록 base64url을 직접 디코드한다
 * (jest Node / Hermes 어디서든 동일 동작).
 */
export type JwtPayload = { exp?: number; iat?: number };

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** base64url(패딩 유무 무관) → 바이트 배열. 알파벳 밖 문자는 null. */
/* eslint-disable no-bitwise -- base64 디코딩은 6비트 패킹이 본질 */
function base64UrlToBytes(input: string): number[] | null {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of base64) {
    if (char === '=') break;
    const value = B64_ALPHABET.indexOf(char);
    if (value === -1) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}
/* eslint-enable no-bitwise */

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const bytes = base64UrlToBytes(parts[1]);
  if (bytes === null) return null;

  try {
    // 바이트 → percent-encoding → decodeURIComponent로 UTF-8 복원(비ASCII payload 대응)
    const json = decodeURIComponent(
      bytes.map((byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''),
    );
    const payload: unknown = JSON.parse(json);
    if (typeof payload !== 'object' || payload === null) return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

const DAY_SEC = 24 * 60 * 60;

/**
 * 만료 판정(exp 경과). 하이브리드 restore의 분기 축 — 만료 세션만 갱신을 기다린다(블로킹).
 * 디코드 불가/exp 부재 시 false — 판정 불가 토큰은 만료 취급하지 않고
 * 서버 401 → expireSession 폴백에 위임한다(레거시와 동일).
 */
export function isExpired(token: string, nowMs: number): boolean {
  const payload = decodeJwtPayload(token);
  if (payload === null || payload.exp === undefined) return false;
  return Math.round(nowMs / 1000) > payload.exp;
}

/**
 * 토큰 갱신 필요 판정: 만료됐거나 발급 후 24시간이 지난 토큰(레거시 하루 규칙).
 * 미만료+24h 경과(stale)는 하이브리드 restore에서 백그라운드 갱신 대상이다.
 */
export function needsRefresh(token: string, nowMs: number): boolean {
  if (isExpired(token, nowMs)) return true;

  const payload = decodeJwtPayload(token);
  if (payload === null || payload.iat === undefined) return false;
  return payload.iat < Math.round(nowMs / 1000) - DAY_SEC;
}
