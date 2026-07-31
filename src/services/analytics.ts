import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export const posthog = new PostHog(POSTHOG_KEY, {
  host: POSTHOG_HOST,
  disabled: !POSTHOG_KEY,
  captureAppLifecycleEvents: false,
});

// ─── Screen tracking ──────────────────────────────────────────

export function trackScreen(screenName: string) {
  posthog.screen(screenName);
}

// ─── Transaction events ───────────────────────────────────────

// 金額をそのまま外部の分析基盤へ送ると、App Privacy 上「財務情報」の収集にあたり、
// 家計簿アプリとしてユーザーの期待からも外れる。分布の把握には十分なレンジに丸めて送る。
// 丸めは services 層で行い、生の金額が analytics の外へ出ないようにする。
const AMOUNT_BUCKETS: readonly { max: number; label: string }[] = [
  { max: 1000, label: '<1000' },
  { max: 5000, label: '1000-4999' },
  { max: 10000, label: '5000-9999' },
  { max: 50000, label: '10000-49999' },
  { max: 100000, label: '50000-99999' },
];

export function toAmountBucket(amount: number): string {
  if (!Number.isFinite(amount)) return 'unknown';
  const abs = Math.abs(amount);
  return AMOUNT_BUCKETS.find((b) => abs < b.max)?.label ?? '100000+';
}

export function trackTransactionSaved(props: {
  type: 'expense' | 'income';
  amount: number;
  hasCategory: boolean;
  hasMemo: boolean;
  isGroupTransaction: boolean;
}) {
  const { amount, ...rest } = props;
  posthog.capture('transaction_saved', { ...rest, amountBucket: toAmountBucket(amount) });
}

// ─── Receipt OCR events ───────────────────────────────────────

export function trackReceiptScanStarted() {
  posthog.capture('receipt_scan_started');
}

export function trackReceiptConfirmed(props: { itemCount: number }) {
  posthog.capture('receipt_confirmed', props);
}

export function trackReceiptDiscarded() {
  posthog.capture('receipt_discarded');
}

// ─── Report screen events ─────────────────────────────────────

export function trackReportTabChanged(tab: 'trend' | 'category') {
  posthog.capture('report_tab_changed', { tab });
}

export function trackReportPeriodChanged(period: string) {
  posthog.capture('report_period_changed', { period });
}

// ─── Feature usage events ─────────────────────────────────────

export function trackGroupCreated() {
  posthog.capture('group_created');
}

export function trackGroupJoined() {
  posthog.capture('group_joined');
}

export function trackScopeChanged(scope: 'personal' | 'group') {
  posthog.capture('scope_changed', { scope });
}

export function trackCategoryCreated(props: { iconType: 'emoji' | 'image' }) {
  posthog.capture('category_created', props);
}
