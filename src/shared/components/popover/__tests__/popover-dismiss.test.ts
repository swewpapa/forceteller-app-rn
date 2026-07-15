import { createPopoverDismissStore } from '@/shared/components/popover/popover-dismiss';

const fake = () => {
  const m = new Map<string, boolean>();
  return {
    store: {
      getBoolean: (k: string) => m.get(k),
      set: (k: string, v: boolean) => m.set(k, v),
    },
    m,
  };
};

describe('popover dismiss store', () => {
  it('기본 미dismiss', () => {
    const { store } = fake();
    expect(createPopoverDismissStore(store).isDismissed('freeforce')).toBe(false);
  });

  it('dismiss 후 true + 키 포맷', () => {
    const { store, m } = fake();
    const s = createPopoverDismissStore(store);
    s.dismiss('freeforce');
    expect(s.isDismissed('freeforce')).toBe(true);
    expect(m.has('popover.dismissed.freeforce')).toBe(true);
  });
});
