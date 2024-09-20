import { Modal, Stack, Button } from "@mantine/core";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { FC } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accounts: InjectedAccountWithMeta[];
  onAccountSelect: (account: InjectedAccountWithMeta) => () => void;
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
}) => (
  <Modal opened={isOpen} onClose={onClose} title={title} centered>
    <Stack gap="xs">
      {accounts.map((account) => (
        <Button
          size="lg"
          variant="subtle"
          key={account.address}
          onClick={onAccountSelect(account)}
          data-testid="btn-account"
        >
          {`${account.meta.name} (${
            account.meta.source
          }) - ${account.address.replace(/(.{10})..+/, "$1…")}`}
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

export default AccountsModal;
