-- ============================================================
-- 同時入力されたスコープ別コピーを束ねる link_id
-- 1回の入力で「個人＋各グループ」に作成した複数行を同じ link_id で
-- グルーピングし、まとめて編集／削除できるようにする。
-- 単一スコープのみの記録は link_id = NULL（兄弟なし）。
-- ============================================================

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS link_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_link
  ON public.transactions(link_id);

-- RLS 変更は不要:
-- 更新・削除ポリシーは既に user_id = auth.uid() に限定されているため、
-- link_id でまとめて更新／削除しても自分の行しか対象にならない。
