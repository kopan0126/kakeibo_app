import { supabase } from './supabase';
import type { Transaction, Category, CategoryType } from '../types';

export async function getTransactionsByMonth(
  userId: string,
  from: string,
  to: string,
  showPersonal: boolean,
  groupId: string | null,
): Promise<Transaction[]> {
  const results: Transaction[] = [];

  if (showPersonal) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .is('group_id', null)
      .gte('transaction_date', from)
      .lte('transaction_date', to)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    if (data) results.push(...data);
  }

  if (groupId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('group_id', groupId)
      .gte('transaction_date', from)
      .lte('transaction_date', to)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    if (data) results.push(...data);
  }

  results.sort((a, b) => {
    const d = b.transaction_date.localeCompare(a.transaction_date);
    if (d !== 0) return d;
    return b.created_at.localeCompare(a.created_at);
  });

  return results;
}

export async function createTransaction(
  params: Omit<Transaction, 'id' | 'created_at'>,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(params)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTransaction(
  id: string,
  params: Partial<Omit<Transaction, 'id' | 'created_at'>>,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(params)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getByMonth(
  scope: 'personal' | string,
  userId: string,
  year: number,
  month: number,
): Promise<Transaction[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  let query = supabase
    .from('transactions')
    .select('*')
    .gte('transaction_date', from)
    .lte('transaction_date', to)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (scope === 'personal') {
    query = query.eq('user_id', userId).is('group_id', null);
  } else {
    query = query.eq('group_id', scope);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDailyTotals(
  scope: 'personal' | string,
  userId: string,
  year: number,
  month: number,
  categories: Category[],
): Promise<Record<string, { income: number; expense: number }>> {
  const txs = await getByMonth(scope, userId, year, month);
  const map: Record<string, { income: number; expense: number }> = {};

  for (const tx of txs) {
    if (!map[tx.transaction_date]) {
      map[tx.transaction_date] = { income: 0, expense: 0 };
    }
    const cat = categories.find((c) => c.id === tx.category_id);
    const type = cat?.type ?? 'expense';
    if (type === 'income') {
      map[tx.transaction_date].income += tx.amount_cents;
    } else {
      map[tx.transaction_date].expense += tx.amount_cents;
    }
  }

  return map;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('type')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCustomCategory(
  userId: string,
  name: string,
  icon: string,
  color: string,
  type: CategoryType,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      icon,
      color,
      type,
      user_id: userId,
      is_default: false,
      group_id: null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCustomCategory(
  id: string,
  name: string,
  icon: string,
  color: string,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, icon, color })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCustomCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
