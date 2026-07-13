import { webPathRequiresAuth } from '../guard/web-guard';

describe('webPathRequiresAuth', () => {
  const prefixes = ['/my', '/purchase'];

  it('프리픽스 정확 일치 + 하위 경로 매치', () => {
    expect(webPathRequiresAuth('/my', prefixes)).toBe(true);
    expect(webPathRequiresAuth('/my/history', prefixes)).toBe(true);
    expect(webPathRequiresAuth('/purchase/123', prefixes)).toBe(true);
  });

  it('경계 밖 유사 경로는 미매치 (/mypage ≠ /my)', () => {
    expect(webPathRequiresAuth('/mypage', prefixes)).toBe(false);
    expect(webPathRequiresAuth('/purchases', prefixes)).toBe(false);
  });

  it('쿼리/해시는 떼고 판단', () => {
    expect(webPathRequiresAuth('/my?tab=1', prefixes)).toBe(true);
    expect(webPathRequiresAuth('/my#top', prefixes)).toBe(true);
    expect(webPathRequiresAuth('/fortune?from=/my', prefixes)).toBe(false);
  });

  it('기본 목록(Phase B 전 빈 배열) → 전부 false', () => {
    expect(webPathRequiresAuth('/my')).toBe(false);
  });
});
