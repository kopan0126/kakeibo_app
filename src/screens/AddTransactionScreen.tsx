import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import { createTransaction, getCategories } from '../services/transactions';
import { formatCurrency } from '../utils/format';
import CategoryIcon, { isImageIcon } from '../components/CategoryIcon';
import { AI } from '../theme/aizome';
import type { CategoryType, Category } from '../types';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '⌫'];

export default function AddTransactionScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();
  const { categories, setCategories, addTransaction } = useTransactionStore();

  const [type, setType] = useState<CategoryType>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then(setCategories).catch(console.error);
    }
  }, []);

  useEffect(() => {
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

    setIsSaving(true);
    try {
      const tx = await createTransaction({
        group_id: null,
        user_id: user.id,
        category_id: selectedCategoryId,
        amount_cents: amount,
        memo,
        transaction_date: selectedDate.toISOString().split('T')[0],
        receipt_url: null,
      });
      addTransaction(tx);
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
      <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('ReceiptScan')}>
        <Text style={styles.scanBtnText}>📷 レシート・明細をスキャンして自動入力</Text>
      </TouchableOpacity>

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

      {/* 保存ボタン */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>保存する</Text>}
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
  saveBtn: {
    backgroundColor: AI.indigo, borderRadius: 14, paddingVertical: 18, alignItems: 'center',
    elevation: 3, shadowColor: AI.indigo, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  saveBtnText: { color: AI.brass, fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
});
