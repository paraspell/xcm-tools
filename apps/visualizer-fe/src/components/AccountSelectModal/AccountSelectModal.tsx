import { Button, Modal, Stack } from '@mantine/core';
import { type FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TWalletAccount } from '../../types';
import { AccountSelector } from '../AccountSelector/AccountSelector';
import classes from './AccountSelectModal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accounts: TWalletAccount[];
  onAccountSelect: (account: TWalletAccount) => void;
  title?: string;
  onDisconnect?: () => void;
};

export const AccountSelectModal: FC<Props> = ({
  isOpen,
  onClose,
  accounts,
  onAccountSelect,
  title = 'Select account',
  onDisconnect
}) => {
  const [value, setValue] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    setValue(accounts[0]?.address ?? null);
  }, [accounts]);

  const onConfirmClick = () => {
    const account = accounts.find(account => account.address === value);
    if (!account) {
      throw new Error(t('errors.noAccount'));
    }

    onAccountSelect(account);
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={title}
      size="auto"
      centered
      padding="xl"
      classNames={classes}
    >
      <Stack gap="xs">
        <AccountSelector accounts={accounts} value={value} onChange={setValue} />
        <Button mt="sm" onClick={onConfirmClick}>
          Confirm
        </Button>
        {onDisconnect && (
          <Button size="sm" variant="default" onClick={onDisconnect}>
            Disconnect account
          </Button>
        )}
      </Stack>
    </Modal>
  );
};
