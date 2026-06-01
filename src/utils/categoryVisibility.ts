import type { UserProfile } from '../types';

/**
 * 記入画面で非表示にするカテゴリIDの集合を返す。
 * 非表示ロジックを一元化し、画面ごとの重複（AddTransaction / CategoryManage）を避ける。
 * 将来グループ単位の非表示などに拡張する場合もここだけ変更すれば済む。
 */
export function hiddenCategoryIdSet(user: UserProfile | null): Set<string> {
  return new Set(user?.hidden_category_ids ?? []);
}
