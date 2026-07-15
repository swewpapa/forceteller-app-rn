import { computePopover } from '@/shared/components/popover/popover-position';

const anchor = { x: 300, y: 50, width: 44, height: 44 };
const opts = { screenWidth: 375, bubbleWidth: 160, gap: 4, edgePadding: 8 };

describe('computePopover (bottom-end)', () => {
  it('앵커 아래 + 우측 정렬', () => {
    const r = computePopover(anchor, { ...opts, placement: 'bottom-end' });
    expect(r.top).toBe(50 + 44 + 4);
    expect(r.left).toBe(300 + 44 - 160);
  });

  it('좌측 넘침 clamp', () => {
    const r = computePopover(
      { x: 10, y: 50, width: 44, height: 44 },
      { ...opts, placement: 'bottom-end' },
    );
    expect(r.left).toBe(8);
  });

  it('우측 넘침 clamp (앵커가 화면 오른쪽 끝) → maxLeft', () => {
    const r = computePopover(
      { x: 340, y: 50, width: 44, height: 44 },
      { ...opts, placement: 'bottom-end' },
    );
    expect(r.left).toBe(opts.screenWidth - opts.edgePadding - opts.bubbleWidth);
  });

  it('caret은 앵커 중심을 말풍선 내 상대 x로', () => {
    const r = computePopover(anchor, { ...opts, placement: 'bottom-end' });
    expect(r.caretLeft).toBe(300 + 22 - r.left);
  });
});
