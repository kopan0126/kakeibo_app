import type { Category } from '../types';

const SUGGESTED_TO_NAME: Record<string, string[]> = {
  '食費': ['食費'],
  '交通費': ['交通費'],
  '日用品': ['日用品'],
  '外食': ['外食'],
  '娯楽': ['娯楽'],
  '医療': ['医療'],
  '衣類': ['衣類'],
  'サブスク': ['サブスク'],
  '税金': ['税金'],
  '給与': ['給与'],
  '副業': ['副業'],
  'お年玉': ['お年玉'],
  // 収入に「その他」系デフォルトは無い（0015でその他収入を廃止）ため、
  // 収入レシートで「その他」が返った場合は主要収入の給与へ確定的に落とす。
  // 支出では先頭の「その他」が先にマッチするので影響しない
  'その他': ['その他', '給与'],
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
