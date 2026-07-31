import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { purchaseMonthly, restorePurchases, getMonthlyPriceString } from '../services/purchases';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../utils/links';
import { AI } from '../theme/aizome';

// サブスクリプション名は App Store Connect / Google Play の商品表示名と揃える
const PLAN_NAME = 'プレミアムプラン（1ヶ月）';
const STORE_NAME = Platform.select({ ios: 'App Store', android: 'Google Play' }) ?? 'ストア';
const ACCOUNT_NAME = Platform.select({ ios: 'Apple ID', android: 'Google アカウント' }) ?? 'アカウント';

export default function PremiumScreen() {
  const { isPremium, setPremium } = useAuthStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  // ストア設定の価格を正とする。取得できない環境のみ既定表示にフォールバック
  const [priceString, setPriceString] = useState('¥480');

  useEffect(() => {
    let mounted = true;
    getMonthlyPriceString().then((price) => {
      if (mounted && price) setPriceString(price);
    });
    return () => { mounted = false; };
  }, []);

  async function handlePurchase() {
    setIsPurchasing(true);
    try {
      const success = await purchaseMonthly();
      if (success) {
        setPremium(true);
        Alert.alert('登録完了', 'プレミアムプランへようこそ！広告が非表示になりました。');
      } else {
        Alert.alert(
          '確認できませんでした',
          '購入処理は完了しましたが、プランの有効化を確認できませんでした。「購入を復元する」をお試しください。',
        );
      }
    } catch (e: any) {
      // ユーザーが購入をキャンセルした場合は無視
      if (!e?.userCancelled) {
        Alert.alert('エラー', e?.message ?? '購入処理に失敗しました。');
      }
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleRestore() {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        setPremium(true);
        Alert.alert('復元完了', 'プレミアムプランが復元されました。');
      } else {
        Alert.alert('復元結果', '有効なサブスクリプションが見つかりませんでした。');
      }
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? '復元に失敗しました。');
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isPremium ? '★ プレミアムプラン' : 'プレミアムプラン'}
            </Text>
            <View style={[styles.badge, isPremium && styles.badgeActive]}>
              <Text style={[styles.badgeText, isPremium && styles.badgeTextActive]}>
                {isPremium ? '有効' : '無料'}
              </Text>
            </View>
          </View>

          {isPremium ? (
            <>
              <Text style={styles.desc}>
                すべての広告が非表示になっています{'\n'}
                ・レシートスキャンの広告をスキップ{'\n'}
                ・バナー広告を非表示
              </Text>
              <Text style={styles.manageHint}>
                解約はApp Store / Google Playのサブスクリプション管理から行えます
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.planName}>{PLAN_NAME}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{priceString}</Text>
                <Text style={styles.pricePer}> / 月（税込・自動更新）</Text>
              </View>
              <Text style={styles.desc}>
                ・レシートスキャンの広告をスキップ{'\n'}
                ・バナー広告を非表示{'\n'}
                ・いつでも解約可能
              </Text>
              <TouchableOpacity
                style={[styles.upgradeBtn, isPurchasing && { opacity: 0.6 }]}
                onPress={handlePurchase}
                disabled={isPurchasing}
              >
                {isPurchasing
                  ? <ActivityIndicator color={AI.brass} />
                  : <Text style={styles.upgradeText}>プレミアムプランに登録する →</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.restoreBtn, isRestoring && { opacity: 0.6 }]}
                onPress={handleRestore}
                disabled={isRestoring}
              >
                {isRestoring
                  ? <ActivityIndicator color={AI.textSoft} size="small" />
                  : <Text style={styles.restoreText}>購入を復元する</Text>}
              </TouchableOpacity>

              {/* 自動更新サブスクの必須開示事項（App Store Guideline 3.1.2 / Google Play） */}
              <Text style={styles.terms}>
                ・お支払いは購入確定時に{ACCOUNT_NAME}に請求されます{'\n'}
                ・期間終了の24時間以上前に自動更新をオフにしない限り、同額・同期間で自動更新されます{'\n'}
                ・更新料金は期間終了前の24時間以内に請求されます{'\n'}
                ・登録後は{STORE_NAME}のアカウント設定からいつでも管理・解約できます
              </Text>
            </>
          )}
        </View>

        {/* 課金画面から利用規約（EULA）とプライバシーポリシーへ到達できるようにする */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
            <Text style={styles.legalLink}>利用規約</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>・</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.legalLink}>プライバシーポリシー</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  content: { padding: 24 },

  section: {
    backgroundColor: AI.washi2, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: AI.rule,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: AI.indigo },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: AI.washi, borderWidth: 1, borderColor: AI.rule,
  },
  badgeActive: { backgroundColor: AI.brass, borderColor: AI.brass },
  badgeText: { fontSize: 12, color: AI.textSoft, fontWeight: '600' },
  badgeTextActive: { color: AI.indigo },
  desc: { fontSize: 13, color: AI.textSoft, lineHeight: 20, marginBottom: 16 },
  planName: { fontSize: 14, fontWeight: '600', color: AI.text, marginBottom: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  price: { fontSize: 32, fontWeight: 'bold', color: AI.indigo },
  pricePer: { fontSize: 14, color: AI.textSoft },
  upgradeBtn: {
    backgroundColor: AI.indigo, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  upgradeText: { color: AI.brass, fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
  restoreBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  restoreText: { color: AI.textSoft, fontSize: 13 },
  manageHint: {
    fontSize: 12, color: AI.textSoft, lineHeight: 18,
    backgroundColor: AI.washi, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: AI.rule, marginTop: 4,
  },
  terms: {
    fontSize: 11, color: AI.textSoft, lineHeight: 17, marginTop: 12,
  },
  legalRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 16,
  },
  legalLink: {
    fontSize: 12, color: AI.textSoft, textDecorationLine: 'underline',
  },
  legalSep: { fontSize: 12, color: AI.textSoft, marginHorizontal: 8 },
});
