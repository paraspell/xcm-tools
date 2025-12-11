import type { TWalletAccount } from '../types';
import { showErrorNotification } from './notifications';

export const resolveSenderAddress = (
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
