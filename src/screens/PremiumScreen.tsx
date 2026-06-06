import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { purchaseMonthly, restorePurchases } from '../services/purchases';
import { AI } from '../theme/aizome';

export default function PremiumScreen() {
  const { isPremium, setPremium } = useAuthStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  async function handlePurchase() {
    setIsPurchasing(true);
    try {
      const success = await purchaseMonthly();
      if (success) {
        setPremium(true);
        Alert.alert('登録完了', 'プレミアムプランへようこそ！広告が非表示になりました。');
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
              <View style={styles.priceRow}>
                <Text style={styles.price}>¥480</Text>
                <Text style={styles.pricePer}> / 月（税込）</Text>
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
            </>
          )}
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
});
