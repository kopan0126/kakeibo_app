import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useGroupStore } from '../stores/groupStore';
import { useViewStore } from '../stores/viewStore';
import {
  createTransactionBatch, getCategories,
  updateTransaction as updateTransactionApi, updateTransactionsByLink,
} from '../services/transactions';
import { formatCurrency } from '../utils/format';
import {
  genLinkId, scopeToGroupId, txMatchesScope, askLinkedChoice, type ScopeKey,
} from '../utils/transactionScope';
import CategoryIcon, { isImageIcon } from '../components/CategoryIcon';
import { AI } from '../theme/aizome';
import { trackTransactionSaved } from '../services/analytics';
import type { CategoryType, Category, Transaction } from '../types';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '⌫'];

export default function AddTransactionScreen({ navigation, route }: { navigation: any; route: any }) {
  const existingTx: Transaction | undefined = route?.params?.transaction;

  const { user } = useAuthStore();
  const { categories, setCategories, addTransaction, updateTransaction } = useTransactionStore();
  const { groups } = useGroupStore();
  const { selectedScope } = useViewStore();

  const existingCat = existingTx ? categories.find((c) => c.id === existingTx.category_id) : undefined;

  // 記録先スコープ（新規のみ）。デフォルトは個人＋所属グループ全部＝「OFFにしたもの」だけ記録。
  // （グループはログイン後に非同期で読まれるため、未選択集合で持つと後から増えたグループも自動ON）
  const personalLabel = user?.display_name || '個人';
  const [deselectedScopes, setDeselectedScopes] = useState<Set<ScopeKey>>(() => new Set());
  const allScopeKeys: ScopeKey[] = ['personal', ...groups.map((g) => g.id)];

  function toggleScope(key: ScopeKey) {
    setDeselectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const [type, setType] = useState<CategoryType>(existingCat?.type ?? 'expense');
  const [amountStr, setAmountStr] = useState(existingTx ? String(existingTx.amount_cents) : '0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(existingTx?.category_id ?? null);
  const [memo, setMemo] = useState(existingTx?.memo ?? '');
  const [selectedDate, setSelectedDate] = useState(() => {
    if (existingTx) {
      const [y, m, d] = existingTx.transaction_date.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const skipTypeEffect = useRef(true);

  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then(setCategories).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (skipTypeEffect.current) { skipTypeEffect.current = false; return; }
    setSelectedCategoryId(null);
  }, [type]);

  function handleKey(key: string) {
    if (key === '⌫') {
      setAmountStr((s) => (s.length <= 1 ? '0' : s.slice(0, -1)));
      return;
    }
    setAmountStr((s) => {
      const next = s === '0' ? key : s + key;
      return next.length > 8 ? s : next;
    });
  }

  function handleDateChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  }

  async function handleSave() {
    const amount = parseInt(amountStr, 10);
    if (!amount || amount === 0) {
      Alert.alert('エラー', '金額を入力してください');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('エラー', 'カテゴリを選択してください');
      return;
    }
    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const patch = {
      category_id: selectedCategoryId,
      amount_cents: amount,
      memo,
      transaction_date: dateStr,
    };

    // ── 編集 ──────────────────────────────────────────────
    if (existingTx) {
      let target: 'one' | 'both' = 'one';
      if (existingTx.link_id) {
        const choice = await askLinkedChoice({
          title: '更新する範囲',
          message: 'この記録は個人とグループの両方に登録されています。',
          oneLabel: 'この記録だけ更新',
          bothLabel: '両方を更新',
        });
        if (choice === 'cancel') return;
        target = choice;
      }
      setIsSaving(true);
      try {
        if (target === 'both' && existingTx.link_id) {
          const updatedRows = await updateTransactionsByLink(existingTx.link_id, patch);
          const activeRow = updatedRows.find((t) => txMatchesScope(t, selectedScope));
          updateTransaction(activeRow ?? { ...existingTx, ...patch });
        } else {
          const updated = await updateTransactionApi(existingTx.id, patch);
          updateTransaction(updated);
        }
        navigation.goBack();
      } catch (e) {
        Alert.alert('エラー', String(e));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // ── 新規 ──────────────────────────────────────────────
    const scopeKeys: ScopeKey[] = allScopeKeys.filter((k) => !deselectedScopes.has(k));
    if (scopeKeys.length === 0) {
      Alert.alert('エラー', '記録先を1つ以上選んでください');
      return;
    }

    setIsSaving(true);
    try {
      const base = {
        user_id: user.id,
        category_id: selectedCategoryId,
        amount_cents: amount,
        memo,
        transaction_date: dateStr,
        receipt_url: null,
      };
      // 2スコープ以上なら link_id で束ねる（まとめて編集／削除できるように）
      const linkId = scopeKeys.length >= 2 ? genLinkId() : null;
      const rows = scopeKeys.map((s) => ({
        ...base,
        group_id: scopeToGroupId(s),
        ...(linkId ? { link_id: linkId } : {}),
      }));
      const txs = await createTransactionBatch(rows);

      // 水増し防止: 共有ストアには「今表示中スコープの行」だけ反映する
      const activeRow = txs.find((t) => txMatchesScope(t, selectedScope));
      if (activeRow) addTransaction(activeRow);

      trackTransactionSaved({
        type,
        amount,
        hasCategory: !!selectedCategoryId,
        hasMemo: memo.trim().length > 0,
        isGroupTransaction: scopeKeys.some((s) => s !== 'personal'),
      });
      setAmountStr('0');
      setSelectedCategoryId(null);
      setMemo('');
      setSelectedDate(new Date());
      Alert.alert('保存しました', formatCurrency(amount) + ' を記録しました');
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsSaving(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === type);
  const dateLabel = format(selectedDate, 'yyyy年M月d日(E)', { locale: ja });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* 収入/支出トグル */}
      <View style={styles.toggleRow}>
        {(['expense', 'income'] as CategoryType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleBtn, type === t && { backgroundColor: t === 'expense' ? AI.expense : AI.income }]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
              {t === 'expense' ? '支出' : '収入'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 金額表示 */}
      <View style={styles.amountDisplay}>
        <Text style={styles.amountText}>
          ¥{parseInt(amountStr, 10).toLocaleString('ja-JP')}
        </Text>
      </View>

      {/* テンキー */}
      <View style={styles.numpad}>
        {KEYS.map((key) => (
          <TouchableOpacity key={key} style={styles.numKey} onPress={() => handleKey(key)}>
            <Text style={styles.numKeyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* スキャンで入力（テンキーとカテゴリの間） */}
      {!existingTx && (
        <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('ReceiptScan')}>
          <Text style={styles.scanBtnText}>📷 レシート・明細をスキャンして自動入力</Text>
        </TouchableOpacity>
      )}

      {/* カテゴリ選択 */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>カテゴリ</Text>
        <TouchableOpacity
          style={styles.manageCatBtn}
          onPress={() => navigation.navigate('CategoryManage')}
        >
          <Text style={styles.manageCatBtnText}>⚙️ カテゴリ管理</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoryGrid}>
        {filteredCategories.map((cat) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            selected={selectedCategoryId === cat.id}
            onPress={() => setSelectedCategoryId(cat.id)}
          />
        ))}
      </View>

      {/* 日付ピッカー */}
      <Text style={styles.label}>日付</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>📅 {dateLabel}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
          locale="ja"
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <TouchableOpacity style={styles.dateCloseBtn} onPress={() => setShowDatePicker(false)}>
          <Text style={styles.dateCloseBtnText}>決定</Text>
        </TouchableOpacity>
      )}

      {/* メモ */}
      <Text style={styles.label}>メモ（任意）</Text>
      <TextInput
        style={styles.memoInput}
        placeholder="メモを入力..."
        value={memo}
        onChangeText={setMemo}
        maxLength={50}
      />

      {/* 記録先スコープ（新規・グループ所属時のみ） */}
      {!existingTx && groups.length > 0 && (
        <>
          <Text style={styles.label}>記録先（複数選択可）</Text>
          <View style={styles.scopeChips}>
            {[
              { key: 'personal' as ScopeKey, label: personalLabel },
              ...groups.map((g) => ({ key: g.id as ScopeKey, label: g.name })),
            ].map((opt) => {
              const on = !deselectedScopes.has(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.scopeChip, on && styles.scopeChipOn]}
                  onPress={() => toggleScope(opt.key)}
                >
                  <Text style={[styles.scopeChipText, on && styles.scopeChipTextOn]}>
                    {on ? '✓ ' : ''}{opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* 保存ボタン */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>{existingTx ? '更新する' : '保存する'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function CategoryCard({ cat, selected, onPress }: { cat: Category; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.catCard, selected && { borderColor: cat.color, borderWidth: 2 }]}
      onPress={onPress}
    >
      <View style={[
        styles.catIcon,
        { backgroundColor: isImageIcon(cat.icon) ? '#F0F0F0' : cat.color + '22' },
      ]}>
        <CategoryIcon icon={cat.icon} size={22} />
      </View>
      <Text style={styles.catName}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  content: { padding: 16, paddingTop: 24, paddingBottom: 40 },
  toggleRow: { flexDirection: 'row', marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: AI.rule },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: AI.washi2 },
  toggleText: { fontSize: 16, fontWeight: 'bold', color: AI.textSoft },
  toggleTextActive: { color: AI.washi },
  amountDisplay: {
    backgroundColor: AI.indigo, borderRadius: 16, padding: 24, alignItems: 'flex-end', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(201,165,92,0.3)',
  },
  amountText: { fontSize: 40, fontWeight: '500', color: AI.washi, letterSpacing: -1 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  numKey: {
    width: '30%', paddingVertical: 16, backgroundColor: AI.washi2,
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: AI.rule,
  },
  numKeyText: { fontSize: 22, fontWeight: '500', color: AI.indigo },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '600', color: AI.textSoft, letterSpacing: 3 },
  manageCatBtn: {
    backgroundColor: AI.washi2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: AI.rule,
  },
  manageCatBtnText: { fontSize: 12, color: AI.indigo, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catCard: {
    width: '22%', alignItems: 'center', backgroundColor: AI.washi2,
    borderRadius: 12, padding: 8, borderWidth: 2, borderColor: 'transparent',
  },
  catIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  catEmoji: { fontSize: 20 },
  catName: { fontSize: 10, color: AI.text, textAlign: 'center' },
  dateButton: {
    backgroundColor: AI.washi2, borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: AI.rule,
  },
  dateText: { fontSize: 15, color: AI.text },
  dateCloseBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 24, marginBottom: 12 },
  dateCloseBtnText: { color: AI.brass, fontWeight: 'bold', fontSize: 16 },
  memoInput: {
    backgroundColor: AI.washi2, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 15, marginBottom: 16,
    borderWidth: 1, borderColor: AI.rule, color: AI.text,
  },
  scanBtn: {
    backgroundColor: AI.washi2, borderRadius: 10, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: AI.rule, alignItems: 'center',
  },
  scanBtnText: { color: AI.indigo, fontSize: 14, fontWeight: '600' },
  scopeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  scopeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: AI.washi2, borderWidth: 1, borderColor: AI.rule,
  },
  scopeChipOn: { backgroundColor: AI.indigo, borderColor: AI.indigo },
  scopeChipText: { fontSize: 13, color: AI.textSoft, fontWeight: '600' },
  scopeChipTextOn: { color: AI.brass },
  saveBtn: {
    backgroundColor: AI.indigo, borderRadius: 14, paddingVertical: 18, alignItems: 'center',
    elevation: 3, shadowColor: AI.indigo, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  saveBtnText: { color: AI.brass, fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
});
