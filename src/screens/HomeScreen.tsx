import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Share,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useTransactionFilter } from '../hooks/useActiveGroupId';
import { getTransactionsByMonth, getCategories } from '../services/transactions';
import { formatCurrency, formatDate, formatDateFull, todayISO } from '../utils/format';
import ScopeSelector from '../components/ScopeSelector';
import CategoryIcon, { isImageIcon } from '../components/CategoryIcon';
import { hasAizomeCategoryIcon } from '../components/AizomeCategoryIcons';
import AdBanner from '../components/AdBanner';
import AsanohaBg from '../components/AsanohaBg';
import { AI } from '../theme/aizome';
import { useGroupStore } from '../stores/groupStore';
import type { Transaction, Category } from '../types';

const DONUT_PALETTE = [
  AI.brass, '#D9BC85', '#A8845A', '#8a9d6a', '#7e8aa3', '#5a6b87', '#384d75',
];

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const span = Math.min(endDeg - startDeg, 359.99);
  const start = ((startDeg - 90) * Math.PI) / 180;
  const end = ((startDeg - 90 + span) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = span > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();
  const filter = useTransactionFilter();
  const { categories, setCategories } = useTransactionStore();
  const { groups } = useGroupStore();
  // ホームはアプリ起動日（今日）の収支に統一。共有ストアの月データとは
  // 切り離し、ローカル state で「今日」のぶんだけを保持する。
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setLoading] = useState(false);

  const today = todayISO();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txs, cats] = await Promise.all([
        getTransactionsByMonth(user.id, today, today, filter.showPersonal, filter.groupId),
        categories.length === 0 ? getCategories() : Promise.resolve(categories),
      ]);
      setTransactions(txs);
      if (categories.length === 0) setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, filter.showPersonal, filter.groupId, today]);

  // 画面フォーカス時に再読込（記入後の反映 + 日付が変わった場合の追従）
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const income = transactions
    .filter((t) => getCategoryType(t, categories) === 'income')
    .reduce((s, t) => s + t.amount_cents, 0);

  const expense = transactions
    .filter((t) => getCategoryType(t, categories) === 'expense')
    .reduce((s, t) => s + t.amount_cents, 0);

  const balance = income - expense;
  const pieData = buildPieData(transactions, categories);
  const recent = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家計簿</Text>
        <TouchableOpacity style={styles.accountBtn} onPress={() => navigation.navigate('Menu')}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.accountAvatar} />
          ) : (
            <Text style={styles.accountIcon}>👤</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 今日の日付 */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{formatDateFull(new Date())}</Text>
        </View>

        {/* 収支サマリーカード（深藍 × 麻の葉） */}
        <View style={styles.heroCard}>
          <AsanohaBg opacity={0.5} />
          <View style={styles.heroContent}>
            <Text style={styles.heroSubLabel}>今日の収支</Text>
            <View style={styles.heroBalanceRow}>
              <Text style={styles.heroCurrency}>¥</Text>
              <Text style={[styles.heroBalance, { color: balance >= 0 ? AI.washi : AI.expense }]}>
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
                <Text style={[styles.heroStatValue, { color: AI.expense }]}>{formatCurrency(expense)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* スコープ選択 */}
        <View style={styles.scopeWrap}>
          <ScopeSelector />
        </View>

        {/* 家族共有カード */}
        {groups.length > 0 ? (
          groups.map((g) => (
            <View key={g.id} style={styles.card}>
              <Text style={styles.sectionTitle}>家族グループ</Text>
              <Text style={styles.familyGroupName}>{g.name}</Text>
              <Text style={styles.familyLabel}>招待コード</Text>
              <View style={styles.familyCodeRow}>
                <View style={styles.familyCodeBox}>
                  <Text style={styles.familyCode}>{g.invite_code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.familyShareBtn}
                  onPress={() => {
                    const link = Linking.createURL(`join/${g.invite_code}`);
                    Share.share({
                      message: `家計簿アプリで一緒に家計を管理しませんか？\n\n下のリンクからアプリを開いて自動参加できます👇\n${link}`,
                    });
                  }}
                >
                  <Text style={styles.familyShareText}>招待リンクを送る</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>家族で共有</Text>
            <Text style={styles.familyDesc}>家族グループを作成すると、収支データを共有できます</Text>
            <TouchableOpacity
              style={styles.familySetupBtn}
              onPress={() => navigation.navigate('Family')}
            >
              <Text style={styles.familySetupText}>家族設定を開く</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && <ActivityIndicator style={{ marginVertical: 16 }} color={AI.brass} />}

        {/* カテゴリ別ドーナツチャート */}
        {pieData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>カテゴリ別支出</Text>
            <View style={styles.donutRow}>
              <View style={styles.donutWrap}>
                <Svg width={120} height={120}>
                  {(() => {
                    const total = pieData.reduce((s, d) => s + d.amount, 0);
                    let cursor = 0;
                    return pieData.map((d, i) => {
                      const deg = (d.amount / total) * 360;
                      const path = arcPath(60, 60, 44, cursor, cursor + deg);
                      cursor += deg;
                      return (
                        <Path
                          key={i}
                          d={path}
                          stroke={DONUT_PALETTE[i % DONUT_PALETTE.length]}
                          strokeWidth={16}
                          fill="none"
                        />
                      );
                    });
                  })()}
                </Svg>
                <View style={styles.donutCenter}>
                  <Text style={styles.donutTotal}>{pieData.length}項目</Text>
                </View>
              </View>
              <View style={styles.rankList}>
                {pieData.slice(0, 5).map((d, i) => (
                  <View key={i} style={styles.rankRow}>
                    <View style={[styles.rankDot, { backgroundColor: DONUT_PALETTE[i % DONUT_PALETTE.length] }]} />
                    <Text style={styles.rankName} numberOfLines={1}>{d.name}</Text>
                    <Text style={styles.rankAmount}>{formatCurrency(d.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
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
    </SafeAreaView>
  );
}

function TransactionRow({ tx, categories }: { tx: Transaction; categories: Category[] }) {
  const cat = categories.find((c) => c.id === tx.category_id);
  const isIncome = cat?.type === 'income';
  const icon = cat?.icon ?? '📦';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, { backgroundColor: hasAizomeCategoryIcon(cat?.name) ? AI.chip : isImageIcon(icon) ? AI.washi2 : AI.indigo }]}>
        <CategoryIcon icon={icon} size={28} name={cat?.name} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txCategory}>{cat?.name ?? '不明'}</Text>
        {tx.memo ? <Text style={styles.txMemo}>{tx.memo}</Text> : null}
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isIncome ? AI.indigoSoft : AI.expense }]}>
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
    .sort((a, b) => b.amount - a.amount);
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
  accountAvatar: { width: 38, height: 38, borderRadius: 19 },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },

  // 今日の日付
  dateRow: {
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, marginTop: 16,
  },
  dateLabel: { fontSize: 18, fontWeight: 'bold', color: AI.indigo, letterSpacing: 1 },

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

  // 家族共有カード
  familyGroupName: { fontSize: 16, fontWeight: 'bold', color: AI.indigo, marginBottom: 10 },
  familyLabel: { fontSize: 10, color: AI.textSoft, letterSpacing: 2, marginBottom: 6 },
  familyCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  familyCodeBox: {
    flex: 1, backgroundColor: AI.indigo, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  familyCode: { fontSize: 20, fontWeight: 'bold', letterSpacing: 4, color: AI.brass },
  familyShareBtn: {
    backgroundColor: AI.brass, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  familyShareText: { color: AI.indigo, fontWeight: 'bold', fontSize: 14 },
  familyDesc: { fontSize: 13, color: AI.textSoft, marginBottom: 12 },
  familySetupBtn: {
    backgroundColor: AI.indigo, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  familySetupText: { color: AI.brass, fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

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

  // ドーナツチャート
  donutRow: { flexDirection: 'row', alignItems: 'center' },
  donutWrap: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' },
  donutCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  donutTotal: { fontSize: 11, color: AI.textSoft, fontWeight: '600' },
  rankList: { flex: 1, paddingLeft: 16 },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rankDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  rankName: { flex: 1, fontSize: 12, color: AI.text },
  rankAmount: { fontSize: 12, fontWeight: '600', color: AI.text },

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
});
