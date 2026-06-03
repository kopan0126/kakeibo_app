-- ============================================================
-- セキュリティ修正: グループ参加の招待コード検証をサーバー側に移動
--
-- 問題1: invite_code が Math.random() で生成されていた（非CSPRNG）
--        → DB の gen_random_bytes() で生成するよう DEFAULT を設定
--
-- 問題2: members_insert_self ポリシーが invite_code を検証しておらず、
--        group_id を知っているユーザーが招待コードなしで参加できた
--        → SECURITY DEFINER 関数経由でのみ参加を許可する
-- ============================================================

-- ── 1. invite_code の DEFAULT を CSPRNG に変更 ────────────────
--   gen_random_bytes(4) → 4バイト = 32ビットのランダム値
--   hex エンコード → 8文字の大文字16進数（例: "A3F2C8D1"）
--   gen_random_bytes は pgcrypto 拡張の関数。Supabase では extensions スキーマに
--   存在するため、拡張の存在を保証しスキーマ修飾して参照する。
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.family_groups
  ALTER COLUMN invite_code SET DEFAULT upper(encode(extensions.gen_random_bytes(4), 'hex'));

-- ── 2. 既存の members_insert_self を削除 ─────────────────────
DROP POLICY IF EXISTS "members_insert_self" ON public.family_members;

-- ── 3. グループオーナーのみ直接 INSERT を許可 ─────────────────
--   createGroup() でオーナーが自分自身を追加する場合にのみ使用される
--   （招待参加は join_group_by_invite 関数を経由する）
CREATE POLICY "members_insert_owner_only" ON public.family_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND group_id IN (
      SELECT id FROM public.family_groups WHERE owner_id = auth.uid()
    )
  );

-- ── 4. SECURITY DEFINER 関数: 招待コードを検証してグループに参加 ──
--   この関数は RLS をバイパスして invite_code で family_groups を検索し、
--   コードが正しい場合のみ family_members に INSERT する
--   → クライアント側から group_id を直接指定した INSERT は不可
CREATE OR REPLACE FUNCTION public.join_group_by_invite(p_invite_code TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group family_groups%ROWTYPE;
BEGIN
  -- 招待コードでグループを検索（RLS バイパス: SECURITY DEFINER）
  SELECT * INTO v_group
  FROM family_groups
  WHERE invite_code = upper(trim(p_invite_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite_code'
      USING ERRCODE = 'P0001';
  END IF;

  -- 既参加チェック
  IF EXISTS (
    SELECT 1 FROM family_members
    WHERE group_id = v_group.id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already_member:%', v_group.name
      USING ERRCODE = 'P0002';
  END IF;

  -- メンバー追加（招待コードの検証済み）
  INSERT INTO family_members (group_id, user_id, role)
  VALUES (v_group.id, auth.uid(), 'member');

  RETURN row_to_json(v_group);
END;
$$;

-- 実行権限: 認証済みユーザーのみ
GRANT EXECUTE ON FUNCTION public.join_group_by_invite(TEXT) TO authenticated;
