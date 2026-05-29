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

export function trackTransactionSaved(props: {
  type: 'expense' | 'income';
  amount: number;
  hasCategory: boolean;
  hasMemo: boolean;
  isGroupTransaction: boolean;
}) {
  posthog.capture('transaction_saved', props);
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
