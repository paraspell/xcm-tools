import type { TWalletAccount } from '../types';
import { showErrorNotification } from './notifications';

export const resolveSender = (
  localAccount: string | undefined,
  selectedAccount: TWalletAccount | undefined,
) => {
  if (localAccount) return `//${localAccount}`;

  if (!selectedAccount) {
    showErrorNotification('No account selected, connect wallet first');
    throw Error('No account selected!');
  }

  return selectedAccount.address;
};
