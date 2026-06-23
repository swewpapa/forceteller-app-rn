import { useTodayStore } from '../stores/today-store';

describe('today-store', () => {
  it('has a default selected sign', () => {
    expect(useTodayStore.getState().selectedSign).toBe('aries');
  });

  it('updates the selected sign', () => {
    useTodayStore.getState().setSelectedSign('leo');
    expect(useTodayStore.getState().selectedSign).toBe('leo');
  });
});
