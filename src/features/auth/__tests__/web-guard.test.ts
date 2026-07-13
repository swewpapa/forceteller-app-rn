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

  it('기본 목록(계정 전용 세트) — 계정 경로 보호, 콘텐츠/미지정은 통과', () => {
    expect(webPathRequiresAuth('/force')).toBe(true);
    expect(webPathRequiresAuth('/force/charge')).toBe(true);
    expect(webPathRequiresAuth('/giftbox')).toBe(true);
    expect(webPathRequiresAuth('/profile/update')).toBe(true);
    // 콘텐츠성/미지정 경로는 게스트 통과
    expect(webPathRequiresAuth('/dream')).toBe(false);
    expect(webPathRequiresAuth('/profile')).toBe(false); // 조회는 미보호(update만)
    expect(webPathRequiresAuth('/item/4053')).toBe(false);
  });
});
