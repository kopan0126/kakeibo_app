-- ============================================================
-- 同グループメンバーのプロフィール取得を SECURITY DEFINER 関数に集約
--
-- 問題: 履歴/暦のグループ表示で「記入者」を出す際、相手の users 行を
--       直接 SELECT していたが、users_select_same_group RLS の適用状態に
--       依存して相手のプロフィールが取れず「?」になるケースがあった。
-- 対策: RLS をバイパスしつつ、呼び出し元と同じグループのメンバー（＋自分）
--       に限定してプロフィールを返す関数を用意する。
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_member_profiles(p_user_ids uuid[])
RETURNS TABLE (id uuid, display_name text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.id, u.display_name, u.avatar_url
  FROM public.users u
  WHERE u.id = ANY(p_user_ids)
    AND (
      u.id = auth.uid()
      OR u.id IN (
        SELECT fm.user_id
        FROM public.family_members fm
        WHERE fm.group_id = ANY(public.get_my_group_ids())
      )
    )
$$;

-- 認証済みユーザーのみ実行可能
GRANT EXECUTE ON FUNCTION public.get_member_profiles(uuid[]) TO authenticated;
