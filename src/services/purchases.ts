import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// RevenueCat ダッシュボード (https://app.revenuecat.com) で取得したAPIキーを設定する
// iOS: App Settings > API Keys > Public app-specific keys (appl_xxx...)
// Android: App Settings > API Keys > Public app-specific keys (goog_xxx...)
export const RC_API_KEY = Platform.select({
  ios:     'appl_xVkqsdQwoEtDJsLBMLCoHdfgJWP',
  android: 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
}) ?? '';

// APIキーが未設定（プレースホルダー = 'xxxx' を含む / 空）かどうか。
// 無効キーで configure すると以降の getCustomerInfo / purchase 等が必ず失敗するため、
// その環境（現状は Android）ではプレミアム判定を安全に「非プレミアム」へフォールバックさせる。
const isPlaceholderKey = !RC_API_KEY || RC_API_KEY.includes('xxxx');

// RevenueCat ダッシュボードで作成したEntitlement ID
export const ENTITLEMENT_ID = 'premium';

// App Store Connect / Google Play Console で設定する月額商品ID
// 例: kakeibo_premium_monthly
// RevenueCat ダッシュボードの Offerings > default > monthly パッケージに紐付ける

export async function initializePurchases(userId: string): Promise<void> {
  if (isExpoGo) return;
  if (isPlaceholderKey) {
    // APIキー未設定の環境では configure しない（無効キーでの初期化を避ける）
    console.warn('RevenueCat: APIキーが未設定のため初期化をスキップします');
    return;
  }
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId });
}

export async function checkPremiumStatus(): Promise<boolean> {
  if (isExpoGo || isPlaceholderKey) return false;
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

// Expo Go ではネイティブモジュールが無く、実キーでも configure されないまま
// Purchases.* を呼ぶと意味不明なネイティブエラーになるため、ここでも必ず弾く
const isUnavailable = isExpoGo || isPlaceholderKey;

export async function purchaseMonthly(): Promise<boolean> {
  if (isUnavailable) throw new Error('課金は現在この環境では利用できません。');
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.monthly;
  if (!pkg) throw new Error('月額プランが見つかりません。しばらくしてから再試行してください。');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function restorePurchases(): Promise<boolean> {
  if (isUnavailable) throw new Error('課金は現在この環境では利用できません。');
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function getSubscriptionExpiry(): Promise<string | null> {
  if (isUnavailable) return null;
  const customerInfo = await Purchases.getCustomerInfo();
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  return entitlement?.expirationDate ?? null;
}

/** ストア側で設定された月額価格の表示文字列（例: "¥480"）。取得できない環境では null */
export async function getMonthlyPriceString(): Promise<string | null> {
  if (isUnavailable) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.monthly?.product.priceString ?? null;
  } catch {
    return null;
  }
}
