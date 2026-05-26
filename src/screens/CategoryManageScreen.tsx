import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert, ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import {
  getCategories,
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
} from '../services/transactions';
import CategoryIcon, { isImageIcon } from '../components/CategoryIcon';
import { AI } from '../theme/aizome';
import type { Category, CategoryType } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 選択可能な絵文字一覧
const EMOJIS = [
  '🍜','🍱','🍕','🍔','🍺','🍰','☕','🥤','🍣','🥗',
  '🍎','🥕','🛒','🏠','🏡','💡','🔧','🛁','🪑','🛋️',
  '🚗','🚌','🚇','✈️','⛽','🚲','🚕','🛵','🚂','🚁',
  '👕','👟','💄','💅','💇','🧴','👔','👗','👒','🧢',
  '💊','🏥','😷','🩺','🏃','🧘','🏋️','💪','🧠','❤️',
  '🎮','🎬','🎵','🎸','⚽','📚','🎯','🎉','🎁','🎊',
  '🐾','🐕','🐱','🌸','🌿','🌺','🌍','🏖️','⛷️','🎣',
  '💰','💴','📈','💼','🏦','💎','🌟','🏆','⭐','🎓',
  '💻','📱','🖥️','📷','⌚','🎒','🔑','🏷️','📦','🎀',
];

// 選択可能なカラー一覧
const COLORS = [
  '#F44336','#E91E63','#9C27B0','#3F51B5','#2196F3',
  '#00BCD4','#009688','#4CAF50','#8BC34A','#FFC107',
  '#FF9800','#FF5722','#795548','#607D8B','#9E9E9E',
];

export default function CategoryManageScreen() {
  const { user } = useAuthStore();
  const { categories, setCategories } = useTransactionStore();

  const [activeType, setActiveType] = useState<CategoryType>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);

  // モーダルフォーム状態
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🎯');
  const [formColor, setFormColor] = useState('#4CAF50');
  const [formType, setFormType] = useState<CategoryType>('expense');

  const refreshCategories = useCallback(async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  }, [setCategories]);

  const defaultCategories = categories.filter(
    (c) => c.is_default && c.type === activeType,
  );
  const customCategories = categories.filter(
    (c) => !c.is_default && c.type === activeType && c.user_id === user?.id,
  );

  function openCreate() {
    setEditTarget(null);
    setFormName('');
    setFormIcon('🎯');
    setFormColor('#4CAF50');
    setFormType(activeType);
    setIsCreating(true);
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setFormType(cat.type);
    setIsCreating(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditTarget(null);
  }

  /** フォトライブラリから写真を選択して 80×80 JPEG に縮小 */
  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要', 'フォトライブラリへのアクセスを許可してください');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsPickingPhoto(true);
    try {
      // 80×80 JPEG に圧縮してデータURIに変換
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 80, height: 80 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (manipulated.base64) {
        setFormIcon(`data:image/jpeg;base64,${manipulated.base64}`);
      }
    } catch (e) {
      Alert.alert('エラー', '写真の処理に失敗しました');
      console.error(e);
    } finally {
      setIsPickingPhoto(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!formName.trim()) {
      Alert.alert('入力エラー', 'カテゴリ名を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      if (isCreating) {
        await createCustomCategory(user.id, formName.trim(), formIcon, formColor, formType);
      } else if (editTarget) {
        await updateCustomCategory(editTarget.id, formName.trim(), formIcon, formColor);
      }
      await refreshCategories();
      closeModal();
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!editTarget) return;
    Alert.alert(
      'カテゴリを削除',
      `「${editTarget.name}」を削除しますか？\n過去の取引データには影響しません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomCategory(editTarget.id);
              await refreshCategories();
              closeModal();
            } catch (e) {
              Alert.alert('エラー', String(e));
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* 支出/収入タブ */}
      <View style={styles.tabRow}>
        {(['expense', 'income'] as CategoryType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeType === t && styles.tabActive]}
            onPress={() => setActiveType(t)}
          >
            <Text style={[styles.tabText, activeType === t && styles.tabTextActive]}>
              {t === 'expense' ? '支出' : '収入'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* デフォルトカテゴリ */}
        <Text style={styles.sectionTitle}>デフォルトカテゴリ</Text>
        <Text style={styles.sectionNote}>変更・削除はできません</Text>
        <View style={styles.categoryGrid}>
          {defaultCategories.map((cat) => (
            <View key={cat.id} style={styles.catCard}>
              <View style={[styles.catIconWrap, { backgroundColor: cat.color + '22' }]}>
                <CategoryIcon icon={cat.icon} size={22} />
              </View>
              <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
            </View>
          ))}
        </View>

        {/* カスタムカテゴリ */}
        <View style={styles.customHeader}>
          <Text style={styles.sectionTitle}>あなただけのカテゴリ</Text>
          <Text style={styles.sectionNote}>タップして編集・削除</Text>
        </View>

        {customCategories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>まだカスタムカテゴリはありません</Text>
          </View>
        ) : (
          <View style={styles.categoryGrid}>
            {customCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catCard, styles.customCatCard, { borderColor: cat.color }]}
                onPress={() => openEdit(cat)}
              >
                <View style={[
                  styles.catIconWrap,
                  { backgroundColor: isImageIcon(cat.icon) ? '#F0F0F0' : cat.color + '22' },
                ]}>
                  <CategoryIcon icon={cat.icon} size={22} />
                </View>
                <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
                <View style={styles.editBadge}>
                  <Text style={styles.editBadgeText}>✏️</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 追加ボタン */}
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>＋ カスタムカテゴリを追加</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* カテゴリ編集モーダル */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {isCreating ? 'カスタムカテゴリを追加' : 'カテゴリを編集'}
            </Text>

            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── アイコン選択 ── */}
              <Text style={styles.formLabel}>アイコン</Text>

              {/* 写真から選ぶボタン */}
              <TouchableOpacity
                style={styles.photoPickerBtn}
                onPress={handlePickPhoto}
                disabled={isPickingPhoto}
              >
                {isPickingPhoto ? (
                  <ActivityIndicator color={AI.indigo} size="small" />
                ) : (
                  <>
                    <Text style={styles.photoPickerBtnIcon}>📷</Text>
                    <Text style={styles.photoPickerBtnText}>フォトライブラリから選ぶ</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 選択中の写真プレビュー（画像が選ばれている場合） */}
              {isImageIcon(formIcon) && (
                <View style={styles.selectedPhotoRow}>
                  <CategoryIcon icon={formIcon} size={48} />
                  <Text style={styles.selectedPhotoLabel}>選択中の写真</Text>
                  <TouchableOpacity
                    style={styles.clearPhotoBtn}
                    onPress={() => setFormIcon('🎯')}
                  >
                    <Text style={styles.clearPhotoBtnText}>✕ 解除</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 区切り */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>または絵文字から選ぶ</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 絵文字グリッド */}
              <View style={styles.emojiGrid}>
                {EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiCell,
                      formIcon === emoji && styles.emojiCellSelected,
                    ]}
                    onPress={() => setFormIcon(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── 名前入力 ── */}
              <Text style={styles.formLabel}>カテゴリ名</Text>
              <TextInput
                style={styles.formInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="例：カフェ、趣味..."
                placeholderTextColor="#BDBDBD"
                maxLength={15}
              />

              {/* ── カラー選択 ── */}
              <Text style={styles.formLabel}>カラー</Text>
              <View style={styles.colorRow}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                      formColor === color && styles.colorDotSelected,
                    ]}
                    onPress={() => setFormColor(color)}
                  />
                ))}
              </View>

              {/* ── 種別（新規作成時のみ） ── */}
              {isCreating && (
                <>
                  <Text style={styles.formLabel}>種別</Text>
                  <View style={styles.typeRow}>
                    {(['expense', 'income'] as CategoryType[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typeBtn,
                          formType === t && {
                            backgroundColor: t === 'expense' ? AI.expense : AI.income,
                          },
                        ]}
                        onPress={() => setFormType(t)}
                      >
                        <Text style={[
                          styles.typeBtnText,
                          formType === t && styles.typeBtnTextActive,
                        ]}>
                          {t === 'expense' ? '💸 支出' : '💰 収入'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* ── プレビュー ── */}
              <Text style={styles.formLabel}>プレビュー</Text>
              <View style={styles.previewRow}>
                <View style={[
                  styles.previewIcon,
                  { backgroundColor: isImageIcon(formIcon) ? '#F0F0F0' : formColor + '22' },
                ]}>
                  <CategoryIcon icon={formIcon} size={30} />
                </View>
                <Text style={[styles.previewName, { color: formColor }]}>
                  {formName || 'カテゴリ名'}
                </Text>
              </View>

              {/* ── 削除ボタン（編集時のみ） ── */}
              {!isCreating && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>🗑️ このカテゴリを削除する</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* 保存・キャンセルボタン */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>保存する</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const CARD_SIZE = Math.floor((SCREEN_WIDTH - 32 - 24) / 4);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: AI.washi2,
    borderBottomWidth: 1,
    borderBottomColor: AI.rule,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: AI.indigo },
  tabText: { fontSize: 15, fontWeight: '600', color: AI.textSoft },
  tabTextActive: { color: AI.indigo },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: AI.text, marginBottom: 2 },
  sectionNote: { fontSize: 11, color: AI.textSoft, marginBottom: 10 },
  customHeader: { marginTop: 20, marginBottom: 2 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catCard: {
    width: CARD_SIZE,
    alignItems: 'center',
    backgroundColor: AI.washi2,
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: AI.rule,
  },
  customCatCard: { borderWidth: 1.5 },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  catName: { fontSize: 10, color: AI.text, textAlign: 'center', lineHeight: 14 },
  editBadge: { position: 'absolute', top: 4, right: 4 },
  editBadgeText: { fontSize: 11 },
  emptyBox: {
    backgroundColor: AI.washi2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AI.rule,
    borderStyle: 'dashed',
  },
  emptyText: { color: AI.textSoft, fontSize: 13 },
  addBtn: {
    backgroundColor: AI.indigo,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: { color: AI.brass, fontWeight: 'bold', fontSize: 15 },

  // ── モーダル ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: AI.washi,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: AI.rule,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: AI.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  formScroll: { maxHeight: 500 },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AI.textSoft,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 2,
  },

  // 写真ピッカー
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AI.washi2,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AI.indigo,
  },
  photoPickerBtnIcon: { fontSize: 20 },
  photoPickerBtnText: { color: AI.indigo, fontWeight: 'bold', fontSize: 14 },

  // 選択中の写真プレビュー
  selectedPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AI.washi2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AI.rule,
  },
  selectedPhotoLabel: { flex: 1, fontSize: 13, color: AI.textSoft },
  clearPhotoBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearPhotoBtnText: { color: 'AI.danger', fontSize: 12, fontWeight: '600' },

  // 区切り
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: AI.rule },
  dividerText: { fontSize: 11, color: AI.textSoft },

  // 絵文字グリッド
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 16 },
  emojiCell: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: AI.washi2,
  },
  emojiCellSelected: {
    backgroundColor: AI.washi2,
    borderWidth: 2,
    borderColor: AI.indigo,
  },
  emojiText: { fontSize: 24 },

  // 名前入力
  formInput: {
    backgroundColor: AI.washi2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: AI.rule,
    marginBottom: 16,
    color: AI.text,
  },

  // カラー
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: AI.text,
    transform: [{ scale: 1.15 }],
  },

  // 種別
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: AI.washi2,
    borderWidth: 1,
    borderColor: AI.rule,
  },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: AI.textSoft },
  typeBtnTextActive: { color: '#fff' },

  // プレビュー
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AI.washi2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: AI.rule,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewName: { fontSize: 17, fontWeight: 'bold' },

  // 削除ボタン
  deleteBtn: {
    borderWidth: 1,
    borderColor: 'AI.danger',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteBtnText: { color: 'AI.danger', fontWeight: '600', fontSize: 14 },

  // 保存・キャンセルボタン行
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AI.rule,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: AI.washi2,
    borderWidth: 1,
    borderColor: AI.rule,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: AI.textSoft },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: AI.indigo,
  },
  saveBtnText: { fontSize: 15, fontWeight: 'bold', color: AI.brass },
});
