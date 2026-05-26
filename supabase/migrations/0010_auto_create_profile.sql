-- ============================================================
-- 新規ユーザー登録時に public.users レコードを自動作成するトリガー
-- auth.users に行が作られたら、public.users にも自動でプロフィール行を作る
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーがあれば削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- トリガー作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- users テーブルの RLS（まだなければ）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分のプロフィール + 同グループのメンバー
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (
      SELECT fm.user_id FROM public.family_members fm
      WHERE fm.group_id IN (
        SELECT group_id FROM public.family_members WHERE user_id = auth.uid()
      )
    )
  );

-- UPDATE: 自分のプロフィールのみ
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());
