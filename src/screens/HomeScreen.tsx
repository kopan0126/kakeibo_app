import { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useTransactionFilter } from '../hooks/useActiveGroupId';
import { getTransactionsByMonth, getCategories } from '../services/transactions';
import { formatCurrency, formatDate, formatMonth, getMonthRange, prevMonth, nextMonth } from '../utils/format';
import ScopeSelector from '../components/ScopeSelector';
import CategoryIcon, { isImageIcon } from '../components/CategoryIcon';
import AdBanner from '../components/AdBanner';
import AsanohaBg from '../components/AsanohaBg';
import { AI } from '../theme/aizome';
import { signOut } from '../services/auth';
import type { Transaction, Category } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, setUser } = useAuthStore();
  const filter = useTransactionFilter();
  const {
    transactions, categories, currentMonth, isLoading,
    setTransactions, setCategories, setCurrentMonth, setLoading,
  } = useTransactionStore();
  const [showAccount, setShowAccount] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { from, to } = getMonthRange(currentMonth);
      const [txs, cats] = await Promise.all([
        getTransactionsByMonth(user.id, from, to, filter.showPersonal, filter.groupId),
        categories.length === 0 ? getCategories() : Promise.resolve(categories),
      ]);
      setTransactions(txs);
      if (categories.length === 0) setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, filter.showPersonal, filter.groupId, currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const income = transactions
    .filter((t) => getCategoryType(t, categories) === 'income')
    .reduce((s, t) => s + t.amount_cents, 0);

  const expense = transactions
    .filter((t) => getCategoryType(t, categories) === 'expense')
    .reduce((s, t) => s + t.amount_cents, 0);

  const balance = income - expense;
  const pieData = buildPieData(transactions, categories);
  const recent = transactions.slice(0, 5);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setShowAccount(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家計簿</Text>
        <TouchableOpacity style={styles.accountBtn} onPress={() => setShowAccount(true)}>
          <Text style={styles.accountIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 月切り替え */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => setCurrentMonth(prevMonth(currentMonth))}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonth(currentMonth)}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(nextMonth(currentMonth))}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 収支サマリーカード（深藍 × 麻の葉） */}
        <View style={styles.heroCard}>
          <AsanohaBg opacity={0.5} />
          <View style={styles.heroContent}>
            <Text style={styles.heroSubLabel}>今月の収支</Text>
            <View style={styles.heroBalanceRow}>
              <Text style={styles.heroCurrency}>¥</Text>
              <Text style={[styles.heroBalance, { color: balance >= 0 ? AI.washi : '#e07070' }]}>
                {Math.abs(balance).toLocaleString()}
              </Text>
            </View>
            {/* プログレスバー */}
            {income > 0 && (
              <>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${Math.min((expense / income) * 100, 100)}%` }]} />
                </View>
                <View style={styles.heroSubRow}>
                  <Text style={styles.heroSubText}>支 {formatCurrency(expense)}</Text>
                  <Text style={styles.heroSubText}>収 {formatCurrency(income)}</Text>
                </View>
              </>
            )}
            {/* 収入・支出 */}
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>収 入</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(income)}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>支 出</Text>
                <Text style={[styles.heroStatValue, { color: '#e07070' }]}>{formatCurrency(expense)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* スコープ選択 */}
        <View style={styles.scopeWrap}>
          <ScopeSelector />
        </View>

        {isLoading && <ActivityIndicator style={{ marginVertical: 16 }} color={AI.brass} />}

        {/* カテゴリ別円グラフ */}
        {pieData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>カテゴリ別支出</Text>
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - 32}
              height={180}
              chartConfig={{ color: () => AI.indigo }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend
            />
          </View>
        )}

        {/* 最近の取引 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>今日の記録</Text>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>取引がありません</Text>
          ) : (
            recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} categories={categories} />
            ))
          )}
        </View>
      </ScrollView>

      {/* 広告バナー */}
      <AdBanner />

      {/* アカウント情報モーダル */}
      <Modal
        visible={showAccount}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccount(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAccount(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>アカウント情報</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>メールアドレス</Text>
              <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ユーザーID</Text>
              <Text style={styles.infoValueSmall} numberOfLines={1} ellipsizeMode="middle">
                {user?.id ?? '—'}
              </Text>
            </View>

            <View style={styles.dividerLine} />

            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => { setShowAccount(false); navigation.navigate('Profile'); }}
            >
              <Text style={styles.profileBtnText}>プロフィールを編集</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>ログアウト</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAccount(false)}>
              <Text style={styles.closeBtnText}>閉じる</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function TransactionRow({ tx, categories }: { tx: Transaction; categories: Category[] }) {
  const cat = categories.find((c) => c.id === tx.category_id);
  const isIncome = cat?.type === 'income';
  const icon = cat?.icon ?? '📦';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, { backgroundColor: isImageIcon(icon) ? AI.washi2 : AI.indigo }]}>
        <CategoryIcon icon={icon} size={20} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txCategory}>{cat?.name ?? '不明'}</Text>
        {tx.memo ? <Text style={styles.txMemo}>{tx.memo}</Text> : null}
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isIncome ? AI.indigoSoft : '#a44231' }]}>
          {isIncome ? '+' : '-'}{formatCurrency(tx.amount_cents)}
        </Text>
        <Text style={styles.txDate}>{formatDate(tx.transaction_date)}</Text>
      </View>
    </View>
  );
}

function getCategoryType(tx: Transaction, categories: Category[]): 'income' | 'expense' {
  return categories.find((c) => c.id === tx.category_id)?.type ?? 'expense';
}

function buildPieData(transactions: Transaction[], categories: Category[]) {
  const expenseTxs = transactions.filter(
    (t) => getCategoryType(t, categories) === 'expense',
  );
  const map = new Map<string, { name: string; amount: number; color: string }>();
  for (const tx of expenseTxs) {
    const cat = categories.find((c) => c.id === tx.category_id);
    if (!cat) continue;
    const existing = map.get(cat.id);
    if (existing) existing.amount += tx.amount_cents;
    else map.set(cat.id, { name: cat.name, amount: tx.amount_cents, color: cat.color });
  }
  return Array.from(map.values())
    .filter((d) => d.amount > 0)
    .map((d) => ({ ...d, legendFontColor: AI.text, legendFontSize: 12 }));
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AI.washi },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: AI.washi,
    borderBottomWidth: 1, borderBottomColor: AI.rule,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: AI.indigo, letterSpacing: 2 },
  accountBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: AI.washi2,
    borderWidth: 1, borderColor: AI.rule,
    justifyContent: 'center', alignItems: 'center',
  },
  accountIcon: { fontSize: 18 },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },

  // 月切り替え
  monthRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, marginTop: 16,
  },
  arrow: { fontSize: 28, color: AI.brass, paddingHorizontal: 20 },
  monthLabel: { fontSize: 18, fontWeight: 'bold', color: AI.indigo, letterSpacing: 1 },

  // 藍染ヒーローカード
  heroCard: {
    backgroundColor: AI.indigo, borderRadius: 18, padding: 20,
    marginBottom: 4, overflow: 'hidden',
    elevation: 4, shadowColor: AI.indigo,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  heroContent: { position: 'relative' },
  heroSubLabel: {
    fontSize: 10, color: AI.brass, letterSpacing: 4, marginBottom: 8,
  },
  heroBalanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroCurrency: { fontSize: 16, color: AI.brass, fontWeight: '500' },
  heroBalance: { fontSize: 40, fontWeight: '500', color: AI.washi, letterSpacing: -1, lineHeight: 44 },
  progressBg: {
    height: 4, backgroundColor: 'rgba(241,232,211,0.15)',
    borderRadius: 2, marginTop: 14, overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: AI.brass, borderRadius: 2,
  },
  heroSubRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 6,
  },
  heroSubText: { fontSize: 10, color: 'rgba(241,232,211,0.6)' },
  heroStats: {
    flexDirection: 'row', marginTop: 16,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(201,165,92,0.25)',
  },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(201,165,92,0.25)', marginHorizontal: 8 },
  heroStatLabel: { fontSize: 9, color: AI.brassSoft, letterSpacing: 3, marginBottom: 4 },
  heroStatValue: { fontSize: 15, fontWeight: '600', color: AI.washi },

  // スコープ
  scopeWrap: { marginHorizontal: -16, marginBottom: 4 },

  // カード（グラフ・取引）
  card: {
    backgroundColor: AI.washi2,
    borderRadius: 16, padding: 16,
    marginBottom: 12,
    borderWidth: 1, borderColor: AI.rule,
    elevation: 1, shadowColor: AI.indigo,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: AI.textSoft, marginBottom: 12, letterSpacing: 3 },
  emptyText: { color: AI.textSoft, textAlign: 'center', paddingVertical: 12 },

  // 取引行
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AI.rule,
  },
  txIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden',
  },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 14, color: AI.text, fontWeight: '500' },
  txMemo: { fontSize: 11, color: AI.textSoft, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: 'bold' },
  txDate: { fontSize: 10, color: AI.textSoft, marginTop: 2 },

  // モーダル
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(14,23,41,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: AI.washi,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 2, borderTopColor: AI.brass,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: AI.rule,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: AI.indigo, marginBottom: 20, letterSpacing: 1 },
  infoRow: { marginBottom: 16 },
  infoLabel: { fontSize: 11, color: AI.textSoft, marginBottom: 4, letterSpacing: 2 },
  infoValue: { fontSize: 15, color: AI.text, fontWeight: '500' },
  infoValueSmall: { fontSize: 12, color: AI.indigoSoft, fontFamily: 'monospace' },
  dividerLine: { height: 1, backgroundColor: AI.rule, marginVertical: 16 },
  profileBtn: {
    backgroundColor: AI.indigo, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginBottom: 10,
  },
  profileBtnText: { color: AI.brass, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  signOutBtn: {
    borderWidth: 1, borderColor: '#a44231', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginBottom: 10,
  },
  signOutText: { color: '#a44231', fontWeight: 'bold', fontSize: 15 },
  closeBtn: {
    backgroundColor: AI.washi2, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: AI.rule,
  },
  closeBtnText: { color: AI.textSoft, fontWeight: '600', fontSize: 15 },
});
