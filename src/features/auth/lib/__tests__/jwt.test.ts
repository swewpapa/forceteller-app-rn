import { decodeJwtPayload, isExpired, needsRefresh } from '@/features/auth/lib/jwt';

/**
 * 토큰들은 Node로 사전 생성한 고정 벡터 — 디코더를 자체 인코더가 아닌 독립 구현
 * (Buffer base64url)으로 검증하고, RN tsconfig에 없는 Node 타입(Buffer) 의존도 피한다.
 * 재생성: node -e "console.log('eyJhbGciOiJIUzI1NiJ9.'
 *   + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.sig')"
 */
const NOW_SEC = 1_700_000_000;
const NOW_MS = NOW_SEC * 1000;

// { exp: 123, iat: 45, iss: 'forceteller' }
const BASIC = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjEyMywiaWF0Ijo0NSwiaXNzIjoiZm9yY2V0ZWxsZXIifQ.sig';
// { exp: 99, iat: 1, name: '이승환' } — 비ASCII(UTF-8) payload
const UTF8 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5LCJpYXQiOjEsIm5hbWUiOiLsnbTsirntmZgifQ.sig';
// { exp: 7, iat: 3, x: 'ÿþ' } — base64url 특수문자(_)가 포함된 payload
const B64URL_SPECIALS = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjcsImlhdCI6MywieCI6IsO_w74ifQ.sig';
// payload가 JSON이 아님('not-json')
const NOT_JSON = 'h.bm90LWpzb24.s';
// { exp: NOW+1h, iat: NOW-1h } — 만료 전 + 발급 24h 이내
const FRESH = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDM2MDAsImlhdCI6MTY5OTk5NjQwMH0.sig';
// { exp: NOW-1, iat: NOW-1h } — 만료됨
const EXPIRED = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2OTk5OTk5OTksImlhdCI6MTY5OTk5NjQwMH0.sig';
// { exp: NOW+1h, iat: NOW-25h } — 만료 전이지만 발급 24h 경과
const STALE_25H = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDM2MDAsImlhdCI6MTY5OTkxMDAwMH0.sig';
// { exp: NOW+1h, iat: NOW-24h } — 발급 정확히 24h(경계)
const EDGE_24H = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDM2MDAsImlhdCI6MTY5OTkxMzYwMH0.sig';
// { iss: 'forceteller' } — exp/iat 없음
const NO_CLAIMS = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJmb3JjZXRlbGxlciJ9.sig';

describe('decodeJwtPayload', () => {
  it('유효한 JWT의 payload를 디코드한다', () => {
    expect(decodeJwtPayload(BASIC)).toMatchObject({ exp: 123, iat: 45 });
  });

  it('한글 등 비ASCII 필드가 있어도 exp/iat를 정상 디코드한다(UTF-8)', () => {
    expect(decodeJwtPayload(UTF8)).toMatchObject({ exp: 99, iat: 1, name: '이승환' });
  });

  it('base64url 특수문자(-, _)가 포함된 payload를 디코드한다', () => {
    expect(decodeJwtPayload(B64URL_SPECIALS)).toMatchObject({ exp: 7, iat: 3 });
  });

  it('3파트가 아니면 null', () => {
    expect(decodeJwtPayload('one.two')).toBeNull();
    expect(decodeJwtPayload('plain-string')).toBeNull();
  });

  it('payload가 JSON이 아니면 null', () => {
    expect(decodeJwtPayload(NOT_JSON)).toBeNull();
  });
});

describe('isExpired', () => {
  it('만료된 토큰 → true', () => {
    expect(isExpired(EXPIRED, NOW_MS)).toBe(true);
  });

  it('만료 전 토큰 → false (발급 24h 경과여도 만료는 아님)', () => {
    expect(isExpired(FRESH, NOW_MS)).toBe(false);
    expect(isExpired(STALE_25H, NOW_MS)).toBe(false);
  });

  it('디코드 불가/exp 부재 → false (판정 불가 시 만료 취급하지 않음 — 401 폴백에 위임)', () => {
    expect(isExpired('garbage', NOW_MS)).toBe(false);
    expect(isExpired(NO_CLAIMS, NOW_MS)).toBe(false);
  });
});

describe('needsRefresh', () => {
  it('신선한 토큰(만료 전 + 발급 24h 이내) → false', () => {
    expect(needsRefresh(FRESH, NOW_MS)).toBe(false);
  });

  it('만료된 토큰 → true', () => {
    expect(needsRefresh(EXPIRED, NOW_MS)).toBe(true);
  });

  it('만료 전이라도 발급 24h 경과 → true (레거시 하루 규칙)', () => {
    expect(needsRefresh(STALE_25H, NOW_MS)).toBe(true);
  });

  it('발급 정확히 24h 이내(경계) → false', () => {
    expect(needsRefresh(EDGE_24H, NOW_MS)).toBe(false);
  });

  it('디코드 불가 토큰 → false (판정 불가 시 갱신하지 않음 — 401 폴백에 위임)', () => {
    expect(needsRefresh('garbage', NOW_MS)).toBe(false);
  });

  it('exp/iat 없는 payload → false', () => {
    expect(needsRefresh(NO_CLAIMS, NOW_MS)).toBe(false);
  });
});
