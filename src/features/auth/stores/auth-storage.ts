import { createMMKV } from 'react-native-mmkv';
import { env } from '@/shared/config';
import type { KVStorage } from '@/shared/types';

const KEY = 'auth.accessToken';

/** 액세스 토큰 영속 저장소 팩토리. auth-store(Zustand 세션 상태)의 영속 짝. */
export function createAuthStorage(kv: KVStorage) {
  return {
    get: (): string | null => kv.getString(KEY) ?? null,
    set: (token: string): void => {
      // 응답 형태 불일치 등으로 undefined/빈 값이 들어오면 MMKV가 크립틱하게 크래시한다
      // (variant 변환 에러) → 호출부가 원인을 알 수 있게 명확한 에러로 가드한다(defense-in-depth).
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error(
          `authStorage.set: 비어있지 않은 문자열 토큰이 필요합니다(받은 타입: ${typeof token})`,
        );
      }
      kv.set(KEY, token);
    },
    clear: (): void => kv.remove(KEY),
  };
}

export type AuthStorage = ReturnType<typeof createAuthStorage>;

/** 앱 공통 토큰 저장소(MMKV, 암호화). 로그인 시 set, 로그아웃/세션 만료 시 clear. */
export const authStorage = createAuthStorage(
  createMMKV({ id: 'auth', encryptionKey: env.mmkvEncryptionKey }),
);
