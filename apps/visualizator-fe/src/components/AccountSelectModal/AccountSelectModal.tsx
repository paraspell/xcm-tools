import { Modal, Stack, Button } from '@mantine/core';
import { useEffect, useState, type FC } from 'react';
import { AccountSelector } from '../AccountSelector/AccountSelector';
import classes from './AccountSelectModal.module.css';
import type { TWalletAccount } from '../../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accounts: TWalletAccount[];
  onAccountSelect: (account: TWalletAccount) => void;
  title?: string;
  onDisconnect?: () => void;
};

const AccountSelectModal: FC<Props> = ({
  isOpen,
  onClose,
  accounts,
  onAccountSelect,
  title = 'Select account',
  onDisconnect
}) => {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    setValue(accounts[0]?.address ?? null);
  }, [accounts]);

  const onConfirmClick = () => {
    const account = accounts.find(account => account.address === value);
    if (!account) {
      throw new Error('Account not found');
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

export default AccountSelectModal;
