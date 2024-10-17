import { Modal, Stack, Button } from "@mantine/core";
import type { FC } from "react";
import type { WalletAccount } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accounts: WalletAccount[];
  onAccountSelect: (account: WalletAccount) => void;
  title?: string;
  onDisconnect?: () => void;
};

const AccountsModal: FC<Props> = ({
  isOpen,
  onClose,
  accounts,
  onAccountSelect,
  title = "Select account",
  onDisconnect,
}) => {
  const onAccountSelectInternal = (account: WalletAccount) => () => {
    onAccountSelect(account);
  };

  return (
    <Modal opened={isOpen} onClose={onClose} title={title} centered>
      <Stack gap="xs">
        {accounts.map((account) => (
          <Button
            size="lg"
            variant="subtle"
            key={account.address}
            onClick={onAccountSelectInternal(account)}
            data-testid="btn-account"
          >
            {`${account.meta.name} (${account.meta.source}) - ${account.address.replace(/(.{10})..+/, "$1…")}`}
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
};

export default AccountsModal;
