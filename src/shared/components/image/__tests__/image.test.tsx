import { Image } from '@/shared/components/image/image';

describe('Image', () => {
  it('source가 null이면 null 반환(렌더 안 함)', () => {
    expect(Image({ source: null })).toBeNull();
  });
});
