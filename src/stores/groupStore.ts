import { create } from 'zustand';
import type { FamilyGroup } from '../types';

type GroupState = {
  group: FamilyGroup | null;
  setGroup: (group: FamilyGroup | null) => void;
};

export const useGroupStore = create<GroupState>((set) => ({
  group: null,
  setGroup: (group) => set({ group }),
}));
