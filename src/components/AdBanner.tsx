import { View, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { AI } from '../theme/aizome';
import { useAuthStore } from '../stores/authStore';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

const BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-1205763421067066/9391022435',
  android: 'ca-app-pub-1205763421067066/2341712595',
}) ?? '';

// react-native-google-mobile-ads はネイティブモジュールが必要なため Expo Go では使えない
const AdSDK = isExpoGo ? null : (() => {
  try {
    return require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
  } catch {
    return null;
  }
})();

type Props = { size?: 'banner' | 'large' };

export default function AdBanner({ size = 'banner' }: Props) {
  const { isPremium } = useAuthStore();

  if (isPremium || !AdSDK) return null;

  const { BannerAd, BannerAdSize, TestIds } = AdSDK;

  // 開発ビルドでは本番広告ユニットを叩かない（自己クリックによる無効トラフィック＝
  // AdMob アカウント停止を避けるため、__DEV__ ではテストIDを使う）
  const unitId = __DEV__ ? TestIds.BANNER : BANNER_AD_UNIT_ID;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={unitId}
        size={size === 'large' ? BannerAdSize.LARGE_BANNER : BannerAdSize.BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: AI.rule,
  },
});
