-- ============================================================
-- 個人モード対応: group_id をオプショナルに
-- グループなしでも収支記録・管理できるようにする
-- ============================================================

-- transactions: group_id を nullable に変更
ALTER TABLE public.transactions ALTER COLUMN group_id DROP NOT NULL;

-- budgets: group_id を nullable に変更
ALTER TABLE public.budgets ALTER COLUMN group_id DROP NOT NULL;

-- ai_reports: group_id を nullable に変更
ALTER TABLE public.ai_reports ALTER COLUMN group_id DROP NOT NULL;

-- ============================================================
-- RLS ポリシー修正
-- 既存ポリシーを削除して個人モード対応版を再作成
-- ============================================================

-- family_groups: 誰でもグループ作成可能にする（owner_id = auth.uid() チェックのみ）
DROP POLICY IF EXISTS "groups_insert_owner" ON public.family_groups;
CREATE POLICY "groups_insert_owner" ON public.family_groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- ── transactions ポリシー差し替え ──────────────────────────
DROP POLICY IF EXISTS "transactions_select_group" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_member" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;

-- 閲覧: 自分の取引 OR 同グループの取引
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (
    user_id = auth.uid()
    OR (group_id IS NOT NULL AND group_id = ANY(public.get_my_group_ids()))
  );

-- 挿入: 自分のuser_idで、個人(group_id=NULL) or 所属グループ
CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (group_id IS NULL OR group_id = ANY(public.get_my_group_ids()))
  );

-- 更新・削除: 自分の取引のみ
CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (user_id = auth.uid());

-- ── budgets ポリシー差し替え ───────────────────────────────
DROP POLICY IF EXISTS "budgets_select_group" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert_member" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update_member" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete_member" ON public.budgets;

CREATE POLICY "budgets_select" ON public.budgets
  FOR SELECT USING (
    group_id IS NULL
    OR group_id = ANY(public.get_my_group_ids())
  );

CREATE POLICY "budgets_insert" ON public.budgets
  FOR INSERT WITH CHECK (
    group_id IS NULL OR group_id = ANY(public.get_my_group_ids())
  );

CREATE POLICY "budgets_update" ON public.budgets
  FOR UPDATE USING (
    group_id IS NULL OR group_id = ANY(public.get_my_group_ids())
  );

CREATE POLICY "budgets_delete" ON public.budgets
  FOR DELETE USING (
    group_id IS NULL OR group_id = ANY(public.get_my_group_ids())
  );

-- ── ai_reports ポリシー差し替え ───────────────────────────
DROP POLICY IF EXISTS "reports_select_group" ON public.ai_reports;
DROP POLICY IF EXISTS "reports_insert_member" ON public.ai_reports;
DROP POLICY IF EXISTS "reports_update_member" ON public.ai_reports;

CREATE POLICY "reports_select" ON public.ai_reports
  FOR SELECT USING (
    group_id IS NULL
    OR group_id = ANY(public.get_my_group_ids())
  );

CREATE POLICY "reports_insert" ON public.ai_reports
  FOR INSERT WITH CHECK (
    group_id IS NULL OR group_id = ANY(public.get_my_group_ids())
  );

CREATE POLICY "reports_update" ON public.ai_reports
  FOR UPDATE USING (
    group_id IS NULL OR group_id = ANY(public.get_my_group_ids())
  );
