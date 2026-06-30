-- ============================================================
-- 修正: invite_code の DEFAULT が参照する gen_random_bytes を
--       スキーマ修飾し、pgcrypto 拡張の存在を保証する
--
-- 0013 は gen_random_bytes(4) を無修飾で参照していたが、Supabase では
-- pgcrypto は extensions スキーマに置かれるため、ロールの search_path に
-- extensions が含まれない環境では INSERT INTO family_groups が
-- 「function gen_random_bytes(integer) does not exist」で失敗する。
--
-- 0013 を直接書き換えても適用済みの DB には再実行されないため、
-- 修正は本マイグレーション（0016）として追加する。
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.family_groups
  ALTER COLUMN invite_code SET DEFAULT upper(encode(extensions.gen_random_bytes(4), 'hex'));
