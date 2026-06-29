/** 소셜 프로바이더 추상화. 국가별 공급자(구글/애플/…)가 이 인터페이스를 구현한다. */
export type AuthProvider = {
  /** 소셜 로그인 + Firebase 인증 → Firebase ID token 반환 */
  signIn: () => Promise<{ firebaseIdToken: string }>;
  signOut: () => Promise<void>;
};
