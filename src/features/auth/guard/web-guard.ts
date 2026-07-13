/**
 * 인증 필요한 Web(SPA) 경로 프리픽스. leading-slash, trailing-slash 없이('/force').
 *
 * 범위 = 계정 전용 페이지만(Martin 확정, 2026-07-13). auth 없으면 기능 자체가 성립 안 하는
 * 페이지라 게이트가 정상 동작 — 콘텐츠성 페이지(연예인/꿈해몽 등)는 게스트 브라우징을 막지
 * 않으려 의도적으로 제외(레거시 AuthGuard는 걸었으나 제품 판단으로 보류).
 */
export const GUARDED_WEB_PATH_PREFIXES: string[] = [
  '/force', // 복채(재화) — /force/* 포함
  '/freeforce', // 무료 충전
  '/giftbox', // 선물함
  '/fatebook', // 마이 페이트북
  '/profile/update', // 프로필 수정(프로필 조회는 미포함)
  '/push', // 알림함
];

/**
 * Web 라우트 부분 보호 판정(순수). 프리픽스 경계 매칭:
 * '/my'는 '/my'와 '/my/…'를 매치하고 '/mypage'는 매치하지 않는다. 쿼리/해시는 떼고 판단.
 */
export function webPathRequiresAuth(
  path: string,
  prefixes: readonly string[] = GUARDED_WEB_PATH_PREFIXES,
): boolean {
  const clean = path.split(/[?#]/)[0];
  return prefixes.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}
