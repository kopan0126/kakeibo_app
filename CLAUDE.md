# 家計簿アプリ（kakeibo-app）

## プロジェクト概要
iPhone/Android両対応の家計簿アプリ。家族で収支を共有し、SVGチャートで支出推移・カテゴリ分析を可視化する。
デザインテーマは「藍染（Aizome）」— 深藍色（indigo）× 和紙クリーム（washi）× 真鍮（brass）の統一パレット。

## 技術スタック
- Frontend: React Native + Expo SDK 54 + TypeScript
- State管理: Zustand
- バックエンド/DB: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- AI: Claude API via Supabase Edge Function（APIキーはサーバー側で管理）
  - レシートOCR: claude-haiku-4-5-20251001
- チャート: react-native-svg（手描きSVGドーナツ・折れ線グラフ）
- カレンダー: react-native-calendars
- 通知: Expo Notifications（Expo Goでは無効化）
- 画像処理: expo-image-manipulator（リサイズ・圧縮）
- 課金: react-native-purchases（RevenueCat — プレミアム判定）
- 分析: posthog-react-native（画面遷移・イベント計測）
- 広告: react-native-google-mobile-ads（プレースホルダー実装中）

## デザインテーマ: 藍染（Aizome）
テーマカラーは `src/theme/aizome.ts` で一元管理：
- `indigo: '#15243F'` — 主要背景・テキスト
- `indigo2: '#1f3358'` — 紺青
- `indigoSoft: '#384d75'` — タブ非活性など
- `washi: '#F1E8D3'` — 画面背景
- `washi2: '#E8DCC0'` — カード背景
- `ink: '#0E1729'` — 最暗色
- `text: '#15243F'` — テキスト（= indigo）
- `textSoft: '#5a6378'` — 補助テキスト
- `brass: '#C9A55C'` — アクセント・アクティブ状態
- `brassSoft: '#D9BC85'` — サブアクセント
- `rule: '#cdb98e'` — ボーダー
- `income: '#384d75'` — 収入表示色
- `expense: '#a44231'` — 支出表示色（赤褐色）
- `danger: '#c05050'` — 警告・削除

共通UIルール：
- ボタン: indigo背景 + brass文字
- カードUI: washi2背景 + rule罫線（影なし）
- アイコン: borderRadius: 8（角丸正方形）
- ヒーローカード: indigo背景 + AsanohaBg（麻の葉文様SVGオーバーレイ）

## ディレクトリ構成
```
src/
  screens/      # 画面コンポーネント（11画面 + MainPlaceholder※未使用）
  components/   # 共通UI（ScopeSelector, CategoryIcon, AsanohaBg, AdBanner, RewardedAdModal）
  hooks/        # useTransactionFilter（ファイル名: useActiveGroupId.ts）
  stores/       # Zustand ストア（authStore, transactionStore, groupStore, viewStore）
  services/
    claudeApi.ts    # Claude API共通ヘルパー（Edge Function経由のみ）
    receiptOcr.ts   # レシート画像解析
    supabase.ts     # Supabaseクライアント
    transactions.ts # 取引CRUD + カテゴリ管理
    auth.ts         # 認証（匿名 + メール昇格）
    family.ts       # グループ作成・参加・メンバー管理
    purchases.ts    # RevenueCat（IAP / プレミアム判定）
    analytics.ts    # PostHog（画面追跡・イベント計測）
    notification.ts # プッシュ通知
  theme/        # 藍染テーマ定義
  types/        # TypeScript型定義
  utils/        # 日付・金額フォーマット、カテゴリマッピング
supabase/
  migrations/   # SQLマイグレーション（0001〜0010）
  functions/
    claude-proxy/ # Claude API中継（認証・レート制限付き）
    _shared/      # CORS設定など共通モジュール
  seeds/        # シードデータ
```

## 主なコマンド
- 起動: `npx expo start --lan --clear`（環境変数変更時は --clear 必須）
- Android: `npm run android`
- iOS: `npm run ios`
- 型チェック: `npm run type-check` または `npx tsc --noEmit`
- Lint: `npm run lint`
- Edge Function デプロイ: `npx supabase functions deploy claude-proxy --no-verify-jwt`
- Supabase Secrets 設定: `npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

## コーディング規約
- TypeScriptのanyは原則禁止。型は必ず明示する
- コンポーネントはfunctional componentのみ（classは不可）
- Supabaseクエリはservices/層にのみ書く。画面に直接書かない
- 金額はすべて円（整数）で扱い、表示時のみ円換算する（例: 1000 = ¥1,000）
- 日付はISO8601文字列で保持し、date-fnsで操作する
- 色は直接ハードコードせず `AI.*` テーマ定数を使う（`#F5F7FA`, `#4CAF50` 等の旧色は禁止）

## デバッグ記録の運用ルール
Claudeは作業中に遭遇したバグ・エラーとその解決過程を「過去のデバッグ記録」セクションに追記すること。
- **記録タイミング**: 原因特定に試行錯誤を要したバグ、または再発しやすいパターンを解決した直後
- **記録フォーマット**: `症状の要約 → 解決策`（1行で簡潔に）
- **作業開始時**: 必ず「過去のデバッグ記録」セクションを参照し、同じ問題を繰り返さない
- **蓄積の価値**: この記録はセッションをまたいで保持される。過去の自分が残した知見を信頼し、活用すること

## 重要な注意事項
- APIキーは Supabase Edge Function の環境変数（secrets）で管理する。クライアントに露出させない
- `EXPO_PUBLIC_` プレフィックスの環境変数はビルドに埋め込まれるため、秘密キーには絶対使わない
- Supabaseのanon keyはクライアントに公開可能だが、service roleキーは絶対に公開しない
- Row Level Security (RLS)は必ず有効にする
- Expo Goでは広告SDK / 通知は動作しない。Constants.executionEnvironment でスキップする

## 過去のデバッグ記録（繰り返し防止）
- `EXPO_PUBLIC_` プレフィックスの環境変数はビルドに埋め込まれるため、APIキーには使わない
- `anthropic-dangerous-direct-browser-access` ヘッダーはEdge Function経由なら不要
- `CREATE TABLE IF NOT EXISTS` は既存テーブルがあると何もしない → スキーマ変更は DROP + CREATE が必要
- expo-image-manipulator の npm install で ERESOLVE エラー → `--legacy-peer-deps` で解決
- 環境変数やサービスファイルの変更後は `npx expo start --lan --clear` で再起動必須
- Expo Metro bundler のデフォルトポート 8081 が競合する場合は `-- --port 8082` で回避
- StyleSheet.create でキー名が重複すると後勝ちで上書きされる（例: `input` が2つ → 片方を `fieldInput` にリネーム）
- SVGドーナツで360°の arc は始点=終点となりパスが消える → `Math.min(span, 359.99)` でクランプ
- react-native-svg の strokeDasharray は配列 `[2, 2]` または文字列 `"2,2"` どちらでも可
- iOS の `<Modal>` 閉じ中に ImagePicker を起動すると開かない → Modal を閉じずにピッカーを起動し、完了後に閉じる
- posthog-react-native v4 が `@posthog/core/surveys` 等のサブパスを使う → metro.config.js に手動リゾルバーを追加（unstable_enablePackageExports=false のため）
- RevenueCat は Expo Go で動作しない → `Constants.executionEnvironment === 'storeClient'` でスキップ
- receiptOcr の max_tokens: 512 では商品数が多いレシートで JSON が途中切れ → 2048 に設定

## 認証フロー
- 初回起動: 匿名サインイン（Supabase Anonymous Auth）→ すぐにアプリを使い始められる
- メール登録: ProfileScreen からオプションで登録（`linkEmail()` でアカウント昇格）
- データ引き継ぎ: 匿名→メール登録後もデータは維持される

## 設計メモ

### ナビゲーション（5タブ + スタック画面）
タブは漢字アイコンで表示（KanjiIcon コンポーネント）：
1. 家（ホーム） — HomeScreen
2. 暦（暦） — CalendarScreen
3. 記（記入） — AddTransactionScreen（真鍮アクセント、中央に大きめ配置）
4. 歴（履歴） — TransactionListScreen
5. 析（分析） — ReportScreen

スタック画面: ReceiptScan, ReceiptConfirm, Family, CategoryManage, Profile

### 入力・表示スコープ
- 入力は常に個人（user_id）に紐付ける。AddTransactionScreenにグループ選択なし
- 表示スコープ（個人/グループ）は stores/viewStore.ts の selectedScope で管理
- ScopeSelector コンポーネントはホーム・履歴・カレンダー・レポートで共通利用

### カテゴリ管理
- デフォルトカテゴリ（is_default=true）は編集不可
- カスタムカテゴリ（is_default=false, user_id付き）はユーザーが作成・編集・削除可能
- アイコンは絵文字 or 写真（data:image/jpeg;base64形式、80x80にリサイズ）
- CategoryIcon コンポーネントで絵文字/画像を自動判別して表示

### 課金（RevenueCat）
- authStore.isPremium でプレミアム状態を管理
- プレミアムユーザーには広告を非表示（AdBanner）
- API Key はプレースホルダー（`appl_xxx` / `goog_xxx`）— ストア申請前に差し替え

### 分析（PostHog）
- PostHogProvider は使わない（iOS Modal競合のため）。posthog クライアントを直接利用
- services/analytics.ts で型付きイベント関数を一元管理
- App.tsx の NavigationContainer onStateChange で画面遷移を手動追跡
- `EXPO_PUBLIC_POSTHOG_KEY` で制御（未設定時は disabled）

## Feature: 分析チャート（ReportScreen）

### カテゴリ分析タブ
- 期間タブ: 今週 / 今月 / 3ヶ月
- SVGドーナツチャート: arcPath()ヘルパー、rOuter/rInner で太さ制御
- パレット: brass系7色 `[AI.brass, '#D9BC85', '#A8845A', '#8a9d6a', '#7e8aa3', '#5a6b87', '#384d75']`
- ランキングリスト: 連番 + 色付き正方形 + カテゴリ名 + 金額 + パーセンテージ

### 支出推移タブ
- 月切り替え（← →）
- 累計折れ線チャート: 今月（brass実線 + 面積塗り）vs 前月（半透明破線）
- 統計行: 日平均 / 最大日 / 記録日
- ペース予測カード: 月末予測金額を表示

### 技術詳細
- react-native-svg で手描き（ライブラリ依存なし）
- viewBox="0 0 264 130" + width="100%" でレスポンシブ
- buildDailyExpense() で日別支出配列を構築 → 累積和で折れ線データ化

## Feature: OCR（レシート解析）
- 解析エンジン: Claude Vision API（claude-haiku-4-5-20251001）
- 呼び出し経路: receiptOcr.ts → callClaudeViaEdge() → Supabase Edge Function
- 画像前処理: 800px幅にリサイズ、JPEG圧縮0.5（コスト削減）
- 全自動保存は禁止。必ず ReceiptConfirmScreen を経由させる
- 解析結果のJSONパース失敗時はnullを返し、アプリをクラッシュさせない
- 画像はBase64でEdge Functionに送信。ファイル保存は行わない（プライバシー）

## 公開準備ステータス
- [x] APIキーのサーバー移行（Edge Function）
- [x] 藍染デザインテーマの全画面適用
- [x] 匿名認証 → メール登録の段階的オンボーディング
- [x] PostHog 分析基盤の統合
- [x] RevenueCat 課金基盤の統合（APIキーはプレースホルダー）
- [x] アプリ識別子の設定（com.moriya.kakeibo）
- [x] スプラッシュ画面の背景色を藍染テーマに統一
- [x] アプリアイコンのオリジナルデザイン（generate_icons.py で生成、藍染テーマ統一）
- [ ] AdBanner の実装（AdMob SDK 接続 — 現在プレースホルダー）
- [ ] RevenueCat APIキーの本番設定
- [ ] プライバシーポリシー・利用規約
- [ ] Apple Developer Account 登録
- [ ] EAS Build → ストア申請
