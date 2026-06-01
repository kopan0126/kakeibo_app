-- ============================================================
-- デフォルトカテゴリの非表示機能：users に hidden_category_ids を追加
-- ============================================================
-- デフォルトカテゴリ(is_default=true)は全ユーザー共通レコードのため、
-- 直接編集・削除はできない。代わりに各ユーザーが「記入画面で非表示に
-- したいカテゴリID」をこの配列に保持し、自分の入力画面からだけ隠す。
-- 過去の取引データやカテゴリ本体には影響しない。

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS hidden_category_ids UUID[] NOT NULL DEFAULT '{}';

-- 自分の行の更新は既存の "users_update_own" ポリシーで許可済み
-- （UPDATE は WITH CHECK 省略時に USING 式が両方に適用される）
