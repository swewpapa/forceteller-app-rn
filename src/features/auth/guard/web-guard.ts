/**
 * 인증 필요한 Web(SPA) 경로 프리픽스 목록. 트레일링 슬래시 없이 선언한다('/my').
 * ⚠️ Phase B(보호 페이지 목록 제품 결정)에서 채운다 — 빈 배열이면 모든 경로 통과.
 */
export const GUARDED_WEB_PATH_PREFIXES: string[] = [];

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
