// Supabase Edge Function: delete-account
// 認証済みユーザーのすべてのデータを削除してアカウントを抹消する

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. リクエストユーザーを JWT で認証
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // anon key クライアント（ユーザー認証用）
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // 2. service_role クライアント（管理者権限で削除）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 3. ユーザーデータを順番に削除（外部キー制約に従って逆順）

    // 3-1. 取引履歴
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('user_id', userId);
    if (txError) throw new Error(`transactions: ${txError.message}`);

    // 3-2. 予算
    const { error: budgetError } = await supabaseAdmin
      .from('budgets')
      .delete()
      .eq('user_id', userId);
    if (budgetError) throw new Error(`budgets: ${budgetError.message}`);

    // 3-3. AI レポート
    const { error: reportError } = await supabaseAdmin
      .from('ai_reports')
      .delete()
      .eq('user_id', userId);
    if (reportError) throw new Error(`ai_reports: ${reportError.message}`);

    // 3-4. カスタムカテゴリ
    const { error: catError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('user_id', userId);
    if (catError) throw new Error(`categories: ${catError.message}`);

    // 3-5. 家族グループのオーナー確認 → オーナーなら他メンバーを除いてグループ削除
    const { data: ownedGroups } = await supabaseAdmin
      .from('family_groups')
      .select('id')
      .eq('owner_id', userId);

    if (ownedGroups && ownedGroups.length > 0) {
      for (const group of ownedGroups) {
        // グループメンバーを全員削除
        await supabaseAdmin
          .from('family_members')
          .delete()
          .eq('group_id', group.id);
        // グループ自体を削除
        await supabaseAdmin
          .from('family_groups')
          .delete()
          .eq('id', group.id);
      }
    }

    // 3-6. 所属グループから退出
    const { error: memberError } = await supabaseAdmin
      .from('family_members')
      .delete()
      .eq('user_id', userId);
    if (memberError) throw new Error(`family_members: ${memberError.message}`);

    // 3-7. プロフィール（users テーブル）
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    if (profileError) throw new Error(`users: ${profileError.message}`);

    // 4. Auth ユーザーを削除（最後に行う）
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw new Error(`auth.deleteUser: ${deleteAuthError.message}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('delete-account error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
