import { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { AI } from '../theme/aizome';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// 本番用 AdMob リワード広告ユニットID（EAS Build後に差し替え）
// import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
// const REWARDED_AD_UNIT_ID = Platform.select({
//   ios: 'ca-app-pub-1205763421067066/2949276746',
//   android: 'ca-app-pub-1205763421067066/2419472328',
// }) ?? TestIds.REWARDED;

const AD_DURATION = 5; // 秒（本番は実際の動画長さに合わせる）

type Phase = 'loading' | 'playing' | 'done';

type Props = {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
};

export default function RewardedAdModal({ visible, onComplete, onDismiss }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [countdown, setCountdown] = useState(AD_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setPhase('loading');
      setCountdown(AD_DURATION);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // 広告ロードをシミュレート（本番: RewardedAd.load()）
    const loadTimeout = setTimeout(() => setPhase('playing'), 1000);
    return () => clearTimeout(loadTimeout);
  }, [visible]);

  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          setPhase('done');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  return (
    <Modal visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.backdrop}>

        {phase === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AI.brass} />
            <Text style={styles.loadingText}>広告を読み込み中...</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'playing' && (
          <>
            <View style={styles.topBar}>
              {isExpoGo && (
                <Text style={styles.devBadge}>開発用モック</Text>
              )}
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}秒</Text>
              </View>
            </View>

            <View style={styles.center}>
              <Text style={styles.tvIcon}>📺</Text>
              <Text style={styles.playingText}>広告を視聴中...</Text>
              <Text style={styles.playingSubText}>
                {isExpoGo ? '（開発環境: モック広告）' : '動画をご覧ください'}
              </Text>
            </View>

            <View style={styles.bottomBar}>
              <Text style={styles.skipHint}>視聴後にスキャンできます</Text>
            </View>
          </>
        )}

        {phase === 'done' && (
          <View style={styles.center}>
            <Text style={styles.doneIcon}>✓</Text>
            <Text style={styles.doneTitle}>視聴完了！</Text>
            <Text style={styles.doneSubText}>レシートスキャンが利用できます</Text>
            <TouchableOpacity style={styles.startBtn} onPress={onComplete}>
              <Text style={styles.startBtnText}>スキャンを開始する</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  devBadge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  countdownBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  countdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  tvIcon: {
    fontSize: 64,
  },
  playingText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '600',
  },
  playingSubText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  bottomBar: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  skipHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 16,
  },
  dismissBtn: {
    marginTop: 32,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  dismissText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  doneIcon: {
    fontSize: 64,
    color: AI.brass,
  },
  doneTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  doneSubText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  startBtn: {
    marginTop: 8,
    backgroundColor: AI.brass,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  startBtnText: {
    color: AI.indigo,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
