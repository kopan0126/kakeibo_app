import { Alert } from 'react-native';
import type { Transaction } from '../types';

export type ScopeKey = 'personal' | string;

// 同時入力した複数スコープのコピーを束ねる link_id（UUID v4）。
// 単なるグルーピングキーなので暗号強度は不要（Math.random で十分）。
export function genLinkId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// スコープ → transactions.group_id（personal は NULL）
export function scopeToGroupId(scope: ScopeKey): string | null {
  return scope === 'personal' ? null : scope;
}

// tx が選択中スコープに属するか（ストアに反映する行の判定に使用）
export function txMatchesScope(tx: Transaction, scope: ScopeKey): boolean {
  return scope === 'personal' ? tx.group_id === null : tx.group_id === scope;
}

// 個人＋グループの両方に登録された記録に対し、「この記録だけ / 両方」を選ばせる。
export function askLinkedChoice(opts: {
  title: string;
  message: string;
  oneLabel: string;
  bothLabel: string;
  destructive?: boolean;
}): Promise<'one' | 'both' | 'cancel'> {
  return new Promise((resolve) => {
    Alert.alert(
      opts.title,
      opts.message,
      [
        { text: 'キャンセル', style: 'cancel', onPress: () => resolve('cancel') },
        {
          text: opts.oneLabel,
          style: opts.destructive ? 'destructive' : 'default',
          onPress: () => resolve('one'),
        },
        {
          text: opts.bothLabel,
          style: opts.destructive ? 'destructive' : 'default',
          onPress: () => resolve('both'),
        },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    );
  });
}
