import type { AuthProvider } from './auth-provider';
import { googleProvider } from './google-provider';

/**
 * 로그인 수단 레지스트리. 수단 추가 = provider 구현 + 여기 한 줄.
 * id는 exchange API의 wire 값(`{ provider }`)과 동일 어휘를 쓴다
 * (레거시 특례: 이메일 링크는 'password'로 나가므로, 도입 시 id↔wire 매핑 분리 필요).
 */
const registry = {
  google: googleProvider,
} satisfies Record<string, AuthProvider>;

/** 스토어 공개 API(signIn)가 받는 프로바이더 식별자 — 레지스트리에서 파생. */
export type AuthProviderId = keyof typeof registry;

/**
 * id → provider 조회. 저장소(auth.provider)에서 복원된 임의 문자열도 받을 수 있어
 * string을 허용하고, 미등록 id는 null을 반환한다(호출부가 원격 로그아웃 스킵 판단).
 */
export function getAuthProvider(id: string): AuthProvider | null {
  return (registry as Record<string, AuthProvider>)[id] ?? null;
}
