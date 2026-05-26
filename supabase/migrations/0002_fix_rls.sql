-- ============================================================
-- RLS無限再帰の修正
-- family_membersを参照するポリシーがfamily_members自体にかかると
-- 無限ループになるため、SECURITY DEFINERヘルパー関数で回避する
-- ============================================================

-- 既存ポリシーを全削除
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_select_same_group" ON public.users;
DROP POLICY IF EXISTS "groups_select_member" ON public.family_groups;
DROP POLICY IF EXISTS "groups_insert_owner" ON public.family_groups;
DROP POLICY IF EXISTS "groups_update_owner" ON public.family_groups;
DROP POLICY IF EXISTS "groups_delete_owner" ON public.family_groups;
DROP POLICY IF EXISTS "members_select_same_group" ON public.family_members;
DROP POLICY IF EXISTS "members_insert_self" ON public.family_members;
DROP POLICY IF EXISTS "members_delete_self" ON public.family_members;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_member" ON public.categories;
DROP POLICY IF EXISTS "categories_update_member" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_member" ON public.categories;
DROP POLICY IF EXISTS "transactions_select_group" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_member" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
DROP POLICY IF EXISTS "budgets_select_group" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert_member" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update_member" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete_member" ON public.budgets;
DROP POLICY IF EXISTS "reports_select_group" ON public.ai_reports;
DROP POLICY IF EXISTS "reports_insert_member" ON public.ai_reports;
DROP POLICY IF EXISTS "reports_update_member" ON public.ai_reports;

-- ============================================================
-- ヘルパー関数（SECURITY DEFINERでRLSをバイパスしてグループIDを取得）
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY(
    SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
  )
$$;

-- ============================================================
-- ポリシー再作成（family_membersへの直接サブクエリをヘルパー関数で置換）
-- ============================================================

-- ── users ──────────────────────────────────────────────────
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_select_same_group" ON public.users
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM public.family_members
      WHERE group_id = ANY(public.get_my_group_ids())
    )
  );

-- ── family_groups ──────────────────────────────────────────
CREATE POLICY "groups_select_member" ON public.family_groups
  FOR SELECT USING (id = ANY(public.get_my_group_ids()));

CREATE POLICY "groups_insert_owner" ON public.family_groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups_update_owner" ON public.family_groups
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "groups_delete_owner" ON public.family_groups
  FOR DELETE USING (owner_id = auth.uid());

-- ── family_members ─────────────────────────────────────────
CREATE POLICY "members_select_same_group" ON public.family_members
  FOR SELECT USING (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "members_insert_self" ON public.family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "members_delete_self" ON public.family_members
  FOR DELETE USING (user_id = auth.uid());

-- ── categories ─────────────────────────────────────────────
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (
    is_default = true
    OR group_id = ANY(public.get_my_group_ids())
  );

CREATE POLICY "categories_insert_member" ON public.categories
  FOR INSERT WITH CHECK (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "categories_update_member" ON public.categories
  FOR UPDATE USING (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "categories_delete_member" ON public.categories
  FOR DELETE USING (group_id = ANY(public.get_my_group_ids()));

-- ── transactions ───────────────────────────────────────────
CREATE POLICY "transactions_select_group" ON public.transactions
  FOR SELECT USING (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "transactions_insert_member" ON public.transactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND group_id = ANY(public.get_my_group_ids())
  );

CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (user_id = auth.uid());

-- ── budgets ────────────────────────────────────────────────
CREATE POLICY "budgets_select_group" ON public.budgets
  FOR SELECT USING (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "budgets_insert_member" ON public.budgets
  FOR INSERT WITH CHECK (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "budgets_update_member" ON public.budgets
  FOR UPDATE USING (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "budgets_delete_member" ON public.budgets
  FOR DELETE USING (group_id = ANY(public.get_my_group_ids()));

-- ── ai_reports ─────────────────────────────────────────────
CREATE POLICY "reports_select_group" ON public.ai_reports
  FOR SELECT USING (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "reports_insert_member" ON public.ai_reports
  FOR INSERT WITH CHECK (group_id = ANY(public.get_my_group_ids()));

CREATE POLICY "reports_update_member" ON public.ai_reports
  FOR UPDATE USING (group_id = ANY(public.get_my_group_ids()));
