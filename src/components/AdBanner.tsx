// 広告バナーコンポーネント
// EAS Build 後に react-native-google-mobile-ads を有効化する
// Expo Go ではプレースホルダーを表示

import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// AdMob テスト用ID（本番前に実際のIDに差し替え）
// const BANNER_AD_UNIT_ID = Platform.select({
//   ios: 'ca-app-pub-xxxxx/xxxxx',
//   android: 'ca-app-pub-xxxxx/xxxxx',
// });

type Props = {
  size?: 'banner' | 'large';
};

export default function AdBanner({ size = 'banner' }: Props) {
  // Expo Go ではスキップ（広告SDKが使えない）
  if (isExpoGo) {
    return null;
  }

  // EAS Build 後に実装:
  // import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
  // return <BannerAd unitId={BANNER_AD_UNIT_ID} size={BannerAdSize.BANNER} />;

  // 開発中はプレースホルダー
  return (
    <View style={[styles.container, size === 'large' && styles.large]}>
      <Text style={styles.text}>Ad Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  large: { height: 100 },
  text: { fontSize: 12, color: '#9E9E9E' },
});
