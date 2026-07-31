# リリースまでの残タスク（家計簿 / kakeibo-app）

最終更新: 2026-07-31 ／ 対象: **iOS 先行リリース**（Android は後回し）
アプリ識別子: `com.moriyaryoga.kakeibo` ／ ASC App ID: `6775499989`

進め方の目安：**A → B → C → D → E** の順。A と B が終わらないと E（提出）に進めない。

---

## ✅ 2026-07-31 に完了したもの

- [x] 利用規約に有料サブスクリプション条項を追加（`docs/terms-of-service.html` 第5条）
      — プラン名 / 期間 / 価格 / 自動更新 / 解約方法 / 返金 / 購入復元 / 価格改定を明記。
      旧第5条以降は1条ずつ繰り下げ済み（全14条）
- [x] プライバシーポリシーに PostHog・RevenueCat を追記（`docs/privacy-policy.html` 3-5 / 3-6）
      — 収集情報の表に「利用状況データ」「購入情報」を追加、第2条の利用目的も更新
- [x] 両ドキュメントのバンドルID表記を `com.moriya.kakeibo` → `com.moriyaryoga.kakeibo` に修正
- [x] 「アカウント削除ではサブスクは解約されない」旨を規約・ポリシー双方に明記
- [x] `eas.json` の全プロファイルに `"environment"` を明示（暗黙解決への依存を排除）
- [x] `npm run type-check` 通過（exit 0）

---

## 🔴 A. 審査ブロッカー（提出前に必須）

### ~~A-1. GitHub Pages への反映確認~~ ✅ 完了（2026-07-31）
`develop` → `main` を fast-forward マージして push。公開URLで反映を確認済み。

- [x] terms-of-service.html に第5条（有料サブスクリプション）・月額480円・第14条まで反映
- [x] privacy-policy.html に 3-5 PostHog / 3-6 RevenueCat・金額レンジの記述・バンドルID修正が反映
- [ ] アプリ内（メニュー画面・プレミアム画面）のリンクから両ページが開ける（実機で確認）

### ~~A-2. PostHog に取引金額を送っている件~~ ✅ 対応済み（2026-07-31）
`trackTransactionSaved` が取引金額を生値で PostHog に送っていた問題。
`src/services/analytics.ts` の `toAmountBucket()` でレンジに丸めてから送信するよう修正
（`amount` → `amountBucket: '1000-4999'` 等）。丸めは services 層で行うため、
呼び出し側が `amount` を渡しても生の金額は外部へ出ない。
プライバシーポリシー 3-5 の記述も実装に合わせて更新済み。

- [ ] TestFlight ビルドで PostHog に `amountBucket` が届いていることを確認（`amount` が消えていること）

### A-3. App Store Connect にサブスク商品を作成
これが無いと `purchaseMonthly()` は必ず「月額プランが見つかりません」で失敗する
（`src/services/purchases.ts:52`）。

- [ ] ASC で自動更新サブスクリプションを作成
      - 参照名 / 商品ID（例: `kakeibo_premium_monthly`）
      - サブスクリプショングループを作成
      - 価格: 月額 ¥480（規約に記載した価格と一致させること）
      - 表示名を **「プレミアムプラン（1ヶ月）」** に揃える（`PremiumScreen.tsx:13` の `PLAN_NAME`）
      - ローカライズ（日本語）の表示名・説明を入力
      - 審査用のスクリーンショットを添付（サブスク商品ごとに必須）
- [ ] RevenueCat ダッシュボードで紐付け
      - Entitlement `premium` を作成
      - Offerings: `default` → `monthly` パッケージに上記商品を割り当て
      - App Store Connect の App-Specific Shared Secret を RevenueCat に登録
- [ ] 実機で `getMonthlyPriceString()` がストア価格を返すことを確認（¥480 のハードコードにフォールバックしていない）

---

## 🟠 B. サーバー / インフラ

### B-1. Supabase マイグレーション 🚨 `db push` 禁止（重要）
2026-07-31 に `npx supabase migration list` が通るようになったが、**0001〜0016 のすべてが
`remote: ""`（リモート未記録）** だった。アプリは動作しているため、スキーマはダッシュボードの
SQL エディタから手動適用されてきたと判断される（`supabase_migrations.schema_migrations` が空）。

**⚠️ `npx supabase db push` を絶対に実行しないこと。**
CLI は全マイグレーションを未適用とみなし **0001 から流そうとする**。0001 には `DROP` / `CREATE TABLE`
が含まれるため、本番データを破壊しうる。今後もダッシュボードの SQL エディタから適用する。

同じ理由で、`migration list` の出力は適用状況の判断材料にならない。**スキーマを直接確認する。**

#### 0016（invite_code の DEFAULT）✅ 適用済み（2026-07-31）
ダッシュボードの SQL エディタで以下を実行し、エラーなく完了:

```sql
create extension if not exists pgcrypto with schema extensions;

alter table public.family_groups
  alter column invite_code set default upper(encode(extensions.gen_random_bytes(4), 'hex'));
```

pgcrypto は `extensions` スキーマに設置済みであることを確認済み。

> **⚠️ 確認方法の落とし穴（一度ここで誤判定した）**
> `information_schema.columns.column_default` は、保存された式を**現在の search_path を
> 基準に逆生成して表示**する。`extensions` が search_path にあると
> `extensions.gen_random_bytes(...)` は `gen_random_bytes(...)` と修飾なしで表示されるため、
> **この出力で修飾の有無は判定できない**。
> さらに列のDEFAULTはテキストではなく**関数OIDが解決済みのパースツリー**として保存されるので、
> DDL に書いた修飾は保存時点で消える。ALTER がエラーなく通れば適用は確定。
>
> 決定的に確認するなら参照先関数のスキーマを直接見る:
> ```sql
> select p.oid::regprocedure as func, n.nspname as schema
> from pg_attrdef d
> join pg_attribute a  on a.attrelid = d.adrelid and a.attnum = d.adnum
> join pg_depend  dep on dep.objid = d.oid and dep.classid = 'pg_attrdef'::regclass
> join pg_proc    p   on p.oid = dep.refobjid and dep.refclassid = 'pg_proc'::regclass
> join pg_namespace n on n.oid = p.pronamespace
> where d.adrelid = 'public.family_groups'::regclass and a.attname = 'invite_code';
> ```

- [ ] 実機で家族グループを新規作成できることを確認（機能面の最終裏取り）
      ※ `src/services/family.ts:23-29` の `createGroup()` は `invite_code` を渡さず
      DB の DEFAULT に完全に依存しているため、ここが壊れると招待機能が丸ごと落ちる
- [ ] （将来）マイグレーション管理を CLI に寄せるなら、既存スキーマを壊さないよう
      `schema_migrations` へ 0001〜0016 を記録済みとして手動 INSERT してから運用を切り替える

> 教訓（CLAUDE.md より）: 新カラム・新関数は**クライアントより先にDBへ適用**する。
> 適用済みマイグレーションの in-place 編集は届かないので、修正は必ず新規ファイルで。

### ~~B-2. Edge Function の再デプロイ~~ ✅ 完了（2026-07-31）
- [x] `npx supabase functions deploy delete-account`
      ※ 自前で JWT 検証しているが、多層防御のため既定（JWT 検証あり）でデプロイ
- [x] `npx supabase functions deploy claude-proxy --no-verify-jwt`
      ※ 関数内で `supabase.auth.getUser(token)` により手動検証している
- [x] secrets 確認: `ANTHROPIC_API_KEY` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` /
      `SUPABASE_ANON_KEY` すべて設定済み

> デプロイ時に `WARNING: Docker is not running` が出るが、リモートデプロイには影響しない
> （ローカル実行用の警告）。

### ~~B-3. Anthropic API の利用上限・アラート設定~~ ✅ 完了（2026-07-31）
- [x] Anthropic Console で月次の利用上限（spend limit）を設定
- [x] 利用額アラートのメール通知を有効化
- [ ] （任意・リリース後で可）レート制限を Supabase のテーブル or Upstash 等の永続ストアに移す

> `claude-proxy/index.ts:10` のレート制限はインメモリ `Map` のまま。Edge Function は
> インスタンスが複数立ちコールドスタートで揮発するため、実効的な防御にはならない。
> 現状は Console 側の上限が唯一の防波堤である、という前提を忘れないこと。

### B-4. Supabase プロジェクトの運用確認
- [ ] 無料プランの自動一時停止（inactivity pause）条件を確認。リリース後に止まると全ユーザーが使えなくなる
- [ ] 全テーブルで RLS が有効か再確認
- [ ] バックアップ設定の確認

---

## 🟡 C. コード / ビルド設定

### ~~C-1. ブランチ整理~~ ✅ 完了（2026-07-31）
- [x] `develop` の変更をコミット（`afa2b7e` / `0ab333a` / `3389110`）
- [x] `develop` → `main` を fast-forward マージし、両ブランチを push
- [x] `.gitignore` に `supabase/.temp/` を追加し、`cli-latest` を追跡解除
      （CLI 実行のたびに dirty になりブランチ切替を妨げていた）

### C-2. app.json の最終確認
- [x] `android.permissions` から `RECORD_AUDIO` を削除（2026-07-31。アプリに録音機能は無い）
- [ ] iOS `buildNumber` は現在 `"8"`。`eas.json` で `autoIncrement: true` のため二重管理に注意
- [ ] `version` `"1.0.0"` で提出するか確認

### ~~C-3. リリースビルド前チェック~~ ✅ 完了（2026-07-31）
- [x] `npm run type-check` — pass
- [x] `npm run lint` — 0 errors / 20 warnings（既存の `any`・hooks deps のみ。新規増加なし）
- [x] `npx expo-doctor` — **18/18 pass**
      ※ 当初 `expo` と `expo-updates` に patch 版ズレがあったため `npx expo install --fix` で解消
      （`expo-updates` は本番広告の判定 `Updates.channel === 'production'` の土台なので揃えた）

> リリースビルド直前にもう一度この3つを流すこと。

---

## 🟢 D. 実機検証（TestFlight + Sandbox）

Expo Go では課金も広告も検証できない。**必ず TestFlight ビルドで実施**する。

### D-1. 課金フロー
- [ ] Sandbox アカウントで購入 → 広告が消える
- [ ] アプリ削除 → 再インストール → 「購入を復元する」で復元できる
- [ ] 別端末で同じ Apple ID で復元できる
- [ ] 購入キャンセル時にエラーダイアログが出ない（`PremiumScreen.tsx` のキャンセル無視処理）
- [ ] Sandbox の自動更新（5分 = 1ヶ月）で継続課金が反映される

### D-2. アカウント削除
- [ ] メニュー → アカウント削除で `delete-account` が完走する
- [ ] 削除後に取引・カテゴリ・グループが残っていない
- [ ] 削除中にタイムアウトしない（`supabase.ts` の Edge Function 用 60秒タイムアウトで足りるか）

### D-3. 広告
- [ ] **production チャンネルのビルド**で本番広告が表示される（それ以外はテストID固定＝正しい挙動）
- [ ] バナー: ホーム / 履歴 / 分析
- [ ] リワード: レシートスキャン前。報酬前に閉じたらスキャンさせない／ロード失敗時はスキャンへ進める
- [ ] プレミアム購入後に広告が消える

### D-4. その他
- [ ] ATT ダイアログ → AdMob 初期化の順序（`App.tsx:173-188`）
- [ ] 招待リンク（`kakeibo://join/XXXX`）からのグループ参加
- [ ] レシートOCR（実レシート数枚。金額・お預かり金額の誤読チェック）
- [ ] 長時間バックグラウンド放置後の復帰（無限スピナー再発がないか）

---

## 📋 E. App Store Connect 掲載情報・提出

### E-1. App Privacy（プライバシーラベル）
プライバシーポリシーの記載と**必ず一致させる**。

- [ ] 識別子（Device ID） → **トラッキングに使用** ＝ Yes（ATT + `AD_ID` を使用）
- [ ] 使用状況データ（Product Interaction） → 分析（PostHog）
- [ ] 購入（Purchases） → アプリの機能（RevenueCat）
- [ ] 連絡先情報（メールアドレス） → アプリの機能（任意登録）
- [ ] ユーザーコンテンツ（写真 = レシート画像） → アプリの機能
- [ ] 財務情報 → **申告不要**（A-2 対応で、分析に送るのはレンジのみ。生の金額は Supabase 内に留まる）
- [ ] 「トラッキング」セクションを Yes にする（ATT を出しているため）

### E-2. 掲載情報
- [ ] スクリーンショット（6.7インチ / 6.5インチ 必須。iPad は `supportsTablet: true` なので iPad 用も必要）
- [ ] アプリ名 / サブタイトル / プロモーションテキスト / 説明文 / キーワード
- [ ] サポートURL / マーケティングURL
- [ ] 年齢制限（レーティング）— ポリシーで16歳以上としている点と整合を取る
- [ ] カテゴリ（ファイナンス）
- [ ] 審査メモ: レシートスキャンの試し方、招待リンクの試し方、匿名開始できる旨

### E-3. 広告の事務手続き
- [ ] AdMob アカウントの支払い情報を登録（未登録だと収益が保留される）
- [ ] AdMob で app-ads.txt を設定（マーケティングURLのドメイン直下に配置）

### E-4. 提出
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios --profile production`
- [ ] TestFlight で最終確認 → 審査提出

---

## 🔵 F. Android 対応（リリース後で可）

- [ ] RevenueCat の Android API キーを差し替え（`src/services/purchases.ts:12` が `goog_xxxx` のプレースホルダー）
- [ ] Google Play Console にアプリ登録・月額商品作成
- [ ] Data safety フォーム入力
- [ ] `app.json` から `RECORD_AUDIO` 権限を削除
- [ ] `android.versionCode` の運用を決める（現在 `1`）
- [ ] `eas.json` の production→android は `releaseStatus: "draft"` になっている。公開時に変更

---

## 参考: 判明している技術的な注意点

- `.env` は `.gitignore` 対象だが、**EAS の環境変数（development / production）に登録済みなので問題なし**（確認済み）
- 本番広告IDを使うのは `!__DEV__ && Updates.channel === 'production'` のときだけ
  （`AdBanner.tsx:43` / `RewardedAdModal.tsx:64`）。テスターの無効トラフィック対策として意図的
- RevenueCat / AdMob / 通知は Expo Go では動かない。`Constants.executionEnvironment` でスキップ済み
- その他のハマりどころは `CLAUDE.md` の「過去のデバッグ記録」を参照
