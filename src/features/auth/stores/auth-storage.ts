import { createMMKV } from 'react-native-mmkv';
import { env } from '@/shared/config';
import type { KVStorage } from '@/shared/types';
import type { AuthTokenPair } from '../api/auth-api';

// 저장 키는 기기 데이터 계약 — accessToken 키는 기존 설치 사용자와의 계약이라 불변.
const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';
const PROVIDER_KEY = 'auth.provider';

/** 인증 세션(토큰 쌍 + 로그인 수단) 영속 저장소 팩토리. auth-store(Zustand 세션 상태)의 영속 짝. */
export function createAuthStorage(kv: KVStorage) {
  /**
   * 토큰 쌍 저장(로그인/갱신 공용 — 저장 단위는 항상 쌍).
   * refreshToken이 null이면 이전 세션의 refresh 토큰을 제거해 잔존을 막는다.
   */
  const setTokenPair = ({ accessToken, refreshToken }: AuthTokenPair): void => {
    // 응답 형태 불일치 등으로 undefined/빈 값이 들어오면 MMKV가 크립틱하게 크래시한다
    // (variant 변환 에러) → 호출부가 원인을 알 수 있게 명확한 에러로 가드한다(defense-in-depth).
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      throw new Error(
        `authStorage.setTokenPair: 비어있지 않은 문자열 토큰이 필요합니다(받은 타입: ${typeof accessToken})`,
      );
    }
    kv.set(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      kv.set(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      kv.remove(REFRESH_TOKEN_KEY);
    }
  };

  return {
    getAccessToken: (): string | null => kv.getString(ACCESS_TOKEN_KEY) ?? null,
    getRefreshToken: (): string | null => kv.getString(REFRESH_TOKEN_KEY) ?? null,
    /** 로그인 시 저장된 수단 id. signOut이 어느 프로바이더의 원격 로그아웃을 부를지 복원한다. */
    getProvider: (): string | null => kv.getString(PROVIDER_KEY) ?? null,
    setTokenPair,
    /** 로그인 세션 저장: 토큰 쌍 + 로그인 수단. 갱신(setTokenPair)은 provider를 건드리지 않는다. */
    setSession: ({ provider, ...tokens }: AuthTokenPair & { provider: string }): void => {
      setTokenPair(tokens);
      kv.set(PROVIDER_KEY, provider);
    },
    clear: (): void => {
      kv.remove(ACCESS_TOKEN_KEY);
      kv.remove(REFRESH_TOKEN_KEY);
      kv.remove(PROVIDER_KEY);
    },
  };
}

export type AuthStorage = ReturnType<typeof createAuthStorage>;

/** 앱 공통 세션 저장소(MMKV, 암호화). 로그인 시 setSession, 갱신 시 setTokenPair, 로그아웃/만료 시 clear. */
export const authStorage = createAuthStorage(
  createMMKV({ id: 'auth', encryptionKey: env.mmkvEncryptionKey }),
);
