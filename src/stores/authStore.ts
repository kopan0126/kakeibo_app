import { create } from 'zustand';
import type { UserProfile } from '../types';

type AuthState = {
  user: UserProfile | null;
  isLoading: boolean;
  isPremium: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  // IAP連携時はここでサブスク状態をSupabaseから取得して設定する
  setPremium: (isPremium: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isPremium: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setPremium: (isPremium) => set({ isPremium }),
}));
