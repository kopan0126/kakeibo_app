-- ============================================================
-- 家計簿アプリ 初期スキーマ
-- ============================================================

-- --------------------------------------------------------
-- users（Supabase auth.usersを拡張するプロフィールテーブル）
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- family_groups（家族グループ）
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- family_members（グループメンバー）
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- --------------------------------------------------------
-- categories（カテゴリ）
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#9E9E9E',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- transactions（収支レコード）
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  memo TEXT NOT NULL DEFAULT '',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- budgets（月次予算）
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  month TEXT NOT NULL,  -- YYYY-MM 形式
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, category_id, month)
);

-- --------------------------------------------------------
-- ai_reports（AIレポート保存）
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  period_key TEXT NOT NULL,  -- YYYY-MM-DD / YYYY-WXX / YYYY-MM
  content TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, report_type, period_key)
);

-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_group_date
  ON public.transactions(group_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user
  ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user
  ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_group_month
  ON public.budgets(group_id, month);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- ── users ──────────────────────────────────────────────────
-- 自分のプロフィールのみ閲覧・編集可能
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 同じグループのメンバーのプロフィールも閲覧可能
CREATE POLICY "users_select_same_group" ON public.users
  FOR SELECT USING (
    id IN (
      SELECT fm.user_id FROM public.family_members fm
      WHERE fm.group_id IN (
        SELECT group_id FROM public.family_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ── family_groups ──────────────────────────────────────────
CREATE POLICY "groups_select_member" ON public.family_groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "groups_insert_owner" ON public.family_groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups_update_owner" ON public.family_groups
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "groups_delete_owner" ON public.family_groups
  FOR DELETE USING (owner_id = auth.uid());

-- ── family_members ─────────────────────────────────────────
CREATE POLICY "members_select_same_group" ON public.family_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_self" ON public.family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "members_delete_self" ON public.family_members
  FOR DELETE USING (user_id = auth.uid());

-- ── categories ─────────────────────────────────────────────
-- デフォルトカテゴリは全員閲覧可能、グループカテゴリは同グループのみ
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (
    is_default = true
    OR group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "categories_insert_member" ON public.categories
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "categories_update_member" ON public.categories
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "categories_delete_member" ON public.categories
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- ── transactions ───────────────────────────────────────────
CREATE POLICY "transactions_select_group" ON public.transactions
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "transactions_insert_member" ON public.transactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (user_id = auth.uid());

-- ── budgets ────────────────────────────────────────────────
CREATE POLICY "budgets_select_group" ON public.budgets
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "budgets_insert_member" ON public.budgets
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "budgets_update_member" ON public.budgets
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "budgets_delete_member" ON public.budgets
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- ── ai_reports ─────────────────────────────────────────────
CREATE POLICY "reports_select_group" ON public.ai_reports
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "reports_insert_member" ON public.ai_reports
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "reports_update_member" ON public.ai_reports
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- ユーザー登録時にプロフィールを自動作成するトリガー
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
