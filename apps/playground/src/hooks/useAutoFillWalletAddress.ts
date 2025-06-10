import type { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';

import { useWallet } from './useWallet';

export const useAutoFillWalletAddress = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFormValues extends Record<string, any>,
>(
  form: UseFormReturnType<TFormValues>,
  fieldName: keyof TFormValues,
): void => {
  const { selectedAccount } = useWallet();

  useEffect(() => {
    if (selectedAccount?.address) {
      form.setFieldValue(
        fieldName,
        selectedAccount.address as TFormValues[typeof fieldName],
      );
    }
  }, [selectedAccount?.address]);
};
