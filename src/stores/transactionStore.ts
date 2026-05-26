import { create } from 'zustand';
import type { Transaction, Category } from '../types';

type TransactionState = {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  isLoading: boolean;
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  removeTransaction: (id: string) => void;
  setCategories: (cats: Category[]) => void;
  setCurrentMonth: (month: string) => void;
  setLoading: (loading: boolean) => void;
};

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  categories: [],
  currentMonth: new Date().toISOString().slice(0, 10),
  isLoading: false,
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
  updateTransaction: (tx) =>
    set((s) => ({ transactions: s.transactions.map((t) => (t.id === tx.id ? tx : t)) })),
  removeTransaction: (id) =>
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
  setCategories: (categories) => set({ categories }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setLoading: (isLoading) => set({ isLoading }),
}));
