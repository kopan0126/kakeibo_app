-- ============================================================
-- カテゴリ刷新（藍染アイコン対応）
--   - 支出デフォルトに「サブスク」「税金」を追加
--   - 収入デフォルトに「お年玉」を追加
--   - 収入デフォルト「その他収入」を削除（既存取引は「給与」へ付け替え）
--
-- AizomeCategoryIcons.tsx はこれらのカテゴリ名に一致して和の線画アイコンを
-- 描画する。クライアントは既に対応済みのため、本マイグレーション適用で
-- アイコンが実際に表示されるようになる。
--
-- デフォルトカテゴリは group_id / user_id が NULL のグローバル単一レコード。
-- name に UNIQUE 制約は無いため、再実行時の重複を防ぐ目的で NOT EXISTS で判定する。
--
-- 各 INSERT は「既にデフォルトが投入済みの DB」でのみ実行する（is_default の
-- 存在チェック）。新規環境（db reset 直後の空テーブル）ではスキップし、
-- 後続の seeds/categories.sql が唯一の投入元となる。これにより
-- migration → seed の二重実行による重複タイルを防ぐ。
-- ============================================================

-- ── 1. 新しいデフォルトカテゴリを追加（冪等／既存DBのみ） ──────────
INSERT INTO public.categories (name, icon, color, type, group_id, user_id, is_default)
SELECT 'サブスク', '🔁', '#384d75', 'expense', NULL, NULL, true
WHERE EXISTS (SELECT 1 FROM public.categories WHERE is_default = true)
  AND NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE name = 'サブスク' AND type = 'expense' AND is_default = true
  );

INSERT INTO public.categories (name, icon, color, type, group_id, user_id, is_default)
SELECT '税金', '🏛️', '#a44231', 'expense', NULL, NULL, true
WHERE EXISTS (SELECT 1 FROM public.categories WHERE is_default = true)
  AND NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE name = '税金' AND type = 'expense' AND is_default = true
  );

INSERT INTO public.categories (name, icon, color, type, group_id, user_id, is_default)
SELECT 'お年玉', '🧧', '#384d75', 'income', NULL, NULL, true
WHERE EXISTS (SELECT 1 FROM public.categories WHERE is_default = true)
  AND NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE name = 'お年玉' AND type = 'income' AND is_default = true
  );

-- ── 2. 「その他収入」削除前に、参照する取引を「給与」へ付け替え ──────
--   transactions.category_id は ON DELETE CASCADE ではない（参照制約により
--   付け替えなしで削除すると失敗する）。収入の汎用カテゴリが廃止されるため、
--   既存の「その他収入」取引は主要収入である「給与」へ移す。
--   ※ budgets.category_id は ON DELETE CASCADE のため自動削除される。
UPDATE public.transactions t
SET category_id = (
  SELECT id FROM public.categories
  WHERE name = '給与' AND type = 'income' AND is_default = true
  LIMIT 1
)
WHERE t.category_id IN (
  SELECT id FROM public.categories
  WHERE name = 'その他収入' AND type = 'income' AND is_default = true
)
AND EXISTS (
  -- 付け替え先「給与」が無い場合に category_id を NULL 化して NOT NULL 違反を
  -- 起こすのを防ぐ（給与はシードで必ず存在するため通常は常に真）。
  SELECT 1 FROM public.categories
  WHERE name = '給与' AND type = 'income' AND is_default = true
);

-- ── 3. デフォルト「その他収入」を削除 ─────────────────────────
DELETE FROM public.categories
WHERE name = 'その他収入' AND type = 'income' AND is_default = true;
