import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { parseReceiptImage } from '../services/receiptOcr';
import { useAuthStore } from '../stores/authStore';
import RewardedAdModal from '../components/RewardedAdModal';
import { AI } from '../theme/aizome';

type Props = {
  navigation: any;
};

export default function ReceiptScanScreen({ navigation }: Props) {
  const { isPremium } = useAuthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [adVisible, setAdVisible] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  async function handleImage(base64: string) {
    // カメラ/ギャラリー側で setIsAnalyzing(true) 済みの場合もあるが冪等なので問題なし
    setIsAnalyzing(true);
    try {
      const result = await parseReceiptImage(base64);
      if (!result || result.totalAmount == null) {
        Alert.alert('読み取り失敗', '画像から金額を読み取れませんでした。別の画像を試してください。');
        return;
      }
      navigation.navigate('ReceiptConfirm', { receipt: result });
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsAnalyzing(false);
    }
  }

  /** URI から 1200px・JPEG 0.6 に縮小して base64 を返す */
  async function resizeAndEncode(uri: string): Promise<string> {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    if (!manipulated.base64) throw new Error('画像の変換に失敗しました');
    return manipulated.base64;
  }

  function requestScan(action: () => void) {
    if (isPremium) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setAdVisible(true);
  }

  function handleAdComplete() {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }

  function handleAdDismiss() {
    setAdVisible(false);
    pendingActionRef.current = null;
  }

  async function launchCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setAdVisible(false);
      Alert.alert('権限が必要', 'カメラの使用を許可してください');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    });
    setAdVisible(false);

    if (!result.canceled && result.assets[0].uri) {
      setIsAnalyzing(true);
      try {
        const base64 = await resizeAndEncode(result.assets[0].uri);
        await handleImage(base64);
      } catch (e) {
        Alert.alert('エラー', String(e));
        setIsAnalyzing(false);
      }
    }
  }

  async function launchGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setAdVisible(false);
      Alert.alert('権限が必要', '写真ライブラリへのアクセスを許可してください');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    setAdVisible(false);

    if (!result.canceled && result.assets[0].uri) {
      setIsAnalyzing(true);
      try {
        const base64 = await resizeAndEncode(result.assets[0].uri);
        await handleImage(base64);
      } catch (e) {
        Alert.alert('エラー', String(e));
        setIsAnalyzing(false);
      }
    }
  }

  function handleCamera() { requestScan(launchCamera); }
  function handleGallery() { requestScan(launchGallery); }

  if (isAnalyzing) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={AI.washi} />
        <Text style={styles.overlayText}>AIが読み取り中... 🔍</Text>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setIsAnalyzing(false)}
        >
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RewardedAdModal
        visible={adVisible}
        onComplete={handleAdComplete}
        onDismiss={handleAdDismiss}
      />

      <Text style={styles.title}>レシート・明細を読み取る</Text>

      {!isPremium && (
        <View style={styles.adNotice}>
          <Text style={styles.adNoticeText}>📺 スキャン前に広告が表示されます</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.bigBtn} onPress={handleCamera}>
          <Text style={styles.bigBtnEmoji}>📷</Text>
          <Text style={styles.bigBtnLabel}>カメラで{'\n'}撮影</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bigBtn} onPress={handleGallery}>
          <Text style={styles.bigBtnEmoji}>🖼</Text>
          <Text style={styles.bigBtnLabel}>ギャラリ{'\n'}から選択</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        対応：レシート・給与明細・領収書・クレカ明細
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: AI.text, marginBottom: 32, letterSpacing: 1 },
  buttonRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  bigBtn: {
    width: 140, height: 140, backgroundColor: AI.washi2, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: AI.rule,
  },
  bigBtnEmoji: { fontSize: 40, marginBottom: 8 },
  bigBtnLabel: { fontSize: 14, fontWeight: '600', color: AI.text, textAlign: 'center' },
  hint: { fontSize: 13, color: AI.textSoft, textAlign: 'center' },
  adNotice: {
    backgroundColor: AI.washi2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: AI.rule, marginBottom: 20,
  },
  adNoticeText: { fontSize: 12, color: AI.textSoft },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AI.indigo },
  overlayText: { fontSize: 18, fontWeight: 'bold', color: AI.brass, marginTop: 16 },
  cancelBtn: { marginTop: 24, paddingVertical: 10, paddingHorizontal: 24 },
  cancelText: { color: 'rgba(241,232,211,0.6)', fontSize: 14 },
});
