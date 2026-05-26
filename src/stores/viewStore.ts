import { create } from 'zustand';

type ViewState = {
  selectedScope: 'personal' | string;
  setScope: (scope: 'personal' | string) => void;
};

export const useViewStore = create<ViewState>((set) => ({
  selectedScope: 'personal',
  setScope: (scope) => set({ selectedScope: scope }),
}));
