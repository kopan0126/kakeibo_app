import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['ja'] = {
  monthNames: [
    '睦月（1月）', '如月（2月）', '弥生（3月）', '卯月（4月）',
    '皐月（5月）', '水無月（6月）', '文月（7月）', '葉月（8月）',
    '長月（9月）', '神無月（10月）', '霜月（11月）', '師走（12月）',
  ],
  monthNamesShort: [
    '睦月', '如月', '弥生', '卯月', '皐月', '水無月',
    '文月', '葉月', '長月', '神無月', '霜月', '師走',
  ],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日',
};
LocaleConfig.defaultLocale = 'ja';
import { useAuthStore } from '../stores/authStore';
import { useViewStore } from '../stores/viewStore';
import { useTransactionStore } from '../stores/transactionStore';
import { getByMonth, getDailyTotals, getCategories } from '../services/transactions';
import { getMemberProfiles, type MemberProfile } from '../services/family';
import { formatCurrency } from '../utils/format';
import ScopeSelector from '../components/ScopeSelector';
import CategoryIcon, { isImageIcon } from '../components/CategoryIcon';
import MemberAvatar from '../components/MemberAvatar';
import { AI } from '../theme/aizome';
import type { Transaction, Category } from '../types';

export default function CalendarScreen() {
  const { user } = useAuthStore();
  const { selectedScope } = useViewStore();
  const { categories, setCategories } = useTransactionStore();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [dailyTotals, setDailyTotals] = useState<Record<string, { income: number; expense: number }>>({});
  const [members, setMembers] = useState<Record<string, MemberProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  // グループ表示時のみ記入者（名前・アバター）を表示する
  const showMember = selectedScope !== 'personal';

  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then(setCategories).catch(console.error);
    }
  }, []);

  const loadMonthData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [txs, totals] = await Promise.all([
        getByMonth(selectedScope, user.id, currentYear, currentMonth),
        getDailyTotals(selectedScope, user.id, currentYear, currentMonth, categories),
      ]);
      setMonthTransactions(txs);
      setDailyTotals(totals);
      if (selectedScope !== 'personal') {
        const profiles = await getMemberProfiles(txs.map((t) => t.user_id));
        setMembers(profiles);
      } else {
        setMembers({});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedScope, currentYear, currentMonth, categories]);

  useFocusEffect(useCallback(() => { loadMonthData(); }, [loadMonthData]));

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const markedDates = useMemo(() => {
    const marks: Record<string, { selected?: boolean; selectedColor?: string }> = {};
    if (selectedDate) {
      marks[selectedDate] = { selected: true, selectedColor: AI.indigo };
    }
    return marks;
  }, [selectedDate]);

  const monthIncome = useMemo(
    () => Object.values(dailyTotals).reduce((s, d) => s + d.income, 0),
    [dailyTotals],
  );
  const monthExpense = useMemo(
    () => Object.values(dailyTotals).reduce((s, d) => s + d.expense, 0),
    [dailyTotals],
  );

  const displayTransactions = useMemo(() => {
    if (!selectedDate) return monthTransactions;
    return monthTransactions.filter((tx) => tx.transaction_date === selectedDate);
  }, [monthTransactions, selectedDate]);

  function handleDayPress(day: DateData) {
    setSelectedDate((prev) => (prev === day.dateString ? null : day.dateString));
  }

  function handleMonthChange(date: DateData) {
    setCurrentYear(date.year);
    setCurrentMonth(date.month);
    setSelectedDate(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.scopeWrap}>
        <ScopeSelector />
      </View>

      <FlatList
        data={displayTransactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Calendar
              current={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              markedDates={markedDates}
              hideExtraDays={false}
              enableSwipeMonths
              dayComponent={({ date, state }) => {
                if (!date) return null;
                const totals = dailyTotals[date.dateString];
                const isToday = date.dateString === todayStr;
                const isSelected = date.dateString === selectedDate;
                const isDisabled = state === 'disabled';
                const isOtherMonth = state === 'disabled' &&
                  (parseInt(date.dateString.split('-')[1], 10) !== currentMonth);

                return (
                  <View
                    style={[
                      styles.dayCell,
                      isToday && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isOtherMonth ? styles.dayOtherMonth : isDisabled && styles.dayDisabled,
                        isSelected && styles.dayNumberSelected,
                      ]}
                      onPress={() => date && handleDayPress(date as DateData)}
                    >
                      {date.day}
                    </Text>
                    {!isOtherMonth && totals?.expense ? (
                      <Text style={styles.dayExpense} numberOfLines={1}>
                        {totals.expense >= 10000
                          ? `${Math.floor(totals.expense / 10000)}万`
                          : `¥${totals.expense.toLocaleString()}`}
                      </Text>
                    ) : null}
                    {!isOtherMonth && totals?.income ? (
                      <Text style={styles.dayIncome} numberOfLines={1}>
                        {totals.income >= 10000
                          ? `${Math.floor(totals.income / 10000)}万`
                          : `¥${totals.income.toLocaleString()}`}
                      </Text>
                    ) : null}
                  </View>
                );
              }}
              theme={{
                calendarBackground: AI.washi2,
                monthTextColor: AI.text,
                textMonthFontWeight: 'bold',
                textMonthFontSize: 17,
                arrowColor: AI.indigo,
                textDayFontSize: 14,
                textDayHeaderFontSize: 11,
                dayTextColor: AI.text,
              }}
              style={styles.calendar}
            />

            {/* 月次サマリー */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>収入</Text>
                <Text style={styles.summaryValue}>{formatCurrency(monthIncome)}</Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>支出</Text>
                <Text style={styles.summaryValue}>{formatCurrency(monthExpense)}</Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>合計</Text>
                <Text style={styles.summaryValue}>{formatCurrency(monthIncome - monthExpense)}</Text>
              </View>
            </View>

            {isLoading && <ActivityIndicator style={{ marginVertical: 12 }} color={AI.indigo} />}

            {selectedDate && (
              <Text style={styles.listHeader}>
                {parseInt(selectedDate.split('-')[1], 10)}月{parseInt(selectedDate.split('-')[2], 10)}日の取引
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TxRow
            tx={item}
            categories={categories}
            member={members[item.user_id]}
            showMember={showMember}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>
              {selectedDate ? 'この日の取引はありません' : 'この月の取引はありません'}
            </Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function TxRow({
  tx, categories, member, showMember,
}: {
  tx: Transaction;
  categories: Category[];
  member?: MemberProfile;
  showMember: boolean;
}) {
  const cat = categories.find((c) => c.id === tx.category_id);
  const isIncome = cat?.type === 'income';
  const icon = cat?.icon ?? '📦';

  return (
    <View style={styles.txRow}>
      {showMember && (
        <View style={styles.memberCol}>
          <MemberAvatar name={member?.display_name ?? ''} avatarUrl={member?.avatar_url ?? null} size={28} />
          <Text style={styles.memberName} numberOfLines={1}>{member?.display_name || '不明'}</Text>
        </View>
      )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  scopeWrap: { marginTop: 48 },
  listContent: { paddingBottom: 40 },
  calendar: {
    borderRadius: 12, marginHorizontal: 12, marginBottom: 8,
    borderWidth: 1, borderColor: AI.rule,
  },
  dayCell: {
    width: 44, height: 56, alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 4, borderRadius: 8,
  },
  dayCellToday: { borderWidth: 1.5, borderColor: AI.brass },
  dayCellSelected: { backgroundColor: AI.indigo },
  dayNumber: { fontSize: 14, fontWeight: '500', color: AI.text },
  dayNumberSelected: { color: AI.brass, fontWeight: 'bold' },
  dayDisabled: { color: AI.rule },
  dayOtherMonth: { color: AI.rule },
  dayExpense: { fontSize: 8, color: AI.expense, marginTop: 1 },
  dayIncome: { fontSize: 8, color: AI.income, marginTop: 0 },
  summaryBar: {
    flexDirection: 'row', marginHorizontal: 12, marginBottom: 12,
    backgroundColor: AI.indigo, borderRadius: 12, padding: 14,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: 'rgba(241,232,211,0.65)', marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: 'bold', color: AI.brass },
  listHeader: {
    fontSize: 11, fontWeight: '600', color: AI.textSoft,
    paddingHorizontal: 16, paddingVertical: 8, letterSpacing: 2,
  },
  emptyText: { color: AI.textSoft, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: AI.washi2, borderRadius: 12, padding: 12, marginHorizontal: 12, marginBottom: 6,
    borderWidth: 1, borderColor: AI.rule,
  },
  memberCol: { width: 44, alignItems: 'center', marginRight: 8 },
  memberName: { fontSize: 9, color: AI.textSoft, marginTop: 3, maxWidth: 44, textAlign: 'center' },
  txIconWrap: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 15, fontWeight: '500', color: AI.text },
  txMemo: { fontSize: 12, color: AI.textSoft, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
});
