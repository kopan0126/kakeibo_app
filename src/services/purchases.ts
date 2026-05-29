import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// RevenueCat ダッシュボード (https://app.revenuecat.com) で取得したAPIキーを設定する
// iOS: App Settings > API Keys > Public app-specific keys (appl_xxx...)
// Android: App Settings > API Keys > Public app-specific keys (goog_xxx...)
export const RC_API_KEY = Platform.select({
  ios:     'appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  android: 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
}) ?? '';

// RevenueCat ダッシュボードで作成したEntitlement ID
export const ENTITLEMENT_ID = 'premium';

// App Store Connect / Google Play Console で設定する月額商品ID
// 例: kakeibo_premium_monthly
// RevenueCat ダッシュボードの Offerings > default > monthly パッケージに紐付ける

export async function initializePurchases(userId: string): Promise<void> {
  if (isExpoGo) return;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId });
}

export async function checkPremiumStatus(): Promise<boolean> {
  if (isExpoGo) return false;
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function purchaseMonthly(): Promise<boolean> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.monthly;
  if (!pkg) throw new Error('月額プランが見つかりません。しばらくしてから再試行してください。');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function getSubscriptionExpiry(): Promise<string | null> {
  const customerInfo = await Purchases.getCustomerInfo();
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  return entitlement?.expirationDate ?? null;
}
