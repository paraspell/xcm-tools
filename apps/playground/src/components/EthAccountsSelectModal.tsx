import { Button, Modal, Stack } from '@mantine/core';
import type { FC } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accounts: string[];
  onAccountSelect: (account: string) => void;
  onDisconnect?: () => void;
};

const EthAccountsSelectModal: FC<Props> = ({
  isOpen,
  onClose,
  accounts,
  onAccountSelect,
  onDisconnect,
}) => (
  <Modal
    opened={isOpen}
    onClose={onClose}
    title="Select Ethereum Account"
    centered
  >
    <Stack gap="sm">
      {accounts.map((account, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onAccountSelect(account)}
        >
          {account}
        </Button>
      ))}
      {onDisconnect && (
        <Button size="sm" variant="default" onClick={onDisconnect}>
          Disconnect account
        </Button>
      )}
    </Stack>
  </Modal>
);

export default EthAccountsSelectModal;
