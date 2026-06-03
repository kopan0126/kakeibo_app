import { View, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { AI } from '../theme/aizome';
import { useAuthStore } from '../stores/authStore';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// 本番広告ユニットを使うのは「production チャンネルのリリースビルド」のみ。
// それ以外（__DEV__ の開発ビルド / staging・development チャンネル / 内部配信 /
// チャンネル未設定 / Expo Go）はすべて AdMob のテストIDを使う。
// staging などの内部配信ビルドは __DEV__===false になるため、__DEV__ 判定だけでは
// テスターに実広告が出てしまい、閲覧・タップが無効トラフィック＝アカウント停止に
// つながる。チャンネルで判定することでフェイルセーフにする。
const isProductionRelease = !__DEV__ && Updates.channel === 'production';

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

  // production チャンネルのリリースのみ本番広告ユニットを叩く。それ以外はテストID。
  const unitId = isProductionRelease ? BANNER_AD_UNIT_ID : TestIds.BANNER;

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
