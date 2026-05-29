import { create } from 'zustand';
import type { FamilyGroup } from '../types';

type GroupState = {
  groups: FamilyGroup[];
  setGroups: (groups: FamilyGroup[]) => void;
  addGroup: (group: FamilyGroup) => void;
  removeGroup: (groupId: string) => void;
};

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),
  removeGroup: (groupId) => set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) })),
}));
