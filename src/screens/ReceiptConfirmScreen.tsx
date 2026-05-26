import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import { createTransaction, getCategories } from '../services/transactions';
import { findCategoryBySuggestion } from '../utils/categoryMapping';
import { formatCurrency } from '../utils/format';
import { AI } from '../theme/aizome';
import type { ParsedReceipt, Category, CategoryType } from '../types';

export default function ReceiptConfirmScreen({ route, navigation }: any) {
  const receipt = route.params.receipt as ParsedReceipt;
  const { user } = useAuthStore();
  const { categories, setCategories, addTransaction } = useTransactionStore();

  const [type, setType] = useState<CategoryType>(
    receipt.transactionType === 'income' ? 'income' : 'expense',
  );
  const [amountStr, setAmountStr] = useState(
    receipt.totalAmount != null ? String(receipt.totalAmount) : '',
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (receipt.date) {
      const parsed = new Date(receipt.date);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [memo, setMemo] = useState(receipt.storeName ?? '');
  const [showItems, setShowItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then(setCategories).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const id = findCategoryBySuggestion(receipt.suggestedCategory, categories, type);
      setSelectedCategoryId(id);
    }
  }, [categories, type]);

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
      Alert.alert('保存しました', formatCurrency(amount) + ' を記録しました');
      navigation.popToTop();
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsSaving(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === type);
  const dateLabel = format(selectedDate, 'yyyy年M月d日(E)', { locale: ja });

  const bannerMap: Record<string, { text: string; bg: string; color: string }> = {
    high: { text: '✅ 正確に読み取れました', bg: '#E8F5E9', color: '#2E7D32' },
    medium: { text: '⚠️ 一部不明な点があります。確認してください', bg: '#FFF8E1', color: '#F57F17' },
    low: { text: '❌ 読み取りが不完全です。手動で修正してください', bg: '#FFEBEE', color: '#C62828' },
  };
  const confidenceBanner = bannerMap[receipt.confidence] ?? bannerMap.low;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>読み取り結果を確認</Text>

      {/* 信頼度バナー */}
      <View style={[styles.banner, { backgroundColor: confidenceBanner.bg }]}>
        <Text style={[styles.bannerText, { color: confidenceBanner.color }]}>
          {confidenceBanner.text}
        </Text>
      </View>

      {/* 種別トグル */}
      <View style={styles.toggleRow}>
        {(['expense', 'income'] as CategoryType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleBtn, type === t && { backgroundColor: t === 'expense' ? '#F44336' : '#2196F3' }]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
              {t === 'expense' ? '支出' : '収入'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 金額 */}
      <Text style={styles.label}>金額</Text>
      <TextInput
        style={styles.amountInput}
        value={amountStr}
        onChangeText={(t) => setAmountStr(t.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder="0"
      />

      {/* カテゴリ */}
      <Text style={styles.label}>カテゴリ</Text>
      <View style={styles.categoryGrid}>
        {filteredCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catCard, selectedCategoryId === cat.id && { borderColor: cat.color, borderWidth: 2 }]}
            onPress={() => setSelectedCategoryId(cat.id)}
          >
            <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
              <Text style={styles.catEmoji}>{cat.icon}</Text>
            </View>
            <Text style={styles.catName}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 日付 */}
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
      <Text style={styles.label}>店舗名 / メモ</Text>
      <TextInput
        style={styles.memoInput}
        value={memo}
        onChangeText={setMemo}
        placeholder="メモを入力..."
        maxLength={50}
      />

      {/* 品目リスト（折りたたみ） */}
      {receipt.items.length > 0 && (
        <TouchableOpacity
          style={styles.itemsToggle}
          onPress={() => setShowItems(!showItems)}
        >
          <Text style={styles.itemsToggleText}>
            内訳を見る {showItems ? '▲' : '▼'}（{receipt.items.length}品目）
          </Text>
        </TouchableOpacity>
      )}
      {showItems && receipt.items.map((item: { name: string; amount: number }, i: number) => (
        <View key={i} style={styles.itemRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemAmount}>¥{item.amount.toLocaleString()}</Text>
        </View>
      ))}

      {/* ボタン */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveBtnText}>
          {isSaving ? '保存中...' : 'この内容で保存'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.retryText}>やり直す</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: 'bold', color: AI.text, marginBottom: 12, letterSpacing: 1 },
  banner: { borderRadius: 10, padding: 12, marginBottom: 16 },
  bannerText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  toggleRow: { flexDirection: 'row', marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: AI.rule },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: AI.washi2 },
  toggleText: { fontSize: 15, fontWeight: 'bold', color: AI.textSoft },
  toggleTextActive: { color: AI.washi },
  label: { fontSize: 11, fontWeight: '600', color: AI.textSoft, marginBottom: 8, letterSpacing: 2 },
  amountInput: {
    backgroundColor: AI.washi2, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 20, fontWeight: 'bold', marginBottom: 16,
    borderWidth: 1, borderColor: AI.rule, textAlign: 'right', color: AI.text,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catCard: {
    width: '22%', alignItems: 'center', backgroundColor: AI.washi2,
    borderRadius: 12, padding: 8, borderWidth: 2, borderColor: 'transparent',
  },
  catIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  catEmoji: { fontSize: 18 },
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
    paddingVertical: 12, fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: AI.rule, color: AI.text,
  },
  itemsToggle: { paddingVertical: 10, marginBottom: 4 },
  itemsToggleText: { color: AI.indigo, fontWeight: '600', fontSize: 13 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: AI.washi2, borderRadius: 8, padding: 10, marginBottom: 4,
    borderWidth: 1, borderColor: AI.rule,
  },
  itemName: { fontSize: 13, color: AI.text, flex: 1 },
  itemAmount: { fontSize: 13, fontWeight: '600', color: AI.text },
  saveBtn: {
    backgroundColor: AI.indigo, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 16,
    elevation: 3, shadowColor: AI.indigo, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  saveBtnText: { color: AI.brass, fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
  retryBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  retryText: { color: AI.textSoft, fontSize: 15 },
});
