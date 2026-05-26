import type { Category } from '../types';

const SUGGESTED_TO_NAME: Record<string, string[]> = {
  '食費': ['食費'],
  '交通費': ['交通費'],
  '日用品': ['日用品'],
  '外食': ['外食'],
  '娯楽': ['娯楽'],
  '医療': ['医療'],
  '衣類': ['衣類'],
  '給与': ['給与'],
  'その他': ['その他'],
};

export function findCategoryBySuggestion(
  suggestedCategory: string,
  categories: Category[],
  transactionType: 'expense' | 'income',
): string | null {
  const names = SUGGESTED_TO_NAME[suggestedCategory] ?? [suggestedCategory];
  const filtered = categories.filter((c) => c.type === transactionType);

  for (const name of names) {
    const match = filtered.find(
      (c) => c.name === name || c.name.includes(name),
    );
    if (match) return match.id;
  }

  return filtered[0]?.id ?? null;
}
