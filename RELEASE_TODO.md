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

### A-1. GitHub Pages への反映確認
規約・ポリシーを更新したので、**公開URLに反映されたか必ず目視確認**する。
GitHub Pages は反映に数分かかる。キャッシュに注意。

- [ ] https://kopan0126.github.io/kakeibo_app/terms-of-service.html に第5条（有料サブスクリプション）が表示される
- [ ] https://kopan0126.github.io/kakeibo_app/privacy-policy.html に 3-5 PostHog / 3-6 RevenueCat が表示される
- [ ] アプリ内（メニュー画面・プレミアム画面）のリンクから両ページが開ける

> 注: `docs/` は `main` ブランチから配信されている想定。現在の作業ブランチは `develop` なので、
> **main へマージ（または docs のみ push）しないと公開ページは古いまま**。ここは見落としやすい。

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

### B-1. Supabase マイグレーション 0016 の本番適用確認 ⚠️未確認
`npx supabase migration list` が DB 接続タイムアウトで失敗し、**適用状況を確認できていない**。

- [ ] `npx supabase migration list` が通る状態にする（ネットワーク / プロジェクト稼働状況を確認）
- [ ] `0016_fix_invite_code_default.sql` が本番に適用済みか確認、未適用なら `npx supabase db push`

> 教訓（CLAUDE.md より）: 新カラム・新関数は**クライアントより先にDBへ適用**する。
> 適用済みマイグレーションの in-place 編集は届かないので、修正は必ず新規ファイルで。

### B-2. Edge Function の再デプロイ
`supabase/functions/delete-account/index.ts` をローカルで変更済み。デプロイ済みのものは古い可能性が高い。

- [ ] `npx supabase functions deploy delete-account`
- [ ] `npx supabase functions deploy claude-proxy --no-verify-jwt`
- [ ] `npx supabase secrets list` で `ANTHROPIC_API_KEY` が設定済みか確認

### B-3. Anthropic API の利用上限・アラート設定 🔴重要
`supabase/functions/claude-proxy/index.ts:10` のレート制限は **インメモリ `Map`**。
Edge Function はインスタンスが複数立ち、コールドスタートで揮発するため、実効的な防御にはならない。
**課金事故を止める最後の砦は Anthropic Console 側の設定**。

- [ ] Anthropic Console で月次の利用上限（spend limit）を設定
- [ ] 利用額アラートのメール通知を有効化
- [ ] （任意）レート制限を Supabase のテーブル or Upstash 等の永続ストアに移す検討

### B-4. Supabase プロジェクトの運用確認
- [ ] 無料プランの自動一時停止（inactivity pause）条件を確認。リリース後に止まると全ユーザーが使えなくなる
- [ ] 全テーブルで RLS が有効か再確認
- [ ] バックアップ設定の確認

---

## 🟡 C. コード / ビルド設定

### C-1. ブランチ整理
- [ ] `develop` の変更をコミット
- [ ] `develop` → `main` へマージ（`docs/` の公開反映も兼ねる）

### C-2. app.json の最終確認
- [ ] `android.permissions` から `RECORD_AUDIO` を削除（**Android 対応時**。使っていない権限）
- [ ] iOS `buildNumber` は現在 `"8"`。`eas.json` で `autoIncrement: true` のため二重管理に注意
- [ ] `version` `"1.0.0"` で提出するか確認

### C-3. リリースビルド前チェック
- [ ] `npm run type-check`（現在 pass）
- [ ] `npm run lint`
- [ ] `npx expo-doctor`

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
