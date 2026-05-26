import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Expo Go では通知機能（特にリモート通知）は制限される
const isExpoGo = Constants.executionEnvironment === 'storeClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (isExpoGo) {
    console.log('[Notifications] Skipped: limited support in Expo Go.');
    return false;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const TITLES: Record<string, string> = {
  daily: '📊 昨日の家計レポート',
  weekly: '📈 今週の家計まとめ',
  monthly: '🗓️ 今月の家計レポート完成',
};

export async function scheduleReportNotification(
  reportType: 'daily' | 'weekly' | 'monthly',
  content: string,
): Promise<void> {
  if (isExpoGo) return;

  const title = TITLES[reportType] ?? '家計レポート';
  const body = content.length > 50 ? content.slice(0, 50) + '...' : content;

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (isExpoGo) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
