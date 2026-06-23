import { create } from 'zustand';

interface TodayState {
  selectedSign: string;
  setSelectedSign: (sign: string) => void;
}

/** Client-state store for the Today feature (UI selection, etc.). */
export const useTodayStore = create<TodayState>()(set => ({
  selectedSign: 'aries',
  setSelectedSign: sign => set({ selectedSign: sign }),
}));
