-- ============================================================
-- カスタムカテゴリ機能：categories に user_id カラム追加 + RLS更新
-- ============================================================

-- user_id カラムを追加（個人カスタムカテゴリ用）
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── SELECT ──────────────────────────────────────────────────
-- デフォルト OR 自分のカスタム OR 自分のグループのカスタム
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (
    is_default = true
    OR user_id = auth.uid()
    OR group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- ── INSERT ──────────────────────────────────────────────────
-- 個人カスタム(group_id IS NULL) または 自分のグループ
DROP POLICY IF EXISTS "categories_insert_member" ON public.categories;
CREATE POLICY "categories_insert_member" ON public.categories
  FOR INSERT WITH CHECK (
    (is_default = false AND user_id = auth.uid() AND group_id IS NULL)
    OR (
      group_id IN (
        SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
      )
    )
  );

-- ── UPDATE ──────────────────────────────────────────────────
-- 自分のカスタム OR 自分のグループのカテゴリ
DROP POLICY IF EXISTS "categories_update_member" ON public.categories;
CREATE POLICY "categories_update_member" ON public.categories
  FOR UPDATE USING (
    (is_default = false AND user_id = auth.uid())
    OR (
      group_id IN (
        SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
      )
    )
  );

-- ── DELETE ──────────────────────────────────────────────────
-- 自分のカスタム OR 自分のグループのカテゴリ
DROP POLICY IF EXISTS "categories_delete_member" ON public.categories;
CREATE POLICY "categories_delete_member" ON public.categories
  FOR DELETE USING (
    (is_default = false AND user_id = auth.uid())
    OR (
      group_id IN (
        SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
      )
    )
  );
