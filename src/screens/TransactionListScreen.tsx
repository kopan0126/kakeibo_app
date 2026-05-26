import { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useTransactionFilter } from '../hooks/useActiveGroupId';
import { deleteTransaction, getTransactionsByMonth } from '../services/transactions';
import {
  formatCurrency, formatDate, formatMonth,
  getMonthRange, prevMonth, nextMonth,
} from '../utils/format';
import ScopeSelector from '../components/ScopeSelector';
import CategoryIcon, { isImageIcon } from '../components/CategoryIcon';
import AdBanner from '../components/AdBanner';
import { AI } from '../theme/aizome';
import type { Transaction, Category } from '../types';

export default function TransactionListScreen() {
  const { user } = useAuthStore();
  const filter = useTransactionFilter();
  const {
    transactions, categories, currentMonth, isLoading,
    setTransactions, removeTransaction, setCurrentMonth, setLoading,
  } = useTransactionStore();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { from, to } = getMonthRange(currentMonth);
      const txs = await getTransactionsByMonth(user.id, from, to, filter.showPersonal, filter.groupId);
      setTransactions(txs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, filter.showPersonal, filter.groupId, currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleDelete(tx: Transaction) {
    const cat = categories.find((c) => c.id === tx.category_id);
    Alert.alert(
      '削除しますか？',
      `${cat?.name ?? ''} ${formatCurrency(tx.amount_cents)}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(tx.id);
              removeTransaction(tx.id);
            } catch (e) {
              Alert.alert('エラー', String(e));
            }
          },
        },
      ],
    );
  }

  const grouped = groupByDate(transactions);

  return (
    <View style={styles.container}>
      {/* スコープ選択 */}
      <ScopeSelector />

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

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={AI.indigo} size="large" />
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>この月の取引はありません</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListFooterComponent={<AdBanner />}
          renderItem={({ item }) => (
            <View style={styles.group}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                <Text style={styles.dateDayTotal}>
                  {formatCurrency(
                    item.txs.reduce((s, t) => {
                      const cat = categories.find((c) => c.id === t.category_id);
                      return s + (cat?.type === 'income' ? t.amount_cents : -t.amount_cents);
                    }, 0),
                  )}
                </Text>
              </View>
              {item.txs.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  categories={categories}
                  onDelete={() => handleDelete(tx)}
                />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

function TxRow({
  tx, categories, onDelete,
}: {
  tx: Transaction;
  categories: Category[];
  onDelete: () => void;
}) {
  const cat = categories.find((c) => c.id === tx.category_id);
  const isIncome = cat?.type === 'income';

  const icon = cat?.icon ?? '📦';
  return (
    <View style={styles.txRow}>
      <View style={[
        styles.txIconWrap,
        { backgroundColor: isImageIcon(icon) ? '#F0F0F0' : (cat?.color ?? '#9E9E9E') + '22' },
      ]}>
        <CategoryIcon icon={icon} size={20} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txCategory}>{cat?.name ?? '不明'}</Text>
        {tx.memo ? <Text style={styles.txMemo}>{tx.memo}</Text> : null}
      </View>
      <Text style={[styles.txAmount, { color: isIncome ? AI.income : AI.expense }]}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount_cents)}
      </Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function groupByDate(txs: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const existing = map.get(tx.transaction_date) ?? [];
    existing.push(tx);
    map.set(tx.transaction_date, existing);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txsList]) => ({ date, txs: txsList }));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  monthRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 12, backgroundColor: AI.washi2, borderBottomWidth: 1, borderBottomColor: AI.rule,
  },
  arrow: { fontSize: 28, color: AI.indigo, paddingHorizontal: 20 },
  monthLabel: { fontSize: 17, fontWeight: 'bold', color: AI.text },
  emptyText: { color: AI.textSoft, fontSize: 15 },
  group: { marginBottom: 16 },
  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, paddingHorizontal: 4, marginBottom: 4,
  },
  dateText: { fontSize: 11, fontWeight: '600', color: AI.textSoft, letterSpacing: 1 },
  dateDayTotal: { fontSize: 13, fontWeight: '600', color: AI.text },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: AI.washi2, borderRadius: 12, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: AI.rule,
  },
  txIconWrap: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 15, fontWeight: '500', color: AI.text },
  txMemo: { fontSize: 12, color: AI.textSoft, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: 'bold', marginRight: 8 },
  deleteBtn: { padding: 6 },
  deleteText: { color: AI.rule, fontSize: 14 },
});
