import type { SetFieldValue, UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';

import { useWallet } from './useWallet';

export const useAutoFillWalletAddress = <T>(
  form: UseFormReturnType<T>,
  field: Parameters<SetFieldValue<T>>[0],
) => {
  const { selectedAccount } = useWallet();

  useEffect(() => {
    if (selectedAccount?.address) {
      form.setFieldValue(
        field,
        selectedAccount.address as Parameters<SetFieldValue<T>>[1],
      );
    }
  }, [selectedAccount?.address]);
};
